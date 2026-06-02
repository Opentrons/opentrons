"""App Settings gear menu tabs."""

from __future__ import annotations

import pytest
from playwright.sync_api import Page

from automation.helpers.screenshot_helper import ScreenshotHelper
from pages.app_settings_page import AppSettingsPage


def test_general_tab(run_local_app: Page, screenshot_helper: ScreenshotHelper) -> None:
    settings = AppSettingsPage(run_local_app, shots=screenshot_helper)
    settings.navigate()
    settings.validate_general()
    screenshot_helper.capture("app_settings", "general")


def test_privacy_tab(run_local_app: Page, screenshot_helper: ScreenshotHelper) -> None:
    settings = AppSettingsPage(run_local_app, shots=screenshot_helper)
    settings.navigate()
    settings.validate_privacy()
    screenshot_helper.capture("app_settings", "privacy")


def test_advanced_tab(run_local_app: Page, screenshot_helper: ScreenshotHelper) -> None:
    settings = AppSettingsPage(run_local_app, shots=screenshot_helper)
    settings.navigate()
    settings.validate_advanced()
    screenshot_helper.capture("app_settings", "advanced")


def test_feature_flags_tab(run_local_app: Page, screenshot_helper: ScreenshotHelper) -> None:
    settings = AppSettingsPage(run_local_app, shots=screenshot_helper)
    settings.navigate()
    if settings.tab_link(settings.FEATURE_FLAGS_TAB).count() == 0:
        pytest.skip("Feature Flags tab not present.")
    settings.validate_feature_flags()
    screenshot_helper.capture("app_settings", "feature_flags")
