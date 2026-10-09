"""Shared pytest run configuration (headed mode, Playwright launch, etc.)."""

from __future__ import annotations

import os

import pytest

PW_E2E_HEADLESS_ENV = "PW_E2E_HEADLESS"


def is_headed_from_env(*, headed_cli: bool = False) -> bool:
    """Return True when env vars or CLI request a visible browser/Electron window."""
    if headed_cli:
        return True
    if os.environ.get("HEADLESS", "").strip().lower() == "false":
        return True
    if os.environ.get("HEADED", "").strip().lower() in ("1", "true", "yes"):
        return True
    if os.environ.get("PWDEBUG") not in (None, "", "0", "false", "False"):
        return True
    return False


def is_headed_run(config: pytest.Config) -> bool:
    """Return True when this pytest run should keep the browser/Electron window visible."""
    headed_cli = bool(config.getoption("--headed", default=False))
    return is_headed_from_env(headed_cli=headed_cli)


def is_ci_run() -> bool:
    """Return True when running under CI."""
    return os.environ.get("CI", "false").lower() == "true"


def effective_headless(config: pytest.Config) -> bool:
    """Return True when Playwright should launch headless (CI is always headless)."""
    if is_ci_run():
        return True
    return not is_headed_run(config)


def publish_playwright_headless_mode(headless: bool) -> None:
    """Expose effective headless mode for helpers without pytest config access."""
    os.environ[PW_E2E_HEADLESS_ENV] = "true" if headless else "false"


def is_headed_from_playwright_env() -> bool:
    """Read the published headless flag, falling back to env-based detection."""
    pw_e2e_headless = os.environ.get(PW_E2E_HEADLESS_ENV)
    if pw_e2e_headless is not None:
        return pw_e2e_headless.lower() == "false"
    return is_headed_from_env()
