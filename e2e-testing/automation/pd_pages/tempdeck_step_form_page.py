"""Module for interactions within the Temperature Module Step configuration form."""

from playwright.sync_api import Page

from .base_page import BasePage


class TemperatureStepPage(BasePage):
    """Page object for configuring a Temperature Module step."""

    def __init__(self, page: Page) -> None:
        """Initialize the TemperatureStepPage."""
        super().__init__(page)
        self._save_button = self.page.get_by_role("button", name="Save")
        self._target_temp_toggle_turn_on = self.page.locator('[data-testid^="ToggleButton_"]')
        self._pause_button = self.page.get_by_role("button", name="Add pause step")
        self._temp_module_label = self.page.get_by_text("Temperature Module state", exact=True)

    def wait_for_form_load(self) -> None:
        """Wait for the Temperature Module step form to be visible."""
        self.wait_for_visible(self._temp_module_label)

    def set_target_temperature(self, temp: str) -> None:
        """
        Enable and set the target temperature.

        Args:
            temp: The target temperature string (e.g., "70").
        """
        # Ensure the toggle is 'On'

        self._target_temp_toggle_turn_on.click(timeout=5000, force=True)
        # Fill the temperature input
        self.page.get_by_role("textbox").fill(temp)
        self.page.get_by_role("textbox").press("Enter")

    def save_step(self) -> None:
        """Click the Save button to confirm and close the step editor."""
        self._save_button.click()

    def add_pause(self) -> None:
        """Click the button to add a pause step after the temperature setpoint is reached."""
        # self.wait_for_visible(self._pause_button)
        self._pause_button.click()
