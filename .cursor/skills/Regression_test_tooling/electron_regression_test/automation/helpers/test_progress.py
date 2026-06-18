"""Live progress lines for pytest runs (requires -s or capture disabled)."""

from __future__ import annotations


def log_banner(suite: str, test_name: str) -> None:
    print(f"\n[{suite}] {test_name}", flush=True)


def log_step(message: str) -> None:
    print(f"  → {message}", flush=True)


def log_done(message: str = "done") -> None:
    print(f"  ✓ {message}", flush=True)
