"""Page objects for desktop navigation elements.

This mirrors selectors used by the legacy Cypress tests for the Labware Library
site's header navigation.
"""

from __future__ import annotations

import re

from playwright.sync_api import Locator, Page, expect

from automation.base_page import BasePage


class DesktopNavigation(BasePage):
    """Page object for the Labware Library desktop navigation header."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def subdomain_nav(self) -> Locator:
        """Return the subdomain navigation wrapper."""
        return self.page.get_by_test_id("SubdomainNavWrapper")

    def main_nav(self) -> Locator:
        """Return the main navigation wrapper."""
        return self.page.get_by_test_id("MainNavWrapper")

    def wait_for_loaded(self) -> None:
        """Wait for navigation wrappers to be visible."""
        expect(self.subdomain_nav()).to_be_visible()
        expect(self.main_nav()).to_be_visible()

    def subdomain_link(self, name: str) -> Locator:
        """Return a link in the subdomain nav by accessible name."""
        return self.subdomain_nav().get_by_role("link", name=name)

    def main_nav_item(self, name: str) -> Locator:
        """Return a main nav item by visible text.

        The marketing site mixes links and buttons; we key off the visible label.
        """
        return self.main_nav().get_by_text(name, exact=True)

    def main_nav_first_link(self) -> Locator:
        """Return the first anchor tag inside the main nav wrapper."""
        return self.main_nav().locator("a").first

    def expect_link_has_href(self, link: Locator) -> None:
        """Assert that a link has a non-empty href attribute."""
        expect(link).to_have_attribute("href", re.compile(r".+"))

    def expect_link_href_equals(self, link: Locator, expected_href: str) -> None:
        """Assert that a link href equals the expected URL."""
        normalized_expected = expected_href.rstrip("/")
        expect(link).to_have_attribute("href", re.compile(rf"^{re.escape(normalized_expected)}/?$"))

    def open_about_menu(self) -> None:
        """Open the About menu in the main nav."""
        about = self.main_nav_item("About")
        expect(about).to_be_visible()
        about.click()

        # Wait for dropdown contents to appear.
        expect(self.main_nav().get_by_role("link", name="Mission")).to_be_visible()

    def about_menu_link(self, name: str) -> Locator:
        """Return a link within the About dropdown by accessible name."""
        return self.main_nav().get_by_role("link", name=name)
