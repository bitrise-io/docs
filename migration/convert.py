#!/usr/bin/env python3
"""
Paligo XML export → Docusaurus-ready Markdown migration.

Reads the monolithic Paligo export XML, resolves the structure tree and all
text/component resources, and writes out a folder hierarchy of .md files
suitable for Docusaurus.

Usage:
    python3 migration/convert.py <paligo-export.xml> <output-dir> [--url-map <url_map.json>]
"""

import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "e": "http://ns.expertinfo.se/cms/xmlns/export/1.0",
    "db": "http://docbook.org/ns/docbook",
    "xinfo": "http://ns.expertinfo.se/cms/xmlns/1.0",
    "xi": "http://www.w3.org/2001/XInclude",
    "xlink": "http://www.w3.org/1999/xlink",
}

for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)


def ns(prefix, local):
    return f"{{{NS[prefix]}}}{local}"


TAB_IMPORTS = (
    "import Tabs from '@theme/Tabs';\n"
    "import TabItem from '@theme/TabItem';\n"
    "import GlossTerm from '@site/src/components/GlossTerm';\n"
)


_MDX_ALLOWED_TAGS = {
    "Tabs", "TabItem", "GlossTerm",
    "br", "hr", "sup", "sub", "strong", "em", "code", "pre", "p",
    "div", "span", "a", "img", "ul", "ol", "li",
    "table", "thead", "tbody", "tr", "th", "td",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "dl", "dt", "dd", "details", "summary", "figure", "figcaption",
}

_TAG_RE = re.compile(r"<(/?)([A-Za-z][A-Za-z0-9_-]*)([^>]*)>")
_NUM_LT_RE = re.compile(r"<(\s*\d)")
# `<>` and `</>` are React fragment syntax — but in our content they're
# usually literal "<>". Always escape.
_FRAGMENT_RE = re.compile(r"<(/?)>")
# `{app-slug}`, `{org-slug}` etc. — placeholder tokens that look like JSX
# expressions to MDX. Hyphenated names can never be valid JSX expressions,
# so escape them as literal text.
_PLACEHOLDER_RE = re.compile(r"\{([a-z][a-z0-9]*-[a-z0-9-]+)\}")
_PARTIAL_REF_RE = re.compile(r"^\s*<Partial_[A-Za-z0-9_]+ />\s*$")


def escape_mdx_unknown_tags(body):
    """Escape `<word>`/`<digits>` patterns in an MDX body, leaving allow-listed
    components (Tabs, TabItem, GlossTerm, plus our own Partial_* refs) and
    code blocks/inline code untouched. Mirrors the preprocessor in
    docusaurus.config.ts so partial files (imported directly, not routed by the
    docs plugin) parse cleanly.
    """
    out_lines = []
    in_fence = False
    for line in body.split("\n"):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            out_lines.append(line)
            continue
        if in_fence:
            out_lines.append(line)
            continue
        # Don't touch `<Partial_xxx />` reference lines
        if _PARTIAL_REF_RE.match(line):
            out_lines.append(line)
            continue

        # Process line, skipping inline `code` segments
        parts = line.split("`")
        for i in range(0, len(parts), 2):
            seg = parts[i]
            seg = _TAG_RE.sub(
                lambda m: m.group(0) if m.group(2) in _MDX_ALLOWED_TAGS or m.group(2).startswith("Partial_")
                else f"&lt;{m.group(1)}{m.group(2)}{m.group(3)}&gt;",
                seg,
            )
            seg = _NUM_LT_RE.sub(r"&lt;\1", seg)
            seg = _FRAGMENT_RE.sub(r"&lt;\1&gt;", seg)
            seg = _PLACEHOLDER_RE.sub(r"\\{\1\\}", seg)
            parts[i] = seg
        out_lines.append("`".join(parts))
    return "\n".join(out_lines)


# Partial registry — populated by PaligoMigrator._build_partials_index().
# Maps UUID → {"slug": "opening-the-workflow-editor",
#              "component": "Partial_OpeningTheWorkflowEditor",
#              "title": "Opening the Workflow Editor"}.
PARTIALS_INDEX = {}


def _pascal_case(text):
    """Convert 'Opening the Workflow Editor' → 'OpeningTheWorkflowEditor'.
    Strips characters that aren't valid in JSX identifiers."""
    text = re.sub(r"[^\w\s-]", " ", text or "")
    parts = re.split(r"[\s_-]+", text.strip())
    out = "".join(p[:1].upper() + p[1:] for p in parts if p)
    if not out:
        out = "Untitled"
    if not out[0].isalpha() and out[0] != "_":
        out = "P" + out
    return out


def partial_slug(uuid):
    """Filename slug for a partial (without extension)."""
    return PARTIALS_INDEX[uuid]["slug"]


def partial_component_name(uuid):
    """JSX-safe component name for a partial."""
    return PARTIALS_INDEX[uuid]["component"]


def partial_import_line(uuid):
    info = PARTIALS_INDEX[uuid]
    return f"import {info['component']} from '@site/src/partials/{info['slug']}.mdx';"


def escape_md_text(text):
    """Escape `<` and `>` in plain-text content so they don't get parsed as JSX.

    MDX is strict: `<Word>` in a paragraph triggers JSX parsing. Use HTML
    entities so the rendered output is identical but MDX leaves it alone.
    """
    if not text:
        return text
    # Avoid double-escaping already-encoded entities
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-") or "untitled"


class PaligoMigrator:
    def __init__(self, xml_path, url_map=None):
        self.tree = ET.parse(xml_path)
        self.root = self.tree.getroot()
        self.resources = {}
        self.resources_by_uuid = {}
        self.image_map = {}
        self.id_to_path = {}
        self.id_to_title = {}
        self.url_map = url_map or {}
        self.title_to_url = self.url_map.get("by_title", {})
        self.path_to_url = self.url_map.get("by_path", {})
        # Track every UUID referenced via xi:include so write_partials() knows
        # exactly which partial files to emit.
        self._referenced_uuids = set()
        # When True, _resolve_xinclude inlines its target instead of emitting a
        # JSX component reference (used while generating the partial file
        # itself, so partials are self-contained).
        self._inline_xinclude = False
        # Partials referenced by the page currently being converted; reset by
        # convert_component and consumed by _write_tree to emit imports.
        self._partials_used = set()
        self._index_resources()

    def _index_resources(self):
        for el in self.root:
            tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
            if tag == "resource":
                rid = el.get("id")
                self.resources[rid] = el
                ruuid = el.get("uuid")
                if ruuid:
                    self.resources_by_uuid[ruuid] = el
                if el.get("type") == "image":
                    uuid = el.get("uuid")
                    self.image_map[uuid] = {
                        "id": rid,
                        "src": el.get("src", ""),
                        "filename": el.get("filename", ""),
                    }

    def get_text(self, text_id, lang="en"):
        res = self.resources.get(text_id)
        if res is None:
            return ""
        content_el = None
        for child in res:
            tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            if tag == "content":
                if child.get("lang", "en") == lang:
                    content_el = child
                    break
                if content_el is None:
                    content_el = child
        if content_el is None:
            return ""
        return self._render_inline(content_el)

    def _render_inline(self, el):
        parts = []
        if el.text:
            parts.append(el.text.replace("\n", " "))
        for child in el:
            tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            # Resolve XInclude references inline (skipping the fallback text).
            if child.tag.startswith("{" + NS["xi"]):
                if tag == "include":
                    parts.append(self._resolve_xinclude(child, 2, None))
                # fallback: ignore
                if child.tail:
                    parts.append(child.tail.replace("\n", " "))
                continue
            if tag == "emphasis":
                role = child.get("role", "")
                inner = self._render_inline(child)
                if role in ("bold", "strong"):
                    parts.append(f"**{inner}**")
                else:
                    parts.append(f"*{inner}*")
            elif tag == "link":
                href = child.get(ns("xinfo", "href"), "")
                xlink_href = child.get(f"{{{NS['xlink']}}}href", "")
                inner = self._render_inline(child)
                url = xlink_href or href
                if url.startswith("urn:resource:"):
                    url = self.resolve_xref(url)
                parts.append(f"[{inner}]({url})")
            elif tag == "ulink":
                url = child.get("url", "")
                inner = self._render_inline(child)
                parts.append(f"[{inner}]({url})")
            elif tag in ("code", "literal", "filename", "command", "userinput"):
                inner = self._render_inline(child)
                parts.append(f"`{inner}`")
            elif tag in ("guilabel", "guimenu", "guimenuitem", "guibutton"):
                inner = self._render_inline(child)
                parts.append(f"**{inner}**")
            elif tag == "inlinemediaobject":
                img_md = self._convert_media(child)
                parts.append(img_md)
            elif tag == "xref":
                parts.append(self._xref_link(child))
            elif tag == "glossterm":
                # Inline glossary reference. Render as <GlossTerm> component
                # that shows a hover popover with the definition.
                inner = self._render_inline(child)
                baseform = child.get("baseform") or inner
                # Escape inner content for use as JSX text (no curly braces, etc.)
                safe_inner = inner.replace("{", "\\{").replace("}", "\\}")
                parts.append(f'<GlossTerm baseform="{baseform}">{safe_inner}</GlossTerm>')
                # Mark the file as needing MDX
                self._needs_mdx = True
            elif tag == "superscript":
                inner = self._render_inline(child)
                parts.append(f"<sup>{inner}</sup>")
            elif tag == "subscript":
                inner = self._render_inline(child)
                parts.append(f"<sub>{inner}</sub>")
            else:
                parts.append(self._render_inline(child))
            if child.tail:
                parts.append(child.tail.replace("\n", " "))
        return "".join(parts).strip()

    def resolve_xref(self, href):
        match = re.match(r"urn:resource:(component|fork):(\d+)", href)
        if match:
            res_id = match.group(2)
            url = self.id_to_path.get(res_id, "")
            if url:
                return f"/en/{url}"
        return href

    def resolve_xref_label(self, href):
        match = re.match(r"urn:resource:(component|fork):(\d+)", href)
        if match:
            return self.id_to_title.get(match.group(2), "")
        return ""

    def _xref_link(self, el):
        # Paligo's <xref> uses xlink:href; xinfo:href is for <link>.
        href = el.get(f"{{{NS['xlink']}}}href") or el.get(ns("xinfo", "href"), "")
        target = self.resolve_xref(href)
        label = self.resolve_xref_label(href)
        # Strip the .html suffix so Docusaurus/MDX treats this as an internal
        # doc link and rewrites it appropriately for the configured trailing
        # slash / .html behavior. Resolved targets always look like
        # `/en/section/path.html`.
        if target.endswith(".html"):
            target = target[:-len(".html")]
        return f"[{label or 'see topic'}]({target})"

    def _resolve_xinclude(self, el, heading_level, list_context):
        """Inline the content of a Paligo <xi:include> reference.

        The include's `href` is the UUID of a sibling resource (component/hazard).
        We pull the resource's <e:content> and recursively convert each child,
        ignoring the <xi:fallback> placeholder.
        """
        href = el.get("href", "")
        target = self.resources_by_uuid.get(href)
        if target is None:
            return ""

        # Default mode: emit a JSX component reference and let write_partials
        # generate the actual content. Avoids duplicating the chunk into every
        # consumer.
        if not self._inline_xinclude:
            self._referenced_uuids.add(href)
            self._partials_used.add(href)
            self._needs_mdx = True
            return f"<{partial_component_name(href)} />"

        # Inline mode (used while generating the partial file itself, so the
        # partial is self-contained Markdown/MDX).
        content_el = target.find(ns("e", "content"))
        if content_el is None:
            return ""
        # Cycle guard
        if not hasattr(self, "_include_stack"):
            self._include_stack = set()
        if href in self._include_stack:
            return ""
        self._include_stack.add(href)
        try:
            parts = []
            for child in content_el:
                child_md = self.convert_docbook_element(child, heading_level, list_context)
                if child_md:
                    parts.append(child_md)
            return "\n\n".join(parts)
        finally:
            self._include_stack.discard(href)

    def convert_docbook_element(self, el, heading_level=2, list_context=None):
        tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag

        if tag in ("include", "fallback") and el.tag.startswith("{" + NS["xi"]):
            if tag == "fallback":
                return ""
            return self._resolve_xinclude(el, heading_level, list_context)

        text_id = el.get(ns("xinfo", "text"))

        if text_id:
            resolved = self.get_text(text_id)
            if resolved:
                return self._wrap_tag(tag, resolved, el, heading_level, list_context)

        if tag == "section":
            return self._convert_section(el, heading_level)

        if tag in ("note", "tip", "warning", "important", "caution"):
            return self._convert_admonition(tag, el, heading_level)

        if tag == "example":
            return self._convert_example(el, heading_level)

        if tag in ("informaltable", "table"):
            return self._convert_table(el)

        if tag in ("mediaobject", "inlinemediaobject"):
            return self._convert_media(el)

        if tag == "imagedata":
            return self._convert_imagedata(el)

        if tag in ("itemizedlist", "orderedlist"):
            return self._convert_list(tag, el, heading_level)

        if tag == "glossary":
            return self._convert_glossary(el, heading_level)

        if tag == "procedure":
            return self._convert_list("orderedlist", el, heading_level)

        if tag == "para":
            # Render paragraph children inline so element tails (e.g. the "."
            # after `<xref/>`) stay on the same line instead of becoming a
            # separate block.
            return self._render_inline(el)

        parts = []
        if el.text and el.text.strip():
            parts.append(el.text.strip())

        for child in el:
            child_md = self.convert_docbook_element(child, heading_level, list_context)
            if child_md:
                parts.append(child_md)
            if child.tail and child.tail.strip():
                parts.append(child.tail.strip())

        content = "\n\n".join(parts) if parts else ""
        return self._wrap_tag(tag, content, el, heading_level, list_context)

    def _convert_section(self, el, heading_level):
        parts = []
        title_el = el.find(ns("db", "title"))
        if title_el is not None:
            text_id = title_el.get(ns("xinfo", "text"))
            title_text = self.get_text(text_id) if text_id else self._render_inline(title_el)
            if title_text:
                prefix = "#" * min(heading_level, 6)
                parts.append(f"{prefix} {title_text}")

        # Iterate with explicit index so we can group consecutive tab elements
        children = [c for c in el if (c.tag.split("}")[-1] if "}" in c.tag else c.tag) not in ("title", "info")]
        i = 0
        while i < len(children):
            child = children[i]
            role = child.get("role", "")
            child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag

            if child_tag == "para" and role.startswith("tabs"):
                # Collect consecutive tab labels
                labels = []
                while i < len(children):
                    c = children[i]
                    c_tag = c.tag.split("}")[-1] if "}" in c.tag else c.tag
                    c_role = c.get("role", "")
                    if c_tag == "para" and c_role.startswith("tabs"):
                        text_id = c.get(ns("xinfo", "text"))
                        label = self.get_text(text_id) if text_id else self._render_inline(c)
                        labels.append(label.strip() if label else "")
                        i += 1
                    else:
                        break
                # Collect matching tab-content procedures
                contents = []
                while i < len(children) and len(contents) < len(labels):
                    c = children[i]
                    c_tag = c.tag.split("}")[-1] if "}" in c.tag else c.tag
                    c_role = c.get("role", "")
                    if c_tag == "procedure" and "tab-content" in c_role:
                        body = self.convert_docbook_element(c, heading_level + 1)
                        contents.append(body or "")
                        i += 1
                    else:
                        break
                if labels and contents:
                    parts.append(self._render_tabs(labels, contents))
                    self._needs_mdx = True
                    continue
                # Fallback: just append labels as text if no content followed
                for lbl in labels:
                    if lbl:
                        parts.append(lbl)
                continue

            md = self.convert_docbook_element(child, heading_level + 1)
            if md:
                parts.append(md)
            i += 1

        return "\n\n".join(parts)

    def _render_tabs(self, labels, contents):
        out = ["<Tabs>"]
        for idx, (label, body) in enumerate(zip(labels, contents)):
            value = slugify(label) or f"tab-{idx}"
            default_attr = " default" if idx == 0 else ""
            out.append(f'<TabItem value="{value}" label="{label}"{default_attr}>')
            out.append("")
            out.append(body.strip())
            out.append("")
            out.append("</TabItem>")
        out.append("</Tabs>")
        return "\n".join(out)

    def _convert_admonition(self, admonition_type, el, heading_level):
        parts = []
        title_text = ""
        for child in el:
            child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            if child_tag == "title":
                text_id = child.get(ns("xinfo", "text"))
                title_text = self.get_text(text_id) if text_id else self._render_inline(child)
            else:
                md = self.convert_docbook_element(child, heading_level)
                if md:
                    parts.append(md)

        content = "\n\n".join(parts)
        header = f":::{admonition_type}"
        if title_text:
            header = f":::{admonition_type}[{title_text}]"
        return f"{header}\n\n{content}\n\n:::"

    def _convert_example(self, el, heading_level):
        parts = []
        for child in el:
            child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            if child_tag == "title":
                text_id = child.get(ns("xinfo", "text"))
                title_text = self.get_text(text_id) if text_id else self._render_inline(child)
                if title_text:
                    parts.append(f"**{title_text}**")
            else:
                md = self.convert_docbook_element(child, heading_level)
                if md:
                    parts.append(md)
        return "\n\n".join(parts)

    def write_glossary(self, out_path):
        """Extract all glossary entries to a JSON file keyed by lowercased term."""
        data = {}
        for el in self.root.iter():
            tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
            if tag != "glossary":
                continue
            for entry in el:
                entry_tag = entry.tag.split("}")[-1] if "}" in entry.tag else entry.tag
                if entry_tag != "glossentry":
                    continue
                term = ""
                definition = ""
                for child in entry:
                    child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                    if child_tag == "glossterm":
                        text_id = child.get(ns("xinfo", "text"))
                        term = self.get_text(text_id) if text_id else self._render_inline(child)
                    elif child_tag == "glossdef":
                        para = child.find(ns("db", "para"))
                        if para is not None:
                            text_id = para.get(ns("xinfo", "text"))
                            definition = self.get_text(text_id) if text_id else self._render_inline(para)
                if term and definition:
                    data[term.strip().lower()] = {
                        "term": term.strip(),
                        "definition": definition.strip(),
                    }
        with open(out_path, "w") as f:
            json.dump(data, f, indent=2, sort_keys=True)
        print(f"  Wrote {len(data)} glossary entries to {out_path}")

    def _convert_glossary(self, el, heading_level):
        out = ['<dl>']
        for entry in el:
            entry_tag = entry.tag.split("}")[-1] if "}" in entry.tag else entry.tag
            if entry_tag != "glossentry":
                continue
            term_text = ""
            def_text = ""
            for child in entry:
                child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                if child_tag == "glossterm":
                    text_id = child.get(ns("xinfo", "text"))
                    term_text = self.get_text(text_id) if text_id else self._render_inline(child)
                elif child_tag == "glossdef":
                    para = child.find(ns("db", "para"))
                    if para is not None:
                        text_id = para.get(ns("xinfo", "text"))
                        def_text = self.get_text(text_id) if text_id else self._render_inline(para)
            if term_text:
                term = term_text.strip()
                anchor = slugify(term)
                out.append(f'  <dt id="{anchor}">{term}</dt>')
                out.append(f"  <dd>\n\n{def_text.strip()}\n\n  </dd>")
        out.append('</dl>')
        return "\n".join(out)


    def _convert_list(self, list_type, el, heading_level):
        items = []
        # Each ordered/unordered list item picks up its own prefix.
        if list_type == "orderedlist":
            list_prefix = "1. "
            list_indent = "   "
        else:
            list_prefix = "- "
            list_indent = "  "
        for child in el:
            child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            is_xi = child.tag.startswith("{" + NS["xi"] + "}")

            # Skip xi:fallback (the "Reusing topic #UUID" placeholder)
            if is_xi and child_tag == "fallback":
                continue

            # xi:include inside a list/procedure → emit as a list item that
            # references the partial. The Docusaurus build-time preprocessor
            # expands these placeholders into the partial's actual list items
            # (see expandListPartials in docusaurus.config.ts), so the rendered
            # output merges into a single numbered list.
            #
            # When generating partial files (_inline_xinclude=True) we instead
            # splice the nested target's items inline so partials stay
            # self-contained — no chained partial references inside partials.
            if is_xi and child_tag == "include":
                href = child.get("href", "")
                target = self.resources_by_uuid.get(href) if href else None
                if target is None:
                    continue
                if self._inline_xinclude:
                    inner_list = None
                    content_el = target.find(ns("e", "content"))
                    if content_el is not None:
                        for grand in content_el.iter():
                            gtag = grand.tag.split("}")[-1] if "}" in grand.tag else grand.tag
                            if gtag in ("procedure", "orderedlist", "itemizedlist"):
                                inner_list = grand
                                break
                    if inner_list is not None:
                        nested = self._convert_list(list_type, inner_list, heading_level)
                        if nested:
                            items.append(nested)
                else:
                    self._referenced_uuids.add(href)
                    self._partials_used.add(href)
                    self._needs_mdx = True
                    items.append(f"{list_prefix}<{partial_component_name(href)} />")
                continue

            if child_tag in ("listitem", "step"):
                item_parts = []
                for sub in child:
                    sub_tag = sub.tag.split("}")[-1] if "}" in sub.tag else sub_tag
                    md = self.convert_docbook_element(sub, heading_level, list_context=list_type)
                    if md:
                        item_parts.append(md)
                item_content = "\n\n".join(item_parts)
                lines = item_content.split("\n")
                result = list_prefix + lines[0]
                for line in lines[1:]:
                    result += "\n" + (list_indent + line if line.strip() else "")
                items.append(result)
            elif child_tag == "stepalternatives":
                for alt in child:
                    alt_tag = alt.tag.split("}")[-1] if "}" in alt.tag else alt_tag
                    if alt_tag == "step":
                        alt_parts = []
                        for sub in alt:
                            md = self.convert_docbook_element(sub, heading_level, list_context=list_type)
                            if md:
                                alt_parts.append(md)
                        alt_content = "\n\n".join(alt_parts)
                        lines = alt_content.split("\n")
                        result = "  - " + lines[0]
                        for line in lines[1:]:
                            result += "\n" + ("    " + line if line.strip() else "")
                        items.append(result)
        return "\n".join(items)

    def _wrap_tag(self, tag, content, el, heading_level, list_context=None):
        if not content and tag not in ("imagedata", "xref"):
            return ""

        if tag == "title":
            return content

        if tag == "para":
            return content

        if tag == "emphasis":
            role = el.get("role", "")
            if role in ("bold", "strong"):
                return f"**{content}**"
            return f"*{content}*"

        if tag in ("code", "literal"):
            return f"`{content}`"

        if tag in ("programlisting", "screen"):
            lang = el.get("language", "")
            return f"```{lang}\n{content}\n```"

        if tag == "xref":
            return self._xref_link(el)

        if tag == "link":
            href = el.get(ns("xinfo", "href"), "")
            xlink_href = el.get(f"{{{NS['xlink']}}}href", "")
            url = xlink_href or href
            if url.startswith("urn:resource:"):
                url = self.resolve_xref(url)
            return f"[{content}]({url})"

        if tag == "ulink":
            url = el.get("url", "")
            return f"[{content}]({url})"

        if tag in ("abstract", "info"):
            return content

        if tag == "bridgehead":
            return f"#### {content}"

        if tag in ("command", "filename", "userinput"):
            return f"`{content}`"

        if tag in ("guilabel", "guimenu", "guimenuitem", "guibutton"):
            return f"**{content}**"

        if tag in ("phrase", "replaceable", "application", "keycap"):
            return content

        if tag in ("thead", "tbody", "tr", "th", "td", "tgroup",
                    "colspec", "row", "entry", "imageobject",
                    "content", "resource"):
            return content

        return content

    def _convert_table(self, el):
        rows = []
        for descendant in el.iter():
            tag = descendant.tag.split("}")[-1] if "}" in descendant.tag else descendant.tag
            if tag in ("tr", "row"):
                cells = []
                for cell in descendant:
                    cell_tag = cell.tag.split("}")[-1] if "}" in cell.tag else cell.tag
                    if cell_tag in ("th", "td", "entry"):
                        cell_content = self.convert_docbook_element(cell)
                        cell_content = cell_content.replace("\n", " ").strip()
                        cells.append(cell_content)
                if cells:
                    rows.append(cells)

        if not rows:
            return ""

        lines = []
        if rows:
            ncols = max(len(r) for r in rows)
            for r in rows:
                while len(r) < ncols:
                    r.append("")

            lines.append("| " + " | ".join(rows[0]) + " |")
            lines.append("| " + " | ".join("---" for _ in rows[0]) + " |")
            for row in rows[1:]:
                lines.append("| " + " | ".join(row) + " |")

        return "\n".join(lines)

    def _convert_media(self, el):
        for descendant in el.iter():
            tag = descendant.tag.split("}")[-1] if "}" in descendant.tag else descendant.tag
            if tag == "imagedata":
                return self._convert_imagedata(descendant)
        return ""

    def _convert_imagedata(self, el):
        # Paligo's `src` / `remap` attributes often point to legacy filenames
        # that don't exist on disk. The Paligo HTML output keeps every image
        # as `image/uuid-<uuid>.<ext>`, which is the canonical reference.
        uuid = el.get(ns("xinfo", "image"), "") or el.get("fileref", "")
        img_info = self.image_map.get(uuid, {})
        ext = img_info.get("extension", "png")
        # UUIDs in the XML look like `UUID-<hex>-<hex>-...`. The HTML output
        # stores them as `uuid-<hex>-<hex>-...` (lowercase prefix). Normalize.
        uuid_lower = uuid.replace("UUID-", "uuid-")
        src = f"/img/_paligo/{uuid_lower}.{ext}"
        filename = img_info.get("filename", "image")
        return f"![{filename}]({src})"

    def convert_component(self, resource_el):
        content_el = resource_el.find(ns("e", "content"))
        if content_el is None:
            return ""
        # Reset per-component MDX flag — set by _render_tabs when tab content is emitted
        self._needs_mdx = False
        self._partials_used = set()

        section = content_el.find(ns("db", "section"))
        if section is None:
            return ""

        title_el = section.find(ns("db", "title"))
        title = ""
        if title_el is not None:
            text_id = title_el.get(ns("xinfo", "text"))
            if text_id:
                title = self.get_text(text_id)
            elif title_el.text:
                title = title_el.text.strip()

        resource_title = section.get(ns("xinfo", "resource-title"), "")
        if not title:
            title = resource_title

        abstract_text = ""
        info_el = section.find(ns("db", "info"))
        if info_el is not None:
            abstract_el = info_el.find(ns("db", "abstract"))
            if abstract_el is not None:
                para = abstract_el.find(ns("db", "para"))
                if para is not None:
                    text_id = para.get(ns("xinfo", "text"))
                    if text_id:
                        abstract_text = self.get_text(text_id)
                        # Frontmatter `description` is a plain string — strip
                        # any JSX (e.g. <GlossTerm>) and collapse to text.
                        abstract_text = re.sub(
                            r"<GlossTerm[^>]*>(.*?)</GlossTerm>",
                            r"\1",
                            abstract_text,
                            flags=re.DOTALL,
                        )
                        # Also strip any other JSX-looking tags as a safety net
                        abstract_text = re.sub(r"</?[A-Z][^>]*>", "", abstract_text)
                        abstract_text = re.sub(r"<Partial_[A-Za-z0-9_]+\s*/?>", "", abstract_text)

        body_parts = []
        for child in section:
            child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            if child_tag in ("title", "info"):
                continue
            md = self.convert_docbook_element(child)
            if md:
                body_parts.append(md)

        section_role = section.get("role", "") or ""
        is_topichead = "topichead" in section_role.split()

        return (
            title,
            abstract_text,
            "\n\n".join(body_parts),
            self._needs_mdx,
            is_topichead,
            set(self._partials_used),
        )

    def _lookup_slug(self, title, file_section):
        """Look up the current live URL for a page by title.

        file_section is the top-level section the file lives in (e.g. 'bitrise-ci').
        Only return a slug if the matched URL is in the same section — otherwise
        title collisions (e.g. multiple "Getting started" pages) misroute pages.
        """
        url = self.title_to_url.get(title)
        if not url:
            return None
        if file_section and not url.startswith(file_section + "/") and url != file_section + ".html":
            return None
        return url.replace(".html", "")

    def build_structure(self, out_dir):
        self._out_dir = out_dir
        structure = self.root.find(ns("e", "structure"))
        root_pub = structure.find(ns("e", "publication"))

        self._map_paths(root_pub, "")
        self._build_resource_aliases()
        self._build_partials_index()
        # Write directly under out_dir, skipping the root publication wrapper
        for child in root_pub:
            child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            if child_tag in ("publication", "component"):
                self._write_tree(child, Path(out_dir), 1)

    def _build_partials_index(self):
        """Pre-scan every xi:include in the corpus and assign each unique
        target UUID a readable slug + JSX component name based on its title.

        Populates the module-level PARTIALS_INDEX so that helpers used during
        the conversion walk can return registry-backed names without needing
        the migrator instance.
        """
        # Collect every xi:include target UUID anywhere in the XML.
        unique_uuids = set()
        for elem in self.root.iter():
            if not elem.tag.startswith("{" + NS["xi"] + "}"):
                continue
            tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
            if tag != "include":
                continue
            href = elem.get("href", "")
            if href:
                unique_uuids.add(href)

        # Sort for deterministic collision ordering.
        used_slugs = {}     # slug → uuid (first-claimed)
        used_components = {}
        PARTIALS_INDEX.clear()

        def title_for(uuid):
            target = self.resources_by_uuid.get(uuid)
            if target is None:
                return ""
            content_el = target.find(ns("e", "content"))
            if content_el is None:
                return ""
            section = content_el.find(ns("db", "section"))
            if section is not None:
                t = section.get(ns("xinfo", "resource-title"), "")
                if t:
                    return t
            # Hazards/sidebars use other root elements; fall back to anything
            # with a resource-title attribute.
            for child in content_el:
                t = child.get(ns("xinfo", "resource-title"), "")
                if t:
                    return t
            return ""

        for uuid in sorted(unique_uuids):
            title = title_for(uuid) or "untitled"
            base_slug = slugify(title)
            base_comp = "Partial_" + _pascal_case(title)
            slug = base_slug
            comp = base_comp
            n = 2
            short = uuid.replace("UUID-", "").split("-")[0].lower()
            # Resolve collisions by appending the short UUID once, then a
            # counter if even that collides.
            while slug in used_slugs or comp in used_components:
                if n == 2:
                    slug = f"{base_slug}-{short}"
                    comp = f"{base_comp}_{short}"
                else:
                    slug = f"{base_slug}-{short}-{n}"
                    comp = f"{base_comp}_{short}_{n}"
                n += 1
            used_slugs[slug] = uuid
            used_components[comp] = uuid
            PARTIALS_INDEX[uuid] = {
                "slug": slug,
                "component": comp,
                "title": title,
            }

        print(f"  Indexed {len(PARTIALS_INDEX)} reusable partial chunks")

    def _build_resource_aliases(self):
        structure = self.root.find(ns("e", "structure"))

        title_to_path = {}
        for el in structure.iter():
            tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
            if tag == "component":
                title = el.get("title", "")
                nid = el.get("id", "")
                if title and nid in self.id_to_path:
                    title_to_path.setdefault(title, self.id_to_path[nid])

        aliased = 0
        for res in self.root:
            if res.get("type") != "component":
                continue
            rid = res.get("id")
            if rid in self.id_to_path:
                continue
            content_el = res.find(ns("e", "content"))
            if content_el is None:
                continue
            section = content_el.find(ns("db", "section"))
            if section is None:
                continue
            title = section.get(ns("xinfo", "resource-title"), "")
            if title and title in title_to_path:
                self.id_to_path[rid] = title_to_path[title]
                if rid not in self.id_to_title:
                    self.id_to_title[rid] = title
                aliased += 1

        print(f"  Aliased {aliased} resource IDs to structure paths")

    def _map_paths(self, node, parent_path):
        """Build ID → URL path mapping. Paths are relative to /en/ (e.g. 'bitrise-ci/getting-started.html')."""
        tag = node.tag.split("}")[-1] if "}" in node.tag else node.tag
        title = node.get("title", "")
        nid = node.get("id", "")

        if tag in ("publication", "component"):
            slug = slugify(title) if title else f"id-{nid}"

            # Try to find the URL from the HTML output mapping
            url_from_map = self.title_to_url.get(title)
            if url_from_map:
                self.id_to_path[nid] = url_from_map
            else:
                # Fall back to constructing a path
                path = f"{parent_path}/{slug}" if parent_path else slug
                self.id_to_path[nid] = path

            if title:
                self.id_to_title[nid] = title

            # For children, use the directory structure from the URL map or slugified path
            if url_from_map:
                child_parent = url_from_map.replace(".html", "")
            else:
                child_parent = f"{parent_path}/{slug}" if parent_path else slug

            for child in node:
                self._map_paths(child, child_parent)
        elif tag == "text":
            self.id_to_path[nid] = parent_path
        elif tag == "image":
            pass

    def _write_tree(self, node, parent_dir, sidebar_position):
        tag = node.tag.split("}")[-1] if "}" in node.tag else node.tag
        title = node.get("title", "")
        nid = node.get("id", "")

        # Components with linktype="import" are reusable content fragments
        # whose body is already inlined into the parent page via xi:include.
        # Don't generate a standalone page or directory for them.
        if node.get("linktype") == "import":
            return

        if tag in ("publication", "component"):
            slug = slugify(title) if title else f"id-{nid}"
            node_dir = parent_dir / slug

            child_sections = [
                c for c in node
                if (c.tag.split("}")[-1] if "}" in c.tag else c.tag)
                in ("publication", "component")
                and c.get("linktype") != "import"
            ]
            child_texts = [
                c for c in node
                if (c.tag.split("}")[-1] if "}" in c.tag else c.tag) == "text"
            ]

            resource = self.resources.get(nid)
            if resource is None:
                origin_uuid = node.get("origin")
                if origin_uuid:
                    resource = self.resources_by_uuid.get(origin_uuid)
            has_content = False
            md_title = title
            md_description = ""
            md_body = ""
            needs_mdx = False
            is_topichead = False
            partials_used = set()

            if resource is not None and resource.get("type") == "component":
                result = self.convert_component(resource)
                if result:
                    (
                        md_title,
                        md_description,
                        md_body,
                        needs_mdx,
                        is_topichead,
                        partials_used,
                    ) = result
                    has_content = bool(md_body.strip())

            # Look up the URL slug from the HTML output (constrained to the same section)
            file_section = ""
            try:
                file_section = node_dir.relative_to(Path(self._out_dir)).parts[0]
            except (ValueError, IndexError):
                pass
            url_slug = self._lookup_slug(md_title or title, file_section)

            if child_sections:
                node_dir.mkdir(parents=True, exist_ok=True)

                if has_content:
                    frontmatter = self._frontmatter(
                        title or md_title, md_description, sidebar_position,
                        slug=url_slug,
                        is_index=True,
                    )
                    ext = "mdx" if needs_mdx else "md"
                    body = self._mdx_body(md_body, needs_mdx, partials_used)
                    (node_dir / f"index.{ext}").write_text(
                        frontmatter + body + "\n"
                    )

                landing_parts = []
                for child_text in child_texts:
                    text_id = child_text.get("id")
                    text_content = self.get_text(text_id)
                    if text_content:
                        landing_parts.append(text_content)

                if landing_parts and not has_content:
                    frontmatter = self._frontmatter(
                        title or md_title, md_description, sidebar_position,
                        slug=url_slug,
                        is_index=True,
                    )
                    (node_dir / "index.md").write_text(
                        frontmatter + "\n\n".join(landing_parts) + "\n"
                    )

                # Use structure node title for sidebar label (what Paligo navigation uses).
                # Falls back to the H1/resource title only if the structure title is missing.
                category_meta = {
                    "label": title or md_title,
                    "position": sidebar_position,
                }
                if md_description:
                    category_meta["description"] = md_description

                # Link the category to its index doc unless this is a Paligo
                # topichead (toggle-only container). For topicheads we set
                # `link: null` explicitly — Docusaurus would otherwise auto-link
                # the index.md sibling, defeating the non-clickable behavior.
                has_index_file = has_content or bool(landing_parts)
                if is_topichead:
                    category_meta["link"] = None
                elif has_index_file:
                    rel = node_dir.relative_to(Path(self._out_dir))
                    doc_id = str(rel).replace("\\", "/") + "/index"
                    category_meta["link"] = {"type": "doc", "id": doc_id}

                (node_dir / "_category_.json").write_text(
                    json.dumps(category_meta, indent=2) + "\n"
                )

                pos = 1
                for child in node:
                    child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                    if child_tag in ("publication", "component"):
                        self._write_tree(child, node_dir, pos)
                        pos += 1

            elif has_content:
                parent_dir.mkdir(parents=True, exist_ok=True)
                frontmatter = self._frontmatter(
                    title or md_title, md_description, sidebar_position,
                    slug=url_slug,
                )
                ext = "mdx" if needs_mdx else "md"
                body = self._mdx_body(md_body, needs_mdx, partials_used)
                filepath = parent_dir / f"{slug}.{ext}"
                filepath.write_text(frontmatter + body + "\n")

            elif resource is not None and resource.get("type") == "component":
                role = ""
                content_el = resource.find(ns("e", "content"))
                if content_el is not None:
                    section = content_el.find(ns("db", "section"))
                    if section is not None:
                        role = section.get("role", "")
                if role == "topichead" and child_sections:
                    pass
                else:
                    parent_dir.mkdir(parents=True, exist_ok=True)
                    frontmatter = self._frontmatter(
                        title or md_title, md_description, sidebar_position,
                        slug=url_slug,
                    )
                    filepath = parent_dir / f"{slug}.md"
                    filepath.write_text(
                        frontmatter + f"<!-- TODO: content for {title} (Paligo ID: {nid}) -->\n"
                    )

    def _mdx_body(self, md_body, needs_mdx, partials_used):
        """Prepend MDX imports to a body when JSX is present.

        partials_used is a set of UUIDs referenced via xi:include. Each becomes
        an `import Partial_xxx from '@site/src/partials/xxx.mdx';` line.
        """
        if not needs_mdx:
            return md_body
        partial_imports = "\n".join(
            partial_import_line(uuid) for uuid in sorted(partials_used)
        )
        if partial_imports:
            partial_imports += "\n"
        return TAB_IMPORTS + partial_imports + "\n" + md_body

    def _frontmatter(self, title, description="", position=None, slug=None, is_index=False):
        lines = ["---"]
        title_escaped = title.replace('"', '\\"')
        lines.append(f'title: "{title_escaped}"')
        if description:
            desc_escaped = description.replace('"', '\\"')
            lines.append(f'description: "{desc_escaped}"')
        if position is not None:
            lines.append(f"sidebar_position: {position}")
        if slug:
            lines.append(f"slug: {slug}")
        lines.append("---")
        lines.append("")
        return "\n".join(lines) + "\n"

    def write_partials(self, partials_dir, index_path="migration/partials_index.json"):
        """Write one MDX partial per UUID referenced by an xi:include.

        Each partial is a self-contained MDX file (no frontmatter): standard
        imports + the resolved body of the target resource. Nested xi:includes
        are inlined to keep partials flat.
        """
        out = Path(partials_dir)
        out.mkdir(parents=True, exist_ok=True)
        written = 0
        # Build the index map for the build-time preprocessor:
        # component name → filename slug (so it can find the file from a
        # `<Partial_X />` reference without reverse-engineering the slug).
        comp_to_slug = {}
        for uuid in sorted(self._referenced_uuids):
            info = PARTIALS_INDEX.get(uuid)
            target = self.resources_by_uuid.get(uuid)
            if info is None or target is None:
                continue
            content_el = target.find(ns("e", "content"))
            if content_el is None:
                continue

            # Render in inline mode so the partial has no further <Partial_*/>
            # references — keeps it self-contained.
            self._inline_xinclude = True
            self._needs_mdx = False
            try:
                parts = []
                for child in content_el:
                    md = self.convert_docbook_element(child)
                    if md:
                        parts.append(md)
                body = "\n\n".join(parts)
            finally:
                self._inline_xinclude = False

            slug = info["slug"]
            out_path = out / f"{slug}.mdx"
            # All partials get the standard imports; harmless if unused, and
            # tabs/glossterm may appear in any chunk.
            body = escape_mdx_unknown_tags(body)
            out_path.write_text(TAB_IMPORTS + "\n" + body + "\n")
            comp_to_slug[info["component"]] = slug
            written += 1

        # Write the index for the Docusaurus build-time preprocessor.
        Path(index_path).parent.mkdir(parents=True, exist_ok=True)
        with open(index_path, "w") as f:
            json.dump({"components": comp_to_slug}, f, indent=2, sort_keys=True)

        print(f"  Wrote {written} partial files to {partials_dir}")
        print(f"  Wrote partials index to {index_path}")

    def copy_images(self, out_dir):
        img_dir = Path(out_dir) / "static" / "img"
        img_dir.mkdir(parents=True, exist_ok=True)

        manifest = []
        for uuid, info in self.image_map.items():
            src = info.get("src", "")
            filename = info.get("filename", "")
            if src:
                manifest.append(f"{uuid} → {src} ({filename})")

        (Path(out_dir) / "image_manifest.txt").write_text("\n".join(manifest) + "\n")
        print(f"  Image manifest written: {len(manifest)} images")


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <paligo-export.xml> <output-dir> [--url-map <url_map.json>]")
        sys.exit(1)

    xml_path = sys.argv[1]
    out_dir = sys.argv[2]

    url_map = None
    if "--url-map" in sys.argv:
        idx = sys.argv.index("--url-map")
        if idx + 1 < len(sys.argv):
            with open(sys.argv[idx + 1]) as f:
                url_map = json.load(f)
            print(f"Loaded URL map: {len(url_map.get('by_title', {}))} titles, {len(url_map.get('by_path', {}))} paths")

    print(f"Parsing {xml_path}...")
    migrator = PaligoMigrator(xml_path, url_map=url_map)
    print(f"  Indexed {len(migrator.resources)} resources")
    print(f"  Found {len(migrator.image_map)} images")

    print(f"Building structure in {out_dir}...")
    migrator.build_structure(out_dir)

    print("Writing partials...")
    migrator.write_partials("src/partials")

    print("Writing image manifest...")
    migrator.copy_images(out_dir)

    print("Writing glossary data...")
    migrator.write_glossary("migration/glossary.json")

    md_count = sum(1 for _ in Path(out_dir).rglob("*.md"))
    dir_count = sum(1 for _ in Path(out_dir).rglob("_category_.json"))
    unresolved = 0
    for md_file in Path(out_dir).rglob("*.md"):
        content = md_file.read_text()
        unresolved += len(re.findall(r"urn:resource:", content))

    print(f"\nDone!")
    print(f"  {md_count} markdown files")
    print(f"  {dir_count} categories")
    print(f"  {unresolved} unresolved URN references")
    print(f"  Output: {out_dir}")


if __name__ == "__main__":
    main()
