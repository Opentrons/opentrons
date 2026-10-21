"""Capture PNG screenshots for navigation regression artifacts."""

from pathlib import Path

from playwright.sync_api import Page

from automation.app_helpers.artifacts import ARTIFACTS_DIR


class ScreenshotHelper:
    """Save page or element screenshots under ``artifacts/<section>/``."""

    def __init__(self, page: Page, output_dir: Path = ARTIFACTS_DIR):
        """Bind a Playwright page and optional output directory."""
        self.page = page
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def capture(self, section: str, name: str, *, locator=None):
        """Screenshot the full page or ``locator`` and return the saved PNG path."""
        path = self.output_dir / section / f"{name}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        if locator is not None:
            locator.wait_for(state="visible")
            locator.screenshot(path=str(path))
        else:
            self.page.screenshot(path=str(path))
        return path
