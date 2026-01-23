import re
from typing import Literal

from playwright.sync_api import Page

from .base_page import BasePage


class FlexStackerPage(BasePage):
    """Main transfer page for configuring transfer steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def configure_stacker(self, slot: Literal["A4", "B4", "C4", "D4"]) -> None:
        if slot == "A4":
            self.page.get_by_test_id("fakeA4").click()
        elif slot == "B4":
            self.page.get_by_test_id("fakeB4").click()
        elif slot == "C4":
            self.page.get_by_test_id("fakeC4").click()
        elif slot == "D4":
            self.page.get_by_test_id("fakeD4").click()
        self.page.get_by_test_id("Modules").click()
        self.page.get_by_test_id("Flex Stacker Module GEN1").click()
  
    def start_new_create_protocol(self) -> None:
        self.page.on("dialog", lambda dialog: dialog.accept())
        self.page.get_by_test_id("basic_button_Create new").click()



