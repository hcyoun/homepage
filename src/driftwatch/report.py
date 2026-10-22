"""Render a list of changes as text, JSON or Markdown."""

from __future__ import annotations

import json
from collections import defaultdict

from .diff import Change

SYMBOL = {"added": "+", "removed": "-", "changed": "~"}
COLOR = {"added": "\033[32m", "removed": "\033[31m", "changed": "\033[33m"}
RESET = "\033[0m"


def _summary(changes: list[Change]) -> str:
    counts = {k: sum(c.kind == k for c in changes) for k in SYMBOL}
    return f"{counts['added']} added, {counts['removed']} removed, {counts['changed']} changed"


def render_text(changes: list[Change], color: bool = True) -> str:
    if not changes:
        return "✔ No drift detected."
    by_file: dict[str, list[Change]] = defaultdict(list)
    for c in changes:
        by_file[c.file].append(c)

    lines: list[str] = []
    for file, items in by_file.items():
        lines.append(f"\n{file}")
        for c in items:
            sym = SYMBOL[c.kind]
            if c.kind == "changed":
                body = f"{c.path}: {c.before!r} → {c.after!r}"
            else:
                body = f"{c.path}: {c.after if c.kind == 'added' else c.before!r}"
            line = f"  {sym} {body}"
            lines.append(f"{COLOR[c.kind]}{line}{RESET}" if color else line)
    lines.append(f"\n✖ Drift detected: {_summary(changes)}")
    return "\n".join(lines)


def render_json(changes: list[Change]) -> str:
    return json.dumps(
        [{"kind": c.kind, "file": c.file, "key": c.path, "before": c.before, "after": c.after} for c in changes],
        indent=2,
        ensure_ascii=False,
    )


def render_markdown(changes: list[Change]) -> str:
    if not changes:
        return "### ✅ No configuration drift"
    rows = ["| | File | Key | Before | After |", "|---|---|---|---|---|"]
    for c in changes:
        before = "" if c.before is None else f"`{c.before}`"
        after = "" if c.after is None else f"`{c.after}`"
        rows.append(f"| {SYMBOL[c.kind]} | `{c.file}` | `{c.path}` | {before} | {after} |")
    return f"### ⚠️ Configuration drift — {_summary(changes)}\n\n" + "\n".join(rows)


RENDERERS = {"text": render_text, "json": render_json, "markdown": render_markdown}
