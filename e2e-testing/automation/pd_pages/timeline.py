"""Timeline toolbox interactions for Protocol Designer."""

import re

from playwright.sync_api import Locator, Page, expect

from automation.base_page import BasePage


class Timeline(BasePage):
    """Scrollable element on the left side of protocol editing containing the protocol steps/timeline."""

    timeline_box_testid: str = "TimelineToolbox_scrollContainer"
    timeline_error_banner_testid: str = "Banner_error"

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def scroll_timeline_to_bottom(self) -> None:
        """Scroll the timeline to the bottom."""
        self.page.get_by_test_id(self.timeline_box_testid).evaluate("el => el.scrollTop = el.scrollHeight")

    def scroll_timeline_to_top(self) -> None:
        """Scroll the timeline to the top."""
        self.page.get_by_test_id(self.timeline_box_testid).evaluate("el => el.scrollTop = 0")

    def draggable_steps(self) -> Locator:
        """Return locators for draggable protocol steps in the timeline."""
        return self.page.locator('div[draggable="true"]')

    def wait_for_timeline_steps(self, min_steps: int = 1, timeout: int = 120000) -> None:
        """Wait until the timeline has rendered at least the expected number of steps."""
        steps = self.draggable_steps()
        expect(steps.first).to_be_visible(timeout=timeout)
        if min_steps > 1:
            expect(steps.nth(min_steps - 1)).to_be_attached(timeout=timeout)

    def get_timeline_error_text(self) -> str | None:
        """Return visible timeline error banner text, if any."""
        banner = self.page.get_by_test_id(self.timeline_error_banner_testid)
        if banner.count() == 0:
            return None
        return " ".join(banner.first.inner_text().split())

    def expect_no_timeline_errors(self, timeout: int = 120000) -> None:
        """Assert the protocol has no timeline-level error banners."""
        banner = self.page.get_by_test_id(self.timeline_error_banner_testid)
        try:
            expect(banner).to_have_count(0, timeout=timeout)
        except AssertionError as error:
            error_text = self.get_timeline_error_text()
            if error_text is not None:
                raise AssertionError(f"Timeline error banner: {error_text}") from error
            raise

    def expect_no_known_regression_errors(self, timeout: int = 120000) -> None:
        """Assert common PD 9.0 regression error copy is not shown."""
        self.expect_no_timeline_errors(timeout=timeout)
        for error_text in (
            "Pipette collisions likely",
            "Not enough accessible tips",
            "Protocol has timeline errors",
        ):
            expect(self.page.get_by_text(error_text, exact=False)).to_have_count(0, timeout=5000)

    def select_step_by_aria_label(self, aria_label: str) -> None:
        """Select a timeline step by its accessible label (e.g. '3. transfer')."""
        step = self.page.get_by_role("button", name=aria_label, exact=True)
        step.scroll_into_view_if_needed()
        step.click()

    def select_step_matching_label(self, label_pattern: str | re.Pattern[str]) -> None:
        """Select the first timeline step whose accessible label matches a pattern."""
        step = self.page.get_by_role("button", name=label_pattern).first
        step.scroll_into_view_if_needed()
        step.click()

    def select_transfer_steps_sample(
        self,
        indices: list[int],
        *,
        expect_no_errors: bool = True,
        error_timeout: int = 30000,
    ) -> None:
        """Open a sample of transfer steps by their zero-based draggable-step index."""
        steps = self.draggable_steps()
        for index in indices:
            step = steps.nth(index)
            step.scroll_into_view_if_needed()
            step.click()
            if expect_no_errors:
                self.expect_no_timeline_errors(timeout=error_timeout)
