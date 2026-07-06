"""Applitools Eyes helpers for PD E2E tests.

Primary entrypoint is the `eyes` pytest fixture (provided via `conftest.py` plugin
registration). When enabled, tests can call:

- `eyes.check("Checkpoint")` for a window snapshot.
- `eyes.check_element("Checkpoint", locator)` for a stitched element snapshot.

Environment:
- Set `APPLITOOLS_API_KEY` (optionally via a `.env` file) to enable visual checks.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Iterator

import pytest
from _pytest.fixtures import FixtureRequest
from applitools.playwright import Eyes as ApplitoolsEyes
from applitools.playwright import Target
from dotenv import find_dotenv, load_dotenv
from playwright.sync_api import Locator, Page

from run_config import is_headed_from_playwright_env


class Eyes(ApplitoolsEyes):
    """Applitools Eyes with PD E2E convenience methods.

    Provides a lightweight wrapper around Applitools' `Eyes` so tests can call:
    - `eyes.check("Checkpoint")` to snapshot the current window
    - `eyes.check_element("Checkpoint", locator)` to snapshot a stitched element

    The original Applitools signature is still supported via the optional `target`.
    """

    def check(self, checkpoint_name: str, target: object | None = None) -> None:  # type: ignore[override]
        """Run a window check by default, or a raw Applitools check when `target` is provided."""

        if target is None:
            return super().check(checkpoint_name, Target.window())
        return super().check(checkpoint_name, target)

    def check_element(self, checkpoint_name: str, element: Locator) -> None:
        """Run a stitched element check for a scrollable region."""

        element.wait_for(state="visible")
        super().check(checkpoint_name, Target.region(element).fully())


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


def _print_once(message: str, *, guard_env_var: str) -> None:
    """Print a message only once per process to avoid noisy logs."""

    if os.environ.get(guard_env_var) == "true":
        return
    print(message)
    os.environ[guard_env_var] = "true"


@pytest.fixture(scope="session")
def eyes_singleton() -> Eyes | None:
    """Session-scoped Applitools Eyes singleton.

    This creates a single Eyes instance per pytest worker process.
    It does *not* open a test; use the function-scoped `eyes` fixture for that.
    """

    # If we're headed, never do Applitools checks.
    if is_headed_from_playwright_env():
        _print_once("Applitools disabled for this run (headed mode).", guard_env_var="_APPLITOOLS_DISABLED_HEADED")
        return None

    api_key = get_applitools_api_key(required=False)
    if api_key is None:
        _print_once(
            "Applitools disabled for this run (no APPLITOOLS_API_KEY).",
            guard_env_var="_APPLITOOLS_DISABLED_NO_KEY",
        )
        return None

    return create_eyes(api_key=api_key)


@pytest.fixture(scope="function")
def eyes(page: Page, request: FixtureRequest, eyes_singleton: Eyes | None) -> Iterator[Eyes | None]:
    """Opened Applitools Eyes session for the current pytest test.

    Use this fixture when you want multiple `eyes.check(...)` calls in the same
    pytest test function to be grouped under one Applitools test.

    If Applitools is disabled (headed mode or missing key), yields None.
    """

    if eyes_singleton is None:
        yield None
        return

    # Use the pytest test function name as the Applitools test name.
    test_name = request.node.name

    eyes_singleton.open(page, app_name="Protocol Designer", test_name=test_name)
    try:
        yield eyes_singleton
        eyes_singleton.close()
    finally:
        eyes_singleton.abort_if_not_closed()
