"""Module and fixture configuration page object."""

from playwright.sync_api import Page, expect

from .base_page import BasePage


class ModuleConfigPage(BasePage):
    """Page for configuring modules and fixtures in the protocol."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def select_gripper(self, has_gripper: bool = True) -> None:
        """Select whether the protocol uses a gripper.

        Args:
            has_gripper: True to select "Yes", False for "No"
        """
        test_id = "BasicsButtons_gripper_yes" if has_gripper else "BasicsButtons_gripper_no"
        button = self.page.get_by_test_id(test_id)
        if button.count() == 0:
            label = "Yes" if has_gripper else "No"
            button = self.page.get_by_text(label)
        self.wait_for_visible(button.first)
        button.first.click()

    def select_thermocycler(self, has_thermocycler: bool = True) -> None:
        """Select whether the protocol uses a thermocycler."""
        test_id = (
            "BasicsButtons_thermocycler_yes"
            if has_thermocycler
            else "BasicsButtons_thermocycler_no"
        )
        button = self.page.get_by_test_id(test_id)
        if button.count() == 0:
            label = "Yes" if has_thermocycler else "No"
            button = self.page.get_by_text(label)
        self.wait_for_visible(button.first)
        button.first.click()

    def select_waste_chute(self, has_waste_chute: bool = True) -> None:
        """Select whether the protocol uses a waste chute."""
        test_id = (
            "BasicsButtons_wasteChute_yes" if has_waste_chute else "BasicsButtons_wasteChute_no"
        )
        button = self.page.get_by_test_id(test_id)
        if button.count() == 0:
            label = "Yes" if has_waste_chute else "No"
            button = self.page.get_by_text(label)
        self.wait_for_visible(button.first)
        button.first.click()

    def confirm_module_selection(self) -> None:
        """Confirm the module selection and proceed."""
        self.click_button("Confirm")
        expect(self.page.get_by_role("button", name="Go back")).to_be_visible(timeout=5000)
