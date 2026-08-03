"""Small shared helpers for page objects."""

from __future__ import annotations

from typing import TypeVar

T = TypeVar("T")


def require_helper(helper: T | None, helper_name: str, *, owner: str, method: str) -> T:
    """Raise when an optional page-object dependency was not provided."""
    if helper is None:
        raise RuntimeError(f"Pass a {helper_name} to {owner} for {method}()")
    return helper
