"""Module for interactions within the Heater-Shaker Step configuration form."""

from enum import Enum

from playwright.sync_api import Page

from automation.base_page import BasePage


class LidPosition(Enum):
    """Defines the allowed positions for the Heater-Shaker lid."""

    OPEN = "open"
    CLOSED = "closed"


class HeaterShakerStepPage(BasePage):
    """Page object for configuring a Heater-Shaker step."""

    def __init__(self, page: Page) -> None:
        """Initialize the HeaterShakerStepPage."""
        super().__init__(page)
        self._save_button = self.page.get_by_role("button", name="Save", exact=True)
        self._target_speed_toggle = self.page.get_by_text("Target Speed").locator("..").locator(".ToggleButton_Off")
        self._latch_closed_toggle = self.page.get_by_text("Labware latchClosed")
        self._latch_open_toggle = self.page.get_by_text("Labware latchOpen")

    def wait_for_form_load(self) -> None:
        """Wait for the Heater-Shaker step form to be visible."""
        self.wait_for_visible(self.page.get_by_text("Heater-Shaker Module", exact=False))

    def set_target_temperature(self, temp: str) -> None:
        """Enable and set the target heating temperature.

        Args:
            temp: The target temperature string (e.g., "60").
        """
        self.page.get_by_text("HeaterOff").click()
        try:
            self.page.locator('input[name="targetTemperature"]').fill(temp)
        except Exception:  # noqa: BLE001
            self.page.get_by_role("textbox").fill(temp)

    def set_target_speed(self, speed: str) -> None:
        """Enable and set the target shaking speed.

        Args:
            speed: The target speed string (e.g., "700").
        """
        self.page.get_by_text("ShakerOff").click()
        self.page.locator('input[name="targetSpeed"]').fill(speed)

    def set_lid_position(self, position: LidPosition) -> None:
        """Set the position of the Heater-Shaker lid.

        Args:
            position: LidPosition.OPEN or LidPosition.CLOSED.
        """
        if position == LidPosition.CLOSED:
            self._latch_closed_toggle.click()
        elif position == LidPosition.OPEN:
            self._latch_open_toggle.click()

    def save_step(self) -> None:
        """Click the Save button to confirm and close the step editor."""
        self.wait_for_visible(self._save_button)
        self._save_button.click()

    def pause_confirm(self) -> None:
        """Confirm the pause in the step editor."""
        self.page.get_by_role("button", name="Confirm").click()

    ## Composite step


def _add_heater_shaker_step(page: Page, temp: str, speed: str, timer: str) -> None:
    """Add a Heater-Shaker step configured with temperature, speed, and timer.

    Args:
        editor: The initialized ProtocolEditorPage object for adding steps.
        page: The Playwright Page object for raw interactions.
        temp: The target temperature for the module (e.g., "50").
        speed: The target RPM speed for the shaker (e.g., "300").
        timer: The optional timer duration in HH:MM format (e.g., "00:30").
    """
    hs_page = HeaterShakerStepPage(page)
    hs_page.wait_for_form_load()

    hs_page.set_target_temperature(temp)
    hs_page.set_target_speed(speed)

    try:
        timer_input = page.locator('input[name="heaterShakerTimer"]')
        timer_input.click()
        timer_input.fill(timer)
        print(f"✓ Heater-Shaker timer set to {timer}")
    except Exception as e:  # noqa: BLE001
        print(f"Warning: Could not set Heater-Shaker timer. Error: {e}")

    hs_page.save_step()
    hs_page.pause_confirm()

    print(f"✓ Heater-Shaker step added (T:{temp}°C, S:{speed}rpm).")
