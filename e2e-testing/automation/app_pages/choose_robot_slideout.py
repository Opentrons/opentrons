"""Page object for Choose robot / runtime parameters slideout."""

from __future__ import annotations

import re
from pathlib import Path

from playwright.sync_api import Locator, Page, expect

from automation.app_helpers.list_scroll import scroll_until_visible
from automation.app_helpers.protocol_run_target import ProtocolRunTarget
from automation.app_pages.app_base_page import AppBasePage


class ChooseRobotToRunProtocolSlideout(AppBasePage):
    """Select a robot and optionally set runtime parameters before creating a run."""

    CONTINUE_TO_PARAMETERS = "Continue to parameters"
    CONFIRM_VALUES = "Confirm values"
    PROCEED_TO_SETUP = "Proceed to setup"
    CHOOSE_FILE = "Choose file"
    PARAMETERS_SLIDEOUT_BODY = re.compile(r"^Slideout_body_Select parameters")

    def __init__(self, page: Page) -> None:
        """Bind the Playwright page."""
        super().__init__(page)

    def parameters_slideout(self) -> Locator:
        """Parameters slideout body (avoids Import a Protocol upload controls)."""
        return self.page.get_by_test_id(self.PARAMETERS_SLIDEOUT_BODY)

    def robot_option(self, robot_name: str) -> Locator:
        """Locator for a robot option labeled with ``robot_name``."""
        return self.page.get_by_text(robot_name, exact=True).first

    def select_robot(self, robot_name: str) -> None:
        """Scroll to and select the robot in the slideout list."""
        option = scroll_until_visible(self.page, self.robot_option(robot_name))
        expect(option).to_be_visible()
        option.click()

    def continue_to_parameters(self) -> None:
        """Click Continue to parameters on slideout page 1."""
        self.dismiss_warning_toast()
        button = self.page.get_by_role("button", name=self.CONTINUE_TO_PARAMETERS)
        expect(button).to_be_enabled()
        button.click()

    def upload_csv(self, csv_path: Path) -> None:
        """Upload a CSV via the parameters slideout Choose file button."""
        path = Path(csv_path)
        if not path.is_file():
            raise FileNotFoundError(f"CSV file not found: {path}")
        choose_file = self.parameters_slideout().get_by_role("button", name=self.CHOOSE_FILE)
        expect(choose_file).to_be_visible()
        with self.page.expect_file_chooser() as file_chooser_info:
            choose_file.click()
        file_chooser_info.value.set_files(str(path.resolve()))

    def confirm_values(self) -> None:
        """Click Confirm values on the parameters page."""
        self.dismiss_warning_toast()
        button = self.page.get_by_role("button", name=self.CONFIRM_VALUES)
        expect(button).to_be_enabled(timeout=60_000)
        button.click()

    def proceed_to_setup(self) -> None:
        """Click Proceed to setup when the protocol has no runtime parameters."""
        self.dismiss_warning_toast()
        button = self.page.get_by_role("button", name=self.PROCEED_TO_SETUP)
        expect(button).to_be_enabled()
        button.click()

    def start_run(self, target: ProtocolRunTarget) -> None:
        """Select robot and confirm parameters (optional CSV) to create the run."""
        self.select_robot(target.robot_name)
        self.dismiss_warning_toast()

        continue_btn = self.page.get_by_role("button", name=self.CONTINUE_TO_PARAMETERS)
        proceed_btn = self.page.get_by_role("button", name=self.PROCEED_TO_SETUP)

        if continue_btn.count() > 0 and continue_btn.is_visible():
            self.continue_to_parameters()
            if target.csv_path is not None:
                self.upload_csv(target.csv_path)
            confirm = self.page.get_by_role("button", name=self.CONFIRM_VALUES)
            if confirm.count() > 0 and confirm.is_visible():
                self.confirm_values()
            return

        expect(proceed_btn).to_be_visible()
        self.proceed_to_setup()
