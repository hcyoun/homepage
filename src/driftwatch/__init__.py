"""Driftwatch — detect configuration drift between environments."""

__version__ = "1.4.0"

from .snapshot import Snapshot, take_snapshot, load_snapshot
from .diff import Change, diff_snapshots

__all__ = [
    "__version__",
    "Snapshot",
    "take_snapshot",
    "load_snapshot",
    "Change",
    "diff_snapshots",
]
