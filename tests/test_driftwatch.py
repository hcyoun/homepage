from pathlib import Path

from driftwatch import diff_snapshots, take_snapshot
from driftwatch.cli import main
from driftwatch.parsers import flatten, parse_env


def write(root: Path, name: str, text: str) -> None:
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def test_flatten_nested():
    assert flatten({"db": {"hosts": ["a", "b"], "port": 5432}}) == {
        "db.hosts[0]": "a",
        "db.hosts[1]": "b",
        "db.port": 5432,
    }


def test_parse_env_handles_export_and_quotes():
    assert parse_env('# c\nexport A="1"\nB=two\n') == {"A": "1", "B": "two"}


def test_diff_detects_all_kinds(tmp_path):
    staging, prod = tmp_path / "staging", tmp_path / "prod"
    write(staging, "app.json", '{"timeout": 30, "debug": true}')
    write(prod, "app.json", '{"timeout": 60, "replicas": 3}')

    kinds = {c.path: c.kind for c in diff_snapshots(take_snapshot(staging), take_snapshot(prod))}
    assert kinds == {"timeout": "changed", "debug": "removed", "replicas": "added"}


def test_secrets_are_masked(tmp_path):
    write(tmp_path, ".env", "DB_PASSWORD=hunter2\n")
    assert "hunter2" not in take_snapshot(tmp_path).to_json()


def test_check_exit_code(tmp_path):
    write(tmp_path / "cfg", "app.toml", 'mode = "safe"\n')
    baseline = tmp_path / "base.json"
    assert main(["snapshot", str(tmp_path / "cfg"), "-o", str(baseline)]) == 0
    assert main(["check", str(tmp_path / "cfg"), "--baseline", str(baseline)]) == 0

    write(tmp_path / "cfg", "app.toml", 'mode = "fast"\n')
    assert main(["check", str(tmp_path / "cfg"), "--baseline", str(baseline)]) == 1
