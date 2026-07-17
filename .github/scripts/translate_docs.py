#!/usr/bin/env python3
"""
translate_docs.py  —  translate changed English docs to Japanese
=====================================================================
Given a list of changed English Markdown files, translate each to Japanese with
the Claude API, applying the do-not-translate glossary so product names, UI
labels, Step names, code, and URLs stay verbatim English.

Design:
  1. MASK — protect_patterns (code, URLs, env vars, filenames, MDX) are replaced
     with placeholder tokens BEFORE the model sees the text, then restored after.
     The model literally cannot alter them.
  2. INSTRUCT — the do_not_translate term lists are injected into the system
     prompt as a hard rule. context-protect terms get the "keep English only when
     used as a UI label" nuance.
  3. WRITE — output goes to the Japanese path (configurable to your Docusaurus i18n layout).

USAGE
  python3 translate_docs.py \
      --glossary ja-do-not-translate-glossary.yaml \
      --src-root en --dest-root i18n/ja/docusaurus-plugin-content-docs/current \
      file1.md file2.md ...

  # or read changed files from stdin (one per line) — see the workflow.

ENV
  ANTHROPIC_API_KEY  (required)
  TRANSLATE_MODEL    (optional, default claude-sonnet-4-6)

REQUIREMENTS
  pip install anthropic pyyaml
"""
import argparse, os, re, sys, yaml

def load_terms(glossary):
    data=yaml.safe_load(open(glossary,encoding="utf-8"))
    patterns=[(p["name"],p["regex"]) for p in data.get("protect_patterns",[])]
    dnt=data.get("do_not_translate",{})
    hard, context = [], []
    for k,vals in dnt.items():
        if not isinstance(vals,list): continue
        (context if k=="ui_labels_context_protect" else hard).extend(vals)
    return patterns, sorted(set(hard)), sorted(set(context))

def mask(text, patterns):
    store={}; n=0
    for _,rx in patterns:
        def repl(m):
            nonlocal n
            tok=f"⟦P{n}⟧"; store[tok]=m.group(0); n+=1; return tok
        text=re.sub(rx, repl, text)
    return text, store

def unmask(text, store):
    for tok,orig in store.items():
        text=text.replace(tok,orig)
    return text

def system_prompt(hard, context):
    return (
        "You are a professional technical translator localizing Bitrise developer "
        "documentation from English to Japanese.\n"
        "Rules:\n"
        "1. Translate prose into natural, professional Japanese.\n"
        "2. Do NOT translate the following product names, UI labels, and Step names — keep them "
        "EXACTLY as written in English (no katakana, no translation):\n"
        + "\n".join(f"   - {t}" for t in hard) + "\n"
        "3. The following are common words that are ALSO UI labels. Keep them in English ONLY when "
        "they clearly refer to an on-screen element (e.g. inside bold or a 'click X' instruction); "
        "translate them normally otherwise:\n"
        + "\n".join(f"   - {t}" for t in context) + "\n"
        "4. Never alter placeholder tokens shaped like ⟦P0⟧, ⟦P1⟧ — keep them exactly and in place.\n"
        "5. Preserve all Markdown/MDX structure, links, headings, and front-matter keys.\n"
        "Output ONLY the translated Markdown, nothing else."
    )

def translate_text(client, model, sysp, text):
    msg=client.messages.create(
        model=model, max_tokens=8000, system=sysp,
        messages=[{"role":"user","content":text}])
    return "".join(b.text for b in msg.content if getattr(b,"type",None)=="text")

def dest_path(src, src_root, dest_root):
    # map .../<src_root>/rest -> <dest_root>/rest ; fallback: swap /en/ -> /ja/
    marker=f"/{src_root}/"
    if marker in src:
        rest=src.split(marker,1)[1]
        return os.path.join(dest_root, rest)
    if src.startswith(src_root+"/"):
        return os.path.join(dest_root, src[len(src_root)+1:])
    return src.replace("/en/","/ja/")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--glossary",required=True)
    ap.add_argument("--src-root",default="en")
    ap.add_argument("--dest-root",default="ja")
    ap.add_argument("files",nargs="*")
    a=ap.parse_args()

    files=a.files or [l.strip() for l in sys.stdin if l.strip()]
    files=[f for f in files if f.endswith((".md",".mdx"))]
    if not files:
        print("No markdown files to translate."); return

    try:
        import anthropic
    except ImportError:
        print("pip install anthropic", file=sys.stderr); sys.exit(1)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY not set", file=sys.stderr); sys.exit(1)

    patterns, hard, context = load_terms(a.glossary)
    client=anthropic.Anthropic()
    model=os.environ.get("TRANSLATE_MODEL","claude-sonnet-4-6")
    sysp=system_prompt(hard, context)

    for src in files:
        if not os.path.isfile(src):
            print(f"  skip (missing): {src}"); continue
        raw=open(src,encoding="utf-8").read()
        masked,store=mask(raw,patterns)
        ja=translate_text(client,model,sysp,masked)
        ja=unmask(ja,store)
        dst=dest_path(src,a.src_root,a.dest_root)
        os.makedirs(os.path.dirname(dst) or ".",exist_ok=True)
        open(dst,"w",encoding="utf-8").write(ja)
        print(f"  translated {src} -> {dst}")

if __name__=="__main__":
    main()
