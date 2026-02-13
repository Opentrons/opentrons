"""Labware Library basic smoke tests.

Ported from legacy Cypress coverage for the desktop header navigation.
"""

from __future__ import annotations

import pytest
from playwright.sync_api import Page, expect

from automation.ll_pages import DesktopNavigation


@pytest.mark.llE2E
def test_desktop_navigation_contains_subdomain_nav_bar(page: Page, ll_base_url: str) -> None:
    """Verify subdomain navigation links are present and correct."""
    page.goto(f"{ll_base_url}/")

    nav = DesktopNavigation(page)
    nav.wait_for_loaded()

    nav.expect_link_href_equals(nav.subdomain_link("Python API"), "https://docs.opentrons.com/")

    nav.expect_link_has_href(nav.subdomain_link("Labware Library"))

    nav.expect_link_href_equals(nav.subdomain_link("Protocol Library"), "https://library.opentrons.com/")
    nav.expect_link_href_equals(nav.subdomain_link("Protocol Designer"), "https://designer.opentrons.com/")


@pytest.mark.llE2E
def test_desktop_navigation_contains_main_nav_bar(page: Page, ll_base_url: str) -> None:
    """Verify main navigation bar renders expected entries."""
    page.goto(f"{ll_base_url}/")

    nav = DesktopNavigation(page)
    nav.wait_for_loaded()

    nav.expect_link_href_equals(nav.main_nav_first_link(), "https://opentrons.com/")

    for item in ["About", "Products", "Applications", "Protocols", "Support & Sales"]:
        expect(nav.main_nav_item(item)).to_be_visible()


@pytest.mark.llE2E
def test_desktop_navigation_displays_correct_about_links(page: Page, ll_base_url: str) -> None:
    """Verify About dropdown links and destinations."""
    page.goto(f"{ll_base_url}/")

    nav = DesktopNavigation(page)
    nav.wait_for_loaded()
    nav.open_about_menu()

    nav.expect_link_href_equals(nav.about_menu_link("Mission"), "https://opentrons.com/about")
    nav.expect_link_href_equals(nav.about_menu_link("Our Team"), "https://opentrons.com/team")
    nav.expect_link_href_equals(nav.about_menu_link("Blog"), "https://blog.opentrons.com/")
