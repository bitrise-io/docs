#!/usr/bin/env python3
"""
build_ui_library.py  —  the single source of truth builder
=====================================================================
Scans the live product + docs and (re)generates two artifacts:

  1. ui_copy_library.json   — structured inventory of every UI string, where it
                              lives (repo/file), how often, and how the docs
                              reference it. This is the reusable "UI copy library"
                              (feeds translation, UX-copy consistency, staleness checks).
  2. ja-do-not-translate-glossary.yaml — the tiered do-not-translate glossary
                              consumed by the translate-on-PR job.

Because it is fully scripted and deterministic, CI can run it on a schedule so the
library/glossary stay in sync with the product instead of going stale.

SOURCES
  --repo     (repeatable) a frontend repo checkout (React/Rails UI strings)
  --steplib  (optional)   a bitrise-steplib checkout -> canonical Step names + input titles
  --docs     (optional)   a docs checkout -> cross-check (coverage + hard/context tiering)
  --out-dir               where to write the two artifacts

USAGE
  python3 build_ui_library.py \
      --repo bitrise-website --repo bitrise-workflow-editor \
      --repo bitrise-codespaces --repo bitkit \
      --steplib bitrise-steplib \
      --docs docs \
      --out-dir .

REQUIREMENTS
  pip install pyyaml
"""
import argparse, json, os, re, sys
from collections import defaultdict

# ---------------------------------------------------------------------------
# Curated constants (stable — rarely change). Extraction adds the rest.
# ---------------------------------------------------------------------------
PROTECT_PATTERNS = [
    ("fenced_code_block", r'```[\s\S]*?```'),
    ("inline_code",       r'`[^`]+`'),
    ("url",               r'https?://[^\s)]+'),
    # Whole <NT>...</NT> spans, matched BEFORE mdx_component (which would
    # otherwise mask the opening/closing tags one at a time and leave the
    # protected text exposed in between). This is the actual do-not-translate
    # enforcement now — see localization/README.md — the term lists below
    # exist to feed scripts/add_notranslate_tags.py (which tags the docs),
    # not to be injected into the translation prompt anymore.
    ("nt_span",           r'<NT\b[^>]*>[\s\S]*?</NT>'),
    ("env_var",           r'\$?[A-Z][A-Z0-9_]{2,}'),
    ("filename",          r'\S+\.(yml|yaml|json|sh|rb|swift|kt|kts|java|md|mdx|plist|xml|gradle|podspec|toml|lock|cfg|env)'),
    ("mdx_component",     r'</?[A-Za-z][^>]*>'),
    ("docusaurus_admonition", r':::[a-z]+'),
    ("template_placeholder",  r'(\{\{[^}]*\}\}|\{%[^%]*%\}|\$\{[^}]*\})'),
]
CURATED = {
    "bitrise_products": ["Bitrise","Bitrise CI","Bitrise Platform","Bitrise Insights","Build Cache",
        "Release Management","Bitrise MCP","Workflow Editor","Bitrise CLI","Cloud Controller",
        "bitrise.io","bitrise.yml","Bitrise Step","Bitrise Steps"],
    "bitrise_concepts": ["Workflow","Workflows","Step","Steps","Step bundle","Step bundles","Step inputs",
        "Pipeline","Pipelines","Stack","Stacks","Build machine","Build machines","Project","Projects",
        "Workspace","Workspaces","Trigger","Trigger map","Secrets","Environment Variables","Verified Steps",
        "Default Workflows","Selective builds","Rolling builds","Build priority","Service credential user",
        "Bitrise dashboard"],
    "third_party": ["GitHub","GitHub Cloud","GitHub Enterprise Server","GitLab","Bitbucket","Bitbucket Server",
        "Xcode","Fastlane","Slack","AWS","Amazon EC2","EC2","Google Play","Google Play Console",
        "App Store Connect","Apple","Apple ID","Jenkins","App Center","Unity","Expo","Flutter","React Native",
        "Ionic","Cordova","DeployGate","Codecov","Firebase","Docker","Gradle","CocoaPods","npm","Maven",
        "Auth0","Okta","OneLogin","Ping Identity","Entra ID","Azure AD","Idaptive","AD FS","GCP"],
    "platforms_languages": ["Android","iOS","macOS","Linux","Windows","Java","Kotlin","Swift","Objective-C",
        "Ruby","Node.js","JavaScript","TypeScript"],
    "acronyms": ["CI","CD","CI/CD","SSO","SAML","SCIM","OIDC","OAuth","SSH","HTTPS","HTTP","VPN","API","MCP",
        "IPA","AMI","GHES","EDR","JWT","UI","UX","URL","YAML","JSON","SDK","CLI","VM","OS","PR","SDK","2FA",
        "IP","DNS","TLS","UDID"],
}

# ---------------------------------------------------------------------------
# Extraction (shared with extract_ui_strings.py logic)
# ---------------------------------------------------------------------------
CODE_EXTS = (".tsx", ".jsx", ".ts", ".js")
SKIP_DIRS = {"node_modules",".git","dist","build",".next","coverage","__mocks__","vendor","public","assets"}
SKIP_FILE_MARKERS = (".test.",".spec.",".stories.",".d.ts")
UI_PROPS = ["aria-label","title","placeholder","label","alt","tooltip","helperText","heading","subtitle",
            "header","emptyText","buttonLabel","confirmButtonText","cancelButtonText","submitLabel","message"]
PROP_RE = re.compile(r'\b('+"|".join(map(re.escape,UI_PROPS))+r')\s*=\s*(?:"([^"\n]{1,80})"|\'([^\'\n]{1,80})\'|\{\s*[\'"`]([^\'"`\n]{1,80})[\'"`]\s*\})')
JSX_TEXT_RE = re.compile(r'>\s*([^<>{}\n][^<>{}]{0,79})\s*<')
_IDENT=re.compile(r'^[a-z][a-zA-Z0-9]*$'); _CONST=re.compile(r'^[A-Z0-9_]+$'); _LETTER=re.compile(r'[A-Za-z]')
_BANNED=set('{}<>=\\|@#$^~`')

def is_ui_string(s):
    s=s.strip()
    if not (2<=len(s)<=80): return False
    if not _LETTER.search(s): return False
    if any(c in _BANNED for c in s): return False
    if "://" in s or s.startswith("/") or s.startswith("."): return False
    if any(s.endswith(e) for e in (".tsx",".ts",".js",".jsx",".css",".json",".yml",".png",".svg")): return False
    if _IDENT.match(s) or _CONST.match(s): return False
    if s.count(" ")==0 and s.islower(): return False
    return True

def scan_repo(repo, lib):
    name=os.path.basename(repo.rstrip("/"))
    for root,dirs,files in os.walk(repo):
        dirs[:]=[d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if not f.endswith(CODE_EXTS) or any(m in f for m in SKIP_FILE_MARKERS): continue
            p=os.path.join(root,f)
            try: text=open(p,encoding="utf-8",errors="ignore").read()
            except: continue
            rel=f"{name}/{os.path.relpath(p,repo)}"
            for m in PROP_RE.finditer(text):
                v=(m.group(2) or m.group(3) or m.group(4) or "").strip()
                if is_ui_string(v): rec(lib,v,f"prop:{m.group(1)}",rel,"app_ui")
            for m in JSX_TEXT_RE.finditer(text):
                v=m.group(1).strip()
                if is_ui_string(v): rec(lib,v,"jsx-text",rel,"app_ui")

def scan_steplib(steplib, lib):
    """Canonical Step names + input labels from step.yml `title:` fields."""
    try: import yaml
    except ImportError:
        print("  ! PyYAML missing -> skipping steplib", file=sys.stderr); return
    cnt=0
    for root,dirs,files in os.walk(steplib):
        dirs[:]=[d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f!="step.yml": continue
            try: data=yaml.safe_load(open(os.path.join(root,f),encoding="utf-8"))
            except: continue
            if not isinstance(data,dict): continue
            t=data.get("title")
            if isinstance(t,str) and is_ui_string(t):
                rec(lib,t.strip(),"step.yml:title",f"steplib/{os.path.relpath(root,steplib)}","step_name"); cnt+=1
            for inp in (data.get("inputs") or []):
                if isinstance(inp,dict):
                    it=(inp.get("opts") or {}).get("title")
                    if isinstance(it,str) and is_ui_string(it):
                        rec(lib,it.strip(),"step.yml:input","steplib","step_input")
    print(f"  steplib: {cnt} step titles")

def rec(lib,value,context,rel,kind):
    e=lib[value.lower()]
    e["display"]=e.get("display") or value
    e["count"]+=1; e["contexts"].add(context); e["kinds"].add(kind)
    if len(e["files"])<8: e["files"].add(rel)

# ---------------------------------------------------------------------------
# Docs cross-check
# ---------------------------------------------------------------------------
DOC_EXTS=(".md",".mdx",".html",".adoc")
def load_docs(docs):
    parts=[]
    for root,dirs,files in os.walk(docs):
        dirs[:]=[d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(DOC_EXTS):
                try: parts.append(open(os.path.join(root,f),encoding="utf-8",errors="ignore").read())
                except: pass
    return "\n".join(parts)

def classify(term, corpus, low):
    t=term.lower(); total=ui=0; i=0
    while True:
        idx=low.find(t,i)
        if idx==-1: break
        total+=1
        left=corpus[max(0,idx-25):idx]; right=corpus[idx+len(t):idx+len(t)+25]
        if (left.rstrip().endswith("**") and right.lstrip().startswith("**")) or \
           (left.rstrip().endswith("`") and right.lstrip().startswith("`")) or \
           ('class="guibutton"' in left) or \
           re.search(r'(?i)(click|select|tap|press|choose|the)\s*$',left) or \
           re.search(r'(?i)^\s*(button|tab|field|menu|dropdown|option|page|dialog|toggle|checkbox)',right):
            ui+=1
        i=idx+len(t)
    return total,ui

# ---------------------------------------------------------------------------
# Emit
# ---------------------------------------------------------------------------
def yq(s): return '"'+s.replace('\\','\\\\').replace('"','\\"')+'"'

def emit_glossary(path, tiers, curated):
    L=["# ============================================================================",
       "# Bitrise docs — Japanese do-not-translate glossary  (AUTO-GENERATED)",
       "# Regenerated by build_ui_library.py. Do not hand-edit; edit the builder instead.",
       "# KEY ASSUMPTION: the app UI is English-only for JA users, so on-screen strings",
       "#   stay English in the JA docs. CONFIRMED with product: no plan to localize app UI to JA.",
       "# ============================================================================",
       "protect_patterns:"]
    for n,rx in PROTECT_PATTERNS:
        L.append(f"  - name: {n}"); L.append(f"    regex: {yq(rx)}")
    L.append("")
    L.append("do_not_translate:")
    for k,vals in curated.items():
        L.append(f"  {k}:")
        for v in vals: L.append(f"    - {yq(v)}")
        L.append("")
    L.append(f"  step_names:   # {len(tiers['step'])} — canonical + doc-surfaced")
    for v in sorted(tiers["step"],key=str.lower): L.append(f"    - {yq(v)}")
    L.append("")
    L.append(f"  ui_labels_hard_protect:   # {len(tiers['hard'])}")
    for v in sorted(tiers["hard"],key=str.lower): L.append(f"    - {yq(v)}")
    L.append("")
    L.append(f"  ui_labels_context_protect:   # {len(tiers['context'])} — freeze only when marked as UI")
    for v in sorted(tiers["context"],key=str.lower): L.append(f"    - {yq(v)}")
    L.append("")
    open(path,"w",encoding="utf-8").write("\n".join(L)+"\n")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--repo",action="append",default=[])
    ap.add_argument("--steplib")
    ap.add_argument("--docs")
    ap.add_argument("--out-dir",default=".")
    a=ap.parse_args()

    lib=defaultdict(lambda:{"display":None,"count":0,"contexts":set(),"kinds":set(),"files":set()})
    for r in a.repo:
        if os.path.isdir(r): print(f"Scanning {r} ..."); scan_repo(r,lib)
        else: print(f"  ! missing repo {r}",file=sys.stderr)
    if a.steplib and os.path.isdir(a.steplib): print(f"Scanning steplib {a.steplib} ..."); scan_steplib(a.steplib,lib)
    print(f"Extracted {len(lib)} unique strings.")

    corpus=low=None
    if a.docs and os.path.isdir(a.docs):
        print("Loading docs ..."); corpus=load_docs(a.docs); low=corpus.lower()
        print(f"Docs corpus {len(corpus):,} chars.")

    tiers={"step":set(),"hard":set(),"context":set()}
    out_records=[]
    for e in lib.values():
        s=e["display"]; total=ui=0
        if low is not None: total,ui=classify(s,corpus,low)
        # tiering
        if "step_name" in e["kinds"] or "step_input" in e["kinds"]:
            tiers["step"].add(s)
        elif low is None or total>0:                 # only keep app strings that appear in docs (when docs given)
            plain=total-ui
            if s.count(" ")>=1 and (ui>=plain or plain<=1): tiers["hard"].add(s)
            elif ui>=plain and total>0:               tiers["hard"].add(s)
            elif total>0:                             tiers["context"].add(s)
            elif low is None:                         tiers["hard"].add(s)
        out_records.append({"string":s,"count":e["count"],"kinds":sorted(e["kinds"]),
                            "contexts":sorted(e["contexts"]),"files":sorted(e["files"]),
                            "doc_hits":total,"doc_ui_formatted":ui})

    os.makedirs(a.out_dir,exist_ok=True)
    lib_path=os.path.join(a.out_dir,"ui_copy_library.json")
    json.dump({"generated_from":a.repo+([a.steplib] if a.steplib else []),
               "total_strings":len(out_records),"strings":sorted(out_records,key=lambda r:-r["count"])},
              open(lib_path,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    gl_path=os.path.join(a.out_dir,"ja-do-not-translate-glossary.yaml")
    emit_glossary(gl_path,tiers,CURATED)
    print(f"\nWrote {lib_path}  ({len(out_records)} strings)")
    print(f"Wrote {gl_path}  (step:{len(tiers['step'])} hard:{len(tiers['hard'])} context:{len(tiers['context'])})")

if __name__=="__main__":
    main()
