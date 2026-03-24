"""Landing page for Protocol Designer."""

from playwright.sync_api import Page, TimeoutError, expect

from automation.base_page import BasePage


class LandingPage(BasePage):
    """Landing page with main entry point to create protocols."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def wait_for_page_load(self) -> None:
        """Wait for the landing page to load."""
        expect(self.page.get_by_test_id("basic_button_Create new")).to_be_visible(timeout=5000)

    def confirm_welcome_modal(self) -> None:
        """Click the Confirm button on welcome modal if present."""
        self.click_button("Confirm")

        # Wait for the modal overlay to be fully removed
        self.page.locator('[aria-label="BackgroundOverlay_ModalShell"]').wait_for(
            state="hidden",
            timeout=10000,
        )

        expect(self.page.get_by_role("button", name="View release notes")).to_be_visible(timeout=5000)

        self.dismiss_release_notes_toast()

    def confirm_welcome_modal_if_present(self) -> None:
        """Dismiss welcome and release-notes toast when shown; no-op otherwise.

        Use after ``page.goto`` when the welcome flow may already have run in this
        browser session (e.g. chained protocol imports).
        """

        confirm = self.page.get_by_role("button", name="Confirm")
        if confirm.count() > 0 and confirm.first.is_visible():
            confirm.first.click()
            overlay = self.page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
            if overlay.count() > 0:
                overlay.wait_for(state="hidden", timeout=10000)

        self.dismiss_release_notes_toast()

    def click_create_protocol(self) -> None:
        """Click the 'Create a protocol' button."""
        self.click_button("Create a protocol")

    def click_import_existing_protocol(self) -> None:
        """Click the 'Import existing protocol' button."""
        self.page.get_by_text("Import existing protocol").click()

    def upload_protocol_file(self, file_path: str) -> None:
        """Upload a protocol file from the landing page import input."""
        self.page.get_by_label("Import_from_landing").set_input_files(file_path)

    def dismiss_migration_modal(self) -> None:
        """Dismiss the migration import modal if it appears (older protocol versions)."""
        overlay = self.page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
        import_button = self.page.get_by_role("button", name="Import", exact=True)
        try:
            import_button.wait_for(state="visible", timeout=5000)
            import_button.click()
            try:
                overlay.wait_for(state="hidden", timeout=10000)
            except TimeoutError:
                pass
        except TimeoutError:
            pass

    def edit_protocol(self) -> None:
        """Click the 'Edit protocol' button."""
        self.page.get_by_role("button", name="Edit protocol").click()
