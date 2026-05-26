from __future__ import annotations

from pathlib import Path

from playwright.sync_api import Page, expect

from automation.helpers.scroll_video_helper import ScrollVideoHelper


class LabwarePage:
    def __init__(self, page: Page, scroll_video: ScrollVideoHelper | None = None):
        self.page = page
        self.scroll_video = scroll_video

    @property
    def nav_link(self):
        return self.page.get_by_role("link", name="Labware", exact=True)

    def navigate(self):
        self.nav_link.click()
        self.page.wait_for_url("**/labware**")
        expect(self.nav_link).to_have_attribute("aria-current", "page")

    def look(self) -> Path:
        """Open Labware and record a slow scroll — one artifact to review."""
        self.navigate()
        if self.scroll_video is None:
            raise RuntimeError("Pass a ScrollVideoHelper to LabwarePage for look()")
        return self.scroll_video.record("labware", "look", heading_name="Labware")
