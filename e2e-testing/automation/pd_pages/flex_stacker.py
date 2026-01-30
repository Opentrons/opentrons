import re
from typing import Literal

from playwright.sync_api import Page, expect

from .base_page import BasePage


class FlexStackerPage(BasePage):
    """Main transfer page for configuring transfer steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)
    
    def _stacker_select(self, stacker: str) -> None:
        self.page.get_by_test_id("moduleId_dropdownMenu").click()
        self.page.get_by_role("button", name=stacker).click()

    def _message_box(self, message: str) -> None:
        self.page.get_by_test_id("TextAreaField").click()
        self.page.get_by_test_id("TextAreaField").fill("message box")

    def refill_stacker(self, stacker: str, refill_num: int, message: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g., "D4 Flex Stacker"
            refill_num: number of labware to load into stacker hopper
            message: optionally write a message to display
        """
        self._stacker_select(stacker)

        refill_option = self.page.locator("label").filter(has_text="RefillManually fill the")

        # Check if Refill is preselected / highlighted - 
        refill_highlighted = refill_option.to_have_attribute("aria-selected", "true")
        expect(refill_highlighted)
        if refill_highlighted == refill_option.to_have_attribute("aria-selected", "false"):
            refill_option.click()

        spinbutton = self.page.get_by_role("spinbutton")
        spinbutton.click()
        spinbutton.fill(str(refill_num))

        self._message_box(message)

    def empty_stacker(self, stacker: str, message: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g.,  "D4 Flex Stacker"
            message: optionally write a message to display
        """
        self._stacker_select(stacker)
        self.page.get_by_text("EmptyManually empty all").click()
        self._message_box(message)

    def retrieve_stacker(self, stacker: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g.,  "D4 Flex Stacker"
        """
        self._stacker_select(stacker)
        self.page.get_by_text("RetrieveRetrieve labware from").click()

    def store_stacker(self, stacker: str) -> None:
        """
        Args:
            stacker: select stacker from available list. e.g.,  "D4 Flex Stacker"
        """
        self._stacker_select(stacker)
        self.page.get_by_text("StoreStore labware currently").click()