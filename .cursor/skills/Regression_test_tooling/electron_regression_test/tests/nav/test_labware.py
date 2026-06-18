"""Labware library navigation."""

from __future__ import annotations

from playwright.sync_api import Page

from automation.helpers.test_progress import log_done, log_step
from pages.labware_page import LabwarePage


def test_labware_landing(run_local_app: Page) -> None:
    log_step("Navigate to Labware library landing")
    LabwarePage(run_local_app).navigate()
    log_done("Labware landing loaded")
