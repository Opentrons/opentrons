"""Protocol editor page object."""

from playwright.sync_api import Page

from automation.base_page import BasePage


class Timeline(BasePage):
    """Scrollable element on the left side of protocol editing containing the protocol steps/timeline."""

    timeline_box_testid: str = "TimelineToolbox_scrollContainer"

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def scroll_timeline_to_bottom(self) -> None:
        """Scroll the timeline to the bottom."""
        self.page.get_by_test_id(self.timeline_box_testid).evaluate("el => el.scrollTop = el.scrollHeight")

    def scroll_timeline_to_top(self) -> None:
        """Scroll the timeline to the top."""
        self.page.get_by_test_id(self.timeline_box_testid).evaluate("el => el.scrollTop = 0")
