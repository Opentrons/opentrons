"""Base page object with common functionality."""

from typing import Any

from playwright.sync_api import Page, expect


class BasePage:
    """Base page object that all page objects inherit from."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.is_sandbox = "sandbox" in page.url

    def goto(self, url: str) -> None:
        """Navigate to a URL."""
        self.page.goto(url)

    def click_button(self, name: str) -> None:
        """Click a button by its accessible name."""
        self.page.get_by_role("button", name=name).click()

    def fill_input(self, name: str, value: str) -> None:
        """Fill an input field by its name attribute."""
        self.page.locator(f'input[name="{name}"]').fill(value)

    def wait_for_visible(self, locator: Any, timeout: int = 5000) -> None:
        """Wait for an element to be visible."""
        expect(locator).to_be_visible(timeout=timeout)

    def click_test_id(self, test_id: str) -> None:
        """Click an element by test ID."""
        self.page.get_by_test_id(test_id).click()
