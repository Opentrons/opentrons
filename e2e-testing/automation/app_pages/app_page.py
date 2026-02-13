"""Page object for the main Opentrons desktop application window."""

from playwright.sync_api import Page, expect


class AppPage:
    """Page object for the Opentrons desktop application.

    Wraps the first BrowserWindow exposed by the Electron app and provides
    helpers for common interactions seen on the initial load / home screen.
    """

    def __init__(self, page: Page) -> None:
        self.page = page

    # ------------------------------------------------------------------
    # Waits
    # ------------------------------------------------------------------

    def wait_for_app_ready(self, timeout: int = 30_000) -> None:
        """Wait until the application window has meaningful content.

        Looks for the Opentrons logo / name that appears once the React
        app inside the Electron shell has fully hydrated.
        """
        self.page.wait_for_load_state("domcontentloaded", timeout=timeout)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_title(self) -> str:
        """Return the document title of the app window."""
        return self.page.title()

    # ------------------------------------------------------------------
    # Assertions
    # ------------------------------------------------------------------

    def expect_visible_text(self, text: str, *, timeout: int = 10_000) -> None:
        """Assert that *text* is visible somewhere in the window."""
        expect(self.page.get_by_text(text).first).to_be_visible(timeout=timeout)

    def expect_title_contains(self, substring: str) -> None:
        """Assert the window title contains *substring*."""
        assert substring.lower() in self.page.title().lower(), (
            f"Expected window title to contain '{substring}', got '{self.page.title()}'"
        )
