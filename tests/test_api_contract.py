import json
from pathlib import Path

import pytest
from .api_contract import exercise, load_server, manifest

CASES = json.loads(
    (Path(__file__).parent / "fixtures" / "api_contract.json").read_text()
)


@pytest.mark.parametrize(
    "case",
    CASES,
    ids=lambda case: f"{case['server']}:{case['method']}:{case['path']}:{case['mode']}:{case['request']}",
)
def test_original_http_and_register_contract(case):
    assert exercise(case["server"], case) == case["expected"]


@pytest.mark.parametrize("server", ["standalone", "legacy"])
def test_no_routes_added_or_removed(server):
    _, app = load_server(server)
    expected = {
        (case["path"], case["method"]) for case in CASES if case["server"] == server
    }
    actual = {(path, method) for path, methods in manifest(app) for method in methods}
    assert actual == expected
