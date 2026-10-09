"""Labware library navigation."""

from __future__ import annotations

from playwright.sync_api import Page

from automation.app_helpers.test_progress import log_done, log_step
from automation.app_pages import LabwarePage


def test_labware_landing(run_local_app: Page) -> None:
    """
    T69770: Labware landing page and scroll to bottom while recording
    """
    """Open the Labware landing page from the left nav."""
    log_step("Navigate to Labware landing")
    LabwarePage(run_local_app).navigate()
    log_done("Labware landing loaded")
    log_step("Scroll to the bottom of the Labware library")
    LabwarePage(run_local_app).scroll_to_bottom()
    log_done("Labware scrolled to bottom")
