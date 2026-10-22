"""Command-line entry point: ``driftwatch snapshot | diff | check``."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .diff import diff_snapshots
from .report import RENDERERS, render_text
from .snapshot import Snapshot, load_snapshot, take_snapshot


def _resolve(target: str, ignore: list[str], mask: bool) -> Snapshot:
    path = Path(target)
    if path.is_file() and path.suffix == ".json":
        return load_snapshot(path)
    return take_snapshot(path, ignore=ignore, mask_secrets=mask)


def _emit(changes, fmt: str) -> None:
    if fmt == "text":
        print(render_text(changes, color=sys.stdout.isatty()))
    else:
        print(RENDERERS[fmt](changes))


def cmd_snapshot(args: argparse.Namespace) -> int:
    snap = take_snapshot(args.dir, ignore=args.ignore, mask_secrets=not args.no_mask)
    Path(args.output).write_text(snap.to_json(), encoding="utf-8")
    print(f"Saved {len(snap.entries)} keys from {snap.root} → {args.output}")
    return 0


def cmd_diff(args: argparse.Namespace) -> int:
    mask = not args.no_mask
    changes = diff_snapshots(_resolve(args.base, args.ignore, mask), _resolve(args.other, args.ignore, mask))
    _emit(changes, args.format)
    return 1 if changes and args.fail_on_drift else 0


def cmd_check(args: argparse.Namespace) -> int:
    changes = diff_snapshots(load_snapshot(args.baseline), take_snapshot(args.dir, ignore=args.ignore))
    _emit(changes, args.format)
    return 1 if changes else 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="driftwatch", description="Detect configuration drift between environments.")
    p.add_argument("--version", action="version", version=f"driftwatch {__version__}")
    sub = p.add_subparsers(dest="command", required=True)

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--ignore", action="append", default=[], metavar="GLOB", help="skip matching files")
    common.add_argument("--format", choices=RENDERERS, default="text")

    s = sub.add_parser("snapshot", parents=[common], help="record a directory's configuration")
    s.add_argument("dir")
    s.add_argument("-o", "--output", default="driftwatch.snapshot.json")
    s.add_argument("--no-mask", action="store_true", help="store secret values in plain text")
    s.set_defaults(func=cmd_snapshot)

    d = sub.add_parser("diff", parents=[common], help="compare two directories or snapshots")
    d.add_argument("base")
    d.add_argument("other")
    d.add_argument("--fail-on-drift", action="store_true", help="exit 1 when drift is found")
    d.add_argument("--no-mask", action="store_true")
    d.set_defaults(func=cmd_diff)

    c = sub.add_parser("check", parents=[common], help="verify a directory against a baseline (CI mode)")
    c.add_argument("dir")
    c.add_argument("--baseline", required=True)
    c.set_defaults(func=cmd_check)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
