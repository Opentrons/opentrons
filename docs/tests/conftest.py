"""pytest configuration for the docs snippet suite.

Adds the ``--tier`` option (cumulative: ``--tier=N`` runs tiers 1..N; default
``all``) and silences the opentrons import/simulation logging that would
otherwise flood test output.
"""

from __future__ import annotations

import logging

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
