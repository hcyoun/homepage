"""Compare two snapshots and classify what drifted."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from .snapshot import Snapshot

Kind = Literal["added", "removed", "changed"]


@dataclass(frozen=True)
class Change:
    kind: Kind
    key: str
    before: Any = None
    after: Any = None

    @property
    def file(self) -> str:
        return self.key.split("::", 1)[0]

    @property
    def path(self) -> str:
        return self.key.split("::", 1)[-1]


def diff_snapshots(base: Snapshot, other: Snapshot) -> list[Change]:
    changes: list[Change] = []
    a, b = base.entries, other.entries
    for key in sorted(a.keys() | b.keys()):
        if key not in b:
            changes.append(Change("removed", key, before=a[key]))
        elif key not in a:
            changes.append(Change("added", key, after=b[key]))
        elif a[key] != b[key]:
            changes.append(Change("changed", key, before=a[key], after=b[key]))
    return changes
