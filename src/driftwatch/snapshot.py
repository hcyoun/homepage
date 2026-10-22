"""Capture the effective configuration of a directory tree."""

from __future__ import annotations

import fnmatch
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from . import __version__
from .parsers import parser_for

DEFAULT_IGNORE = (".git/*", "node_modules/*", "__pycache__/*", ".venv/*")
SECRET_HINTS = ("password", "secret", "token", "apikey", "api_key", "private_key")
MASK = "••••••"


@dataclass
class Snapshot:
    root: str
    taken_at: str
    entries: dict[str, Any] = field(default_factory=dict)

    def to_json(self) -> str:
        payload = {
            "driftwatch": __version__,
            "root": self.root,
            "taken_at": self.taken_at,
            "entries": self.entries,
        }
        return json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True)


def _is_secret(key: str) -> bool:
    lowered = key.lower()
    return any(hint in lowered for hint in SECRET_HINTS)


def _ignored(rel: str, patterns: Iterable[str]) -> bool:
    return any(fnmatch.fnmatch(rel, p) for p in patterns)


def take_snapshot(
    root: str | Path,
    ignore: Iterable[str] = (),
    mask_secrets: bool = True,
) -> Snapshot:
    root = Path(root).resolve()
    patterns = (*DEFAULT_IGNORE, *ignore)
    entries: dict[str, Any] = {}

    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(root).as_posix()
        if _ignored(rel, patterns):
            continue
        parse = parser_for(path)
        if parse is None:
            continue
        try:
            flat = parse(path.read_text(encoding="utf-8"))
        except Exception as exc:  # malformed files are reported, not fatal
            entries[f"{rel}::<error>"] = f"{type(exc).__name__}: {exc}"
            continue
        for key, value in flat.items():
            if mask_secrets and _is_secret(key):
                value = MASK
            entries[f"{rel}::{key}"] = value

    return Snapshot(
        root=str(root),
        taken_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        entries=entries,
    )


def load_snapshot(path: str | Path) -> Snapshot:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return Snapshot(root=data["root"], taken_at=data["taken_at"], entries=data["entries"])
