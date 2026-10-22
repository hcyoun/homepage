"""Parsers that turn config files into flat ``{key: value}`` maps."""

from __future__ import annotations

import configparser
import json
import tomllib
from pathlib import Path
from typing import Any, Callable

Flat = dict[str, Any]


def flatten(data: Any, prefix: str = "") -> Flat:
    """Flatten nested dicts/lists into dotted keys: ``db.hosts[0]``."""
    out: Flat = {}
    if isinstance(data, dict):
        for key, value in data.items():
            child = f"{prefix}.{key}" if prefix else str(key)
            out.update(flatten(value, child))
    elif isinstance(data, list):
        for i, value in enumerate(data):
            out.update(flatten(value, f"{prefix}[{i}]"))
    else:
        out[prefix] = data
    return out


def parse_json(text: str) -> Flat:
    return flatten(json.loads(text))


def parse_toml(text: str) -> Flat:
    return flatten(tomllib.loads(text))


def parse_ini(text: str) -> Flat:
    parser = configparser.ConfigParser(interpolation=None)
    parser.read_string(text)
    return flatten({s: dict(parser[s]) for s in parser.sections()})


def parse_env(text: str) -> Flat:
    out: Flat = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[len("export "):]
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip().strip("'\"")
    return out


PARSERS: dict[str, Callable[[str], Flat]] = {
    ".json": parse_json,
    ".toml": parse_toml,
    ".ini": parse_ini,
    ".cfg": parse_ini,
    ".env": parse_env,
}


def parser_for(path: Path) -> Callable[[str], Flat] | None:
    if path.name == ".env" or path.name.startswith(".env."):
        return parse_env
    return PARSERS.get(path.suffix.lower())
