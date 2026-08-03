"""Small shared helpers for page objects."""

from __future__ import annotations


def require_helper(helper: object | None, helper_name: str, *, owner: str, method: str) -> object:
    """Raise when an optional page-object dependency was not provided."""
    if helper is None:
        raise RuntimeError(f"Pass a {helper_name} to {owner} for {method}()")
    return helper
