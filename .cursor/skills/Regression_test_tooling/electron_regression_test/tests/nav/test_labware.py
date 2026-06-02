"""Labware library navigation."""

from __future__ import annotations

from playwright.sync_api import Page

from pages.labware_page import LabwarePage


def test_labware_landing(run_local_app: Page) -> None:
    LabwarePage(run_local_app).navigate()
