"""Landing page for Protocol Designer."""

from playwright.sync_api import Page, expect

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

    def click_create_protocol(self) -> None:
        """Click the 'Create a Flex protocol' button."""
        self.click_button("Create a Flex protocol")

    def click_import_existing_protocol(self) -> None:
        """Click the 'Import existing protocol' button."""
        self.page.get_by_text("Import existing protocol").click()

    def upload_protocol_file(self, file_path: str) -> None:
        """Upload a protocol file from the landing page import input."""
        self.page.get_by_label("Import_from_landing").set_input_files(file_path)

    def edit_protocol(self) -> None:
        """Click the 'Edit' button for a specific protocol."""
        self.page.get_by_role("button", name="Edit protocol").click()
