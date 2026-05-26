from pathlib import Path

from playwright.sync_api import Page

from automation.helpers.artifacts import ARTIFACTS_DIR


class ScreenshotHelper:
    def __init__(self, page: Page, output_dir: Path = ARTIFACTS_DIR):
        self.page = page
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def capture(self, section: str, name: str, *, locator=None):
        path = self.output_dir / section / f"{name}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        target = locator or self.page
        target.wait_for(state="visible")
        target.screenshot(path=str(path))
        return path
