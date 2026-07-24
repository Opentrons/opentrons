from playwright.sync_api import Page

from automation.base_page import BasePage


class FlexStackerPage(BasePage):
    """Page object for configuring Flex Stacker protocol steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def _wait_for_stacker_form(self) -> None:
        """Wait until the flex stacker step form is rendered.

        Multi-stacker forms open with Module unset ("Choose option").
        Single-stacker forms auto-select the module, so "Module controls" appears.
        """
        self.dismiss_release_notes_toast()
        choose_option = self.page.get_by_text("Choose option", exact=True)
        module_controls = self.page.get_by_text("Module controls", exact=False)
        self.wait_for_visible(choose_option.or_(module_controls).first, timeout=10000)

    def _wait_for_module_controls(self) -> None:
        """Wait until Module controls render after a stacker module is selected."""
        self.wait_for_visible(
            self.page.get_by_text("Module controls", exact=False).first,
            timeout=10000,
        )

    def _stacker_select(self, stacker: str) -> None:
        """Select stacker from dropdown when multiple exist; skip when only one is on deck.

        Args:
            stacker: Stacker module label, e.g. "A4 Flex Stacker"
        """
        self._wait_for_stacker_form()
        dropdown = self.page.get_by_test_id("moduleId_dropdownMenu")
        if dropdown.count() > 0:
            dropdown.click()
            self.page.get_by_role("button", name=stacker).click()
            self._wait_for_module_controls()
            return

        # Single stacker: moduleId is auto-selected (no dropdown). Verify the module field.
        slot = stacker.split()[0]
        self.wait_for_visible(self.page.get_by_text("Flex Stacker", exact=False).first, timeout=10000)
        if slot:
            self.wait_for_visible(self.page.get_by_text(slot, exact=True).first, timeout=10000)
        self._wait_for_module_controls()

    def _select_stacker_action(self, action_subtext: str) -> None:
        """Select a stacker action via its radio-button description."""
        self.page.get_by_text(action_subtext, exact=True).click()

    def _message_box(self, message: str) -> None:
        """Fill the optional intervention message on refill/empty steps."""
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
        self._select_stacker_action("Manually fill the stacker with more labware")
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
        self._select_stacker_action("Manually empty all labware from the stacker")
        self._message_box(message)

    def retrieve_stacker(self, stacker: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g.,  "D4 Flex Stacker"
        """
        self._stacker_select(stacker)
        self._select_stacker_action("Retrieve labware from the stacker onto the shuttle")

    def store_stacker(self, stacker: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g.,  "D4 Flex Stacker"
        """
        self._stacker_select(stacker)
        self._select_stacker_action("Store labware currently on the shuttle into the stacker")

    def save_stacker_step(self) -> None:
        """Save the current flex stacker step."""
        self.dismiss_release_notes_toast()
        self.page.get_by_role("button", name="Save", exact=True).last.click()

    ##TODO: move to utility page, and update plate reader page as well
    def wait_for_save_banner_gone(self) -> None:
        """Wait for the save banner to disappear."""
        banner_message = "Stacker has been saved"
        banner = self.page.get_by_test_id("Snackbar").get_by_text(banner_message, exact=True).first
        banner.wait_for(state="visible")
        banner.wait_for(state="detached")