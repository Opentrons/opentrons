"""Live progress lines for pytest runs (requires -s or capture disabled)."""

from __future__ import annotations


def log_banner(suite: str, test_name: str) -> None:
    """Print a visible banner when a test starts."""
    print(f"\n[{suite}] {test_name}", flush=True)


def make_suite_logstart(suite: str):
    """Return a ``pytest_runtest_logstart`` hook that prints a suite banner."""

    def pytest_runtest_logstart(nodeid: str, location: tuple[str, int, str]) -> None:
        log_banner(suite, location[2])

    return pytest_runtest_logstart


def log_step(message: str) -> None:
    """Print an in-progress step line."""
    print(f"  → {message}", flush=True)


def log_done(message: str = "done") -> None:
    """Print a completion line for the current step or test."""
    print(f"  ✓ {message}", flush=True)
