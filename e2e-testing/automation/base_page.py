"""Base page object with common functionality."""

import re
from typing import Any

from playwright.sync_api import Locator, Page, expect


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

    def click_checkbox_label(self, label_text: str) -> None:
        """Click a checkbox by exact visible label text.

        This avoids partial matches like "Tip Rack 50 µL" matching
        "Filter Tip Rack 50 µL", and avoids clicking hidden checkbox inputs.
        """

        label = self.page.locator("label").filter(has=self.page.get_by_text(re.compile(rf"^{re.escape(label_text)}$")))
        expect(label).to_have_count(1, timeout=5000)
        label.first.click()

    def dismiss_release_notes_toast(self) -> None:
        """Close the update toast if it appears."""

        toast = self.page.get_by_text("updated Protocol Designer", exact=False)
        if toast.count() == 0:
            return

        close_icon = self.page.get_by_label("close_icon")
        if close_icon.count() > 0:
            close_icon.first.click()
            return

        # Fallback: escape clears the toast if the close icon isn't present.
        self.page.keyboard.press("Escape")

    def highlight_element(
        self,
        element: Locator,
        *,
        duration_ms: int | None = 3000,
        pause: bool = False,
    ) -> None:
        """Highlight an element on the page for visual debugging.

        Args:
            element: The Playwright locator to highlight.
            duration_ms: If set (default 3000), keep the highlight for this many
                milliseconds and then restore previous inline styles. If None,
                keep the highlight until manually cleared.
            pause: If True, pause execution after highlighting (opens Playwright
                Inspector). Requires `page`.
        """

        element.evaluate(
            """(el, durationMs) => {
            const prev = {
                border: el.style.border,
                backgroundColor: el.style.backgroundColor,
                boxShadow: el.style.boxShadow,
            };

            el.style.border = '3px solid red';
            el.style.backgroundColor = 'yellow';
            el.style.boxShadow = '0 0 0 3px rgba(255, 0, 0, 0.35)';

            if (durationMs === null || durationMs === undefined) {
                return;
            }

            return new Promise((resolve) => {
                window.setTimeout(() => {
                    el.style.border = prev.border;
                    el.style.backgroundColor = prev.backgroundColor;
                    el.style.boxShadow = prev.boxShadow;
                    resolve();
                }, durationMs);
            });
        }""",
            duration_ms,
        )

        if pause:
            self.page.pause()
