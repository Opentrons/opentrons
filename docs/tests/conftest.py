"""pytest configuration for the docs snippet suite.

Adds the ``--tier`` option (cumulative: ``--tier=N`` runs tiers 1..N; default
``all``) and silences the opentrons import/simulation logging that would
otherwise flood test output.
"""

from __future__ import annotations

import collections
import logging
import re

import pytest

# opentrons emits INFO/WARNING chatter on import and during simulation
# ("robot_settings.json not found", "Belt calibration not found", deck-state
# logs). None of it matters to snippet validity; keep the suite output clean.
logging.disable(logging.WARNING)

_TIER_MARKERS = {"tier1": 1, "tier2": 2, "tier3": 3}


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--tier",
        action="store",
        default="all",
        help="Highest snippet-test tier to run, cumulative: 1=syntax, "
        "2=+complete-protocol simulation, 3/all=+fragment simulation.",
    )


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line("markers", "tier1: snippet syntax checks (all snippets)")
    config.addinivalue_line("markers", "tier2: complete-protocol simulation")
    config.addinivalue_line("markers", "tier3: fragment simulation")


def pytest_collection_modifyitems(
    config: pytest.Config, items: list[pytest.Item]
) -> None:
    raw = config.getoption("--tier")
    if raw == "all":
        return
    try:
        max_tier = int(raw)
    except ValueError:
        raise pytest.UsageError(f"--tier must be 1, 2, 3, or 'all' (got {raw!r})")

    kept, deselected = [], []
    for item in items:
        tier = next(
            (n for name, n in _TIER_MARKERS.items() if item.get_closest_marker(name)),
            1,
        )
        (kept if tier <= max_tier else deselected).append(item)
    if deselected:
        config.hook.pytest_deselected(items=deselected)
        items[:] = kept


# Map pytest outcome keys to the compact columns we report per file.
_OUTCOME_COLUMN = {"passed": "pass", "xfailed": "xfail", "failed": "FAIL", "error": "FAIL"}
_PARAM_ID = re.compile(r"\[([^\]]+)\]")


def _rel_path(nodeid: str) -> str | None:
    """The `.md` path from a parametrized node id like `...[path.md::tab::slug::L12]`."""
    match = _PARAM_ID.search(nodeid)
    return match.group(1).split("::")[0] if match else None


def pytest_terminal_summary(terminalreporter, exitstatus, config) -> None:  # noqa: ANN001
    """Print a per-`.md`-file breakdown so it's clear what got tested.

    The default `.`/`x` progress hides which files are covered; this groups the
    run by source file with pass / xfail / FAIL counts (xfail = a fragment that
    can't simulate standalone; FAIL = a real defect).
    """
    per_file: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    for outcome, column in _OUTCOME_COLUMN.items():
        for report in terminalreporter.stats.get(outcome, []):
            path = _rel_path(report.nodeid)
            if path is not None:
                per_file[path][column] += 1
    if not per_file:
        return

    terminalreporter.write_sep("=", "snippet results by file")
    width = max(len(path) for path in per_file)
    for path in sorted(per_file):
        counts = per_file[path]
        cells = [
            f"{counts[col]:>3} {col}" if counts[col] else " " * (4 + len(col))
            for col in ("pass", "xfail", "FAIL")
        ]
        terminalreporter.write_line(f"  {path:<{width}}  " + "  ".join(cells))
