"""App Settings gear menu tabs."""

from __future__ import annotations

import pytest
from playwright.sync_api import Page

from automation.helpers.screenshot_helper import ScreenshotHelper
from automation.helpers.test_progress import log_done, log_step
from pages.app_settings_page import AppSettingsPage


def test_general_tab(run_local_app: Page, screenshot_helper: ScreenshotHelper) -> None:
    log_step("Open App Settings")
    settings = AppSettingsPage(run_local_app, shots=screenshot_helper)
    settings.navigate()
    log_step("Validate General tab")
    settings.validate_general()
    screenshot_helper.capture("app_settings", "general")
    log_done("General tab OK")


def test_privacy_tab(run_local_app: Page, screenshot_helper: ScreenshotHelper) -> None:
    log_step("Open App Settings")
    settings = AppSettingsPage(run_local_app, shots=screenshot_helper)
    settings.navigate()
    log_step("Validate Privacy tab")
    settings.validate_privacy()
    screenshot_helper.capture("app_settings", "privacy")
    log_done("Privacy tab OK")


def test_advanced_tab(run_local_app: Page, screenshot_helper: ScreenshotHelper) -> None:
    log_step("Open App Settings")
    settings = AppSettingsPage(run_local_app, shots=screenshot_helper)
    settings.navigate()
    log_step("Validate Advanced tab")
    settings.validate_advanced()
    screenshot_helper.capture("app_settings", "advanced")
    log_done("Advanced tab OK")


def test_feature_flags_tab(run_local_app: Page, screenshot_helper: ScreenshotHelper) -> None:
    log_step("Open App Settings")
    settings = AppSettingsPage(run_local_app, shots=screenshot_helper)
    settings.navigate()
    if settings.tab_link(settings.FEATURE_FLAGS_TAB).count() == 0:
        log_step("Feature Flags tab not present — skipping")
        pytest.skip("Feature Flags tab not present.")
    log_step("Validate Feature Flags tab")
    settings.validate_feature_flags()
    screenshot_helper.capture("app_settings", "feature_flags")
    log_done("Feature Flags tab OK")
