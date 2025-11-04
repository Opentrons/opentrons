"""Page object for the create-protocol onboarding wizard."""

from __future__ import annotations

from playwright.sync_api import Locator, Page, expect

from .base_page import BasePage


class CreateProtocolWizard(BasePage):
    """Encapsulate interactions with the onboarding wizard steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def wait_for_step(self, step_number: int | str) -> None:
        """Wait for the provided step indicator to be visible."""

        step_text = f"Step {step_number}"
        self.wait_for_visible(self.page.get_by_text(step_text, exact=False).first)

    def select_robot(self, robot_name: str) -> None:
        """Select a robot option such as ``Opentrons Flex`` or ``Opentrons OT-2``."""

        button = self._robot_option(robot_name)
        self.wait_for_visible(button)
        button.click()

    def expect_robot_selected(self, robot_name: str) -> None:
        """Assert that the given robot option is the active selection."""

        button = self._robot_option(robot_name)
        self.wait_for_visible(button)
        radio_id = button.get_attribute("for")
        if radio_id is None:
            raise AssertionError("Robot selection tile is missing associated radio input")
        radio_input = self.page.locator(f"input[id='{radio_id}']")
        expect(radio_input).to_be_checked()

    def _robot_option(self, robot_name: str) -> Locator:
        """Return the locator for a robot selection tile."""

        return self.page.locator("[role='label']", has_text=robot_name).first

    def expect_add_pipette_prompt(self) -> None:
        """Ensure the Add pipette prompt is present."""

        self.wait_for_visible(self.page.get_by_text("Add a pipette", exact=False).first)

    def click_add_pipette(self) -> None:
        """Open the pipette selector from Step 1."""

        self.page.get_by_text("Add a pipette", exact=False).first.click()

    def expect_pipette_volume_options(self) -> None:
        """Verify that the pipette volume selection UI is visible."""

        self.wait_for_visible(self.page.get_by_text("Pipette volume", exact=False).first)

    def expect_pipette_summary(self, pipette_name: str, tiprack_name: str) -> None:
        """Confirm the configured pipette and tip rack summary values."""

        self.wait_for_visible(self.page.get_by_text(pipette_name, exact=False).first)
        self.wait_for_visible(self.page.get_by_text(tiprack_name, exact=False).first)

    def expect_gripper_question(self) -> None:
        """Ensure the gripper question is visible on Step 3."""

        self.wait_for_visible(self.page.get_by_text("move labware automatically with the gripper", exact=False).first)

    def click_confirm(self) -> None:
        """Click the wizard Confirm button."""

        self.click_button("Confirm")
