"""Applitools Eyes helpers for PD E2E tests.

This module intentionally provides plain functions/context managers (not pytest fixtures)
so tests can opt-in to visual checks when desired.

Environment:
- Set `APPLITOOLS_API_KEY` (optionally via a `.env` file) to enable visual checks.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from functools import lru_cache
from typing import Iterator

from applitools.playwright import Eyes, Target
from dotenv import find_dotenv, load_dotenv
from playwright.sync_api import Page


@lru_cache(maxsize=1)
def _load_dotenv_once() -> None:
    """Load environment variables from the nearest `.env` file (if present)."""

    dotenv_path = find_dotenv(usecwd=True)
    if dotenv_path:
        load_dotenv(dotenv_path, override=False)


def get_applitools_api_key(*, required: bool = False) -> str | None:
    """Return the Applitools API key, optionally requiring it.

    If `required` is False and no key is found, returns None.
    """

    _load_dotenv_once()
    api_key = os.getenv("APPLITOOLS_API_KEY")
    if api_key:
        return api_key

    if required:
        raise RuntimeError("APPLITOOLS_API_KEY is not set. Add it to your environment or to a `.env` file.")
    return None


def create_eyes(*, api_key: str | None = None) -> Eyes:
    """Create and return an Applitools Eyes instance with API key configured."""

    if api_key is None:
        api_key = get_applitools_api_key(required=True)

    eyes = Eyes()
    eyes.api_key = api_key
    return eyes


@contextmanager
def eyes_session(
    page: Page,
    test_name: str,
    *,
    app_name: str = "Protocol Designer",
    api_key: str | None = None,
    enabled: bool | None = None,
) -> Iterator[Eyes]:
    """Open an Applitools Eyes session and ensure it is closed/aborted safely.

    Args:
        page: Playwright page from pytest-playwright.
        test_name: The name of the test (usually the pytest test name).
        app_name: The Applitools app name.
        api_key: Explicit API key override.
        enabled: If None, enabled when an API key is present. If False, raises.

    Yields:
        An opened Eyes instance.
    """

    if enabled is None:
        api_key_found = api_key or get_applitools_api_key(required=False)
        enabled = api_key_found is not None
        api_key = api_key_found

    if not enabled:
        raise RuntimeError(
            "Applitools is disabled (no APPLITOOLS_API_KEY). "
            "Use eyes_check_window(..., enabled=None) to auto-skip when missing."
        )

    eyes = create_eyes(api_key=api_key)
    eyes.open(page, app_name=app_name, test_name=test_name)
    try:
        yield eyes
        eyes.close()
    finally:
        eyes.abort_if_not_closed()


def eyes_check(
    page: Page,
    test_name: str,
    checkpoint_name: str,
    *,
    app_name: str = "Protocol Designer",
    api_key: str | None = None,
    enabled: bool | None = None,
) -> None:
    """Take a visual snapshot of the current page with Applitools.

    This is the one-call helper to use in tests when you want a visual verification.

    If `enabled` is None (default), the check is automatically skipped when
    no `APPLITOOLS_API_KEY` is available.
    """

    if enabled is None:
        enabled = (api_key or get_applitools_api_key(required=False)) is not None

    if not enabled:
        print
        return

    with eyes_session(page, test_name, app_name=app_name, api_key=api_key, enabled=True) as eyes:
        eyes.check(checkpoint_name, Target.window())  # TODO Applitools should we use .fully()?
