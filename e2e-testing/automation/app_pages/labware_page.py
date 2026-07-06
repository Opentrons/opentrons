"""Page object for the Labware library navigation."""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import Page

from automation.app_helpers.left_nav import link, navigate_to
from automation.app_helpers.list_scroll import scroll_to_bottom as scroll_list_to_bottom
from automation.app_helpers.page_helpers import require_helper
from automation.app_helpers.scroll_video_helper import ScrollVideoHelper


class LabwarePage:
    """Navigate to the Labware library and optionally record a scroll video."""

    def __init__(self, page: Page, scroll_video: ScrollVideoHelper | None = None):
        """Bind the page and optional scroll-video helper."""
        self.page = page
        self.scroll_video = scroll_video

    @property
    def nav_link(self):
        """Left-nav Labware link."""
        return link(self.page, "Labware")

    def navigate(self):
        """Open the Labware library landing page."""
        navigate_to(self.page, "Labware", "**/labware**")

    def scroll_to_bottom(self) -> None:
        """Scroll the labware library list until the bottom is reached."""
        scroll_list_to_bottom(self.page)

    def look(self) -> Path:
        """Open Labware and record a slow scroll — one artifact to review."""
        self.navigate()
        scroll_video = require_helper(self.scroll_video, "ScrollVideoHelper", owner="LabwarePage", method="look")
        return scroll_video.record("labware", "look", heading_name="Labware")
