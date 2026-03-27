from playwright.sync_api import Page

from automation.base_page import BasePage


class FlexStackerPage(BasePage):
    """Main transfer page for configuring transfer steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def _stacker_select(self, stacker: str) -> None:
        """Helper function to select stacker from dropdown menu of available stacker modules.

        Args:
            stacker: select stacker from available list. e.g., "D4 Flex Stacker"
        """
        self.page.get_by_test_id("moduleId_dropdownMenu").click()
        self.page.get_by_role("button", name=stacker).click()

    def _message_box(self, message: str) -> None:
        """Helper function to display a message box during stacker refill/empty.
        User can issue either command and as it executes it causes a pause and the
        message box appears with the inserted message


        Args:
            message: message to display in message box
        """

        self.page.get_by_role("textbox").click()
        self.page.get_by_role("textbox").fill(message)

    def refill_stacker(self, stacker: str, refill_num: int, message: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g., "D4 Flex Stacker"
            refill_num: number of labware to load into stacker hopper
            message: optionally write a message to display
        """
        self._stacker_select(stacker)

        # Locator for Refill uses text from Refill description
        self.page.get_by_text("Manually fill the stacker with more labware").click()
        spinbutton = self.page.get_by_role("spinbutton")
        spinbutton.fill(str(refill_num))

        self._message_box(message)

    def empty_stacker(self, stacker: str, message: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g.,  "D4 Flex Stacker"
            message: optionally write a message to display
        """
        self._stacker_select(stacker)

        # Locator for Empty uses text from Empty description
        self.page.get_by_text("Manually empty all labware from the stacker").click()
        self._message_box(message)

    def retrieve_stacker(self, stacker: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g.,  "D4 Flex Stacker"
        """
        self._stacker_select(stacker)
        # Locator for Retrieve uses text from Retrieve description
        self.page.get_by_text("Retrieve labware from the stacker onto the shuttle").click()

    def store_stacker(self, stacker: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g.,  "D4 Flex Stacker"
        """
        self._stacker_select(stacker)

        # Locator for Store uses text from Store description
        self.page.get_by_text("Store labware currently on the shuttle into the stacker").click()

    ##TODO: move to utility page, and update plate reader page as well
    def wait_for_save_banner_gone(self) -> None:
        """Wait for the save banner to disappear."""
        banner_message = "Stacker has been saved"
        banner = self.page.get_by_test_id("Snackbar").get_by_text(banner_message, exact=True).first
        banner.wait_for(state="visible")
        banner.wait_for(state="detached")
