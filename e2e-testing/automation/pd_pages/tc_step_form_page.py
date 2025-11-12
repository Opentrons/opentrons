"""Module for interactions within the Thermocycler Step configuration form."""

import re

from playwright.sync_api import Page

from .base_page import BasePage


class ThermocyclerStepPage(BasePage):
    """Page object for configuring a Thermocycler step (state or profile mode)."""

    def __init__(self, page: Page) -> None:
        """Initialize the ThermocyclerStepPage."""
        super().__init__(page)

    # ========== Part 1: State vs Profile Selection ==========

    def select_state_mode(self) -> None:
        """Select the 'Change Thermocycler state' option."""
        self.page.get_by_role("button", name="Continue").click()

    def select_profile_mode(self) -> None:
        """Select the 'Program a Thermocycler profile' option."""
        self.page.locator("div").filter(has_text=re.compile(r"^Program a Thermocycler profile$")).nth(1).click()
        self.page.get_by_role("button", name="Continue").click()

    # ========== Block Temperature (State Mode) ==========

    def set_block_temperature(self, temp: str) -> None:
        """
        Set the block target temperature in state mode.

        Args:
            temp: Temperature value (e.g., "40").
        """
        textbox = self.page.get_by_role("textbox").first
        self.wait_for_visible(textbox)
        textbox.click()
        textbox.fill(temp)

    def toggle_block_temperature(self, enable: bool) -> None:
        """
        Toggle block temperature on/off in state mode.

        Args:
            enable: True to turn on, False to turn off.
        """
        if enable:
            self.page.get_by_text("BlockOff").click()
        else:
            self.page.get_by_text("BlockOn").click()

    # ========== Lid Temperature (State Mode) ==========

    def set_lid_temperature(self, temp: str) -> None:
        """
        Set the lid target temperature in state mode.

        Args:
            temp: Temperature value (e.g., "110").
        """
        lid_input = self.page.locator('input[name="lidTargetTemp"]')
        self.wait_for_visible(lid_input)
        lid_input.click()
        lid_input.fill(temp)

    def toggle_lid_temperature(self, enable: bool) -> None:
        """
        Toggle lid temperature on/off in state mode.

        Args:
            enable: True to turn on, False to turn off.
        """
        if enable:
            self.page.get_by_text("LidOff").click()
        else:
            self.page.get_by_text("LidOn").click()

    # ========== Lid Position ==========

    def set_lid_position(self, position: str) -> None:
        """
        Set the lid position (open or closed).

        Args:
            position: "open" or "closed".
        """
        if position == "open":
            self.page.get_by_text("Lid positionClosed").click()
        else:
            self.page.get_by_text("Lid positionOpen").click()

    # ========== Profile Mode: Well Volume & Temperatures ==========

    def set_well_volume(self, volume: str) -> None:
        """
        Set the well volume in profile mode.

        Args:
            volume: Volume value (e.g., "100").
        """
        vol_input = self.page.locator('input[name="profileVolume"]')
        self.wait_for_visible(vol_input)
        vol_input.click()
        vol_input.fill(volume)

    def set_profile_lid_temperature(self, temp: str) -> None:
        """
        Set the profile lid temperature in profile mode.

        Args:
            temp: Temperature value (e.g., "50").
        """
        lid_input = self.page.locator('input[name="profileTargetLidTemp"]')
        self.wait_for_visible(lid_input)
        lid_input.click()
        lid_input.fill(temp)

    def set_block_temperature_hold(self, temp: str) -> None:
        """
        Set the block temperature hold value in profile mode.

        Args:
            temp: Temperature value (e.g., "90").
        """
        hold_input = self.page.locator('input[name="blockTargetTempHold"]')
        self.wait_for_visible(hold_input)
        hold_input.click()
        hold_input.fill(temp)

    def set_lid_temperature_hold(self, temp: str) -> None:
        """
        Set the lid temperature hold value in profile mode.

        Args:
            temp: Temperature value (e.g., "40").
        """
        hold_input = self.page.locator('input[name="lidTargetTempHold"]')
        self.wait_for_visible(hold_input)
        hold_input.click()
        hold_input.fill(temp)

    # ========== Profile Programming Modal ==========

    def open_profile_programmer(self) -> "ThermocyclerProfileModal":
        """
        Open the profile programmer modal by clicking "No profile defined".

        Returns:
            ThermocyclerProfileModal page object for profile editing.
        """
        no_profile_button = self.page.locator("div").filter(has_text=re.compile(r"^No profile defined$"))
        self.wait_for_visible(no_profile_button)
        no_profile_button.click()

        # Wait for modal to open
        self.wait_for_visible(self.page.get_by_test_id("Modal_header"))

        return ThermocyclerProfileModal(self.page)

    # ========== Navigation & Saving ==========

    def save_step(self) -> None:
        """Click the Save button to confirm and close the step editor."""
        save_button = self.page.get_by_role("button", name="Save").first
        self.wait_for_visible(save_button)
        save_button.click()


class ThermocyclerProfileModal(BasePage):
    """Page object for the Thermocycler profile programming modal."""

    def __init__(self, page: Page) -> None:
        """Initialize the ThermocyclerProfileModal."""
        super().__init__(page)

    def wait_for_modal_load(self) -> None:
        """Wait for the profile modal to be fully loaded."""
        self.wait_for_visible(self.page.get_by_test_id("Modal_header"))

    # ========== Cycle Management ==========

    def add_cycle(self) -> None:
        """Add a new cycle to the profile."""
        add_button = self.page.get_by_role("button", name="Add cycle")
        self.wait_for_visible(add_button)
        add_button.click()
        # Wait for delete button to appear (indicates cycle was added)
        self.wait_for_visible(self.page.get_by_role("button", name="Delete").first)

    def delete_cycle(self, cycle_index: int) -> None:
        """
        Delete a cycle by index.

        Args:
            cycle_index: The index of the cycle to delete (0-based).
        """
        delete_button = self.page.get_by_role("button", name="Delete").nth(cycle_index)
        self.wait_for_visible(delete_button)
        delete_button.click()

    def set_cycle_count(self, cycle_index: int, count: str) -> None:
        """
        Set the number of repeats for a cycle.

        Args:
            cycle_index: The index of the cycle (0-based).
            count: The cycle count as a string (e.g., "2").
        """
        # Find the cycle container and locate the "Number of cycles" input
        cycle_container = self.page.get_by_test_id("thermocyclerCycle").nth(cycle_index)

        # Click on the "Number of cycles" area
        num_cycles_div = cycle_container.locator("div").filter(has_text="Number of cycles").nth(3)
        num_cycles_div.click()

        # Find the input within the cycles section using a shorter variable name
        cycles_input_selector = (
            "div:nth-child(3) > div > "
            ".Flex-sc-1qhp8l7-0.InputField___StyledFlex-sc-1gyyvht-2 > "
            ".Flex-sc-1qhp8l7-0 > "
            ".InputField__StyledInput-sc-1gyyvht-0"
        )
        cycles_input = self.page.locator(cycles_input_selector)
        cycles_input.fill(count)

    # ========== Cycle Steps ==========

    def add_cycle_step(self, cycle_index: int) -> None:
        """
        Add a step to a cycle.

        Args:
            cycle_index: The index of the cycle (0-based).
        """
        add_step_button = self.page.get_by_role("button", name="Add a cycle step")
        add_step_button.click()

    def fill_cycle_step(
        self,
        cycle_index: int,
        step_index: int,
        step_name: str,
        temperature: str,
        time: str,
    ) -> None:
        """
        Fill in a cycle step's details.

        Args:
            cycle_index: The index of the cycle (0-based).
            step_index: The index of the step within the cycle (0-based).
            step_name: The step name (e.g., "Cycle 1").
            temperature: The temperature (e.g., "40").
            time: The time in M:SS format (e.g., "1:00").
        """
        step_container = self.page.get_by_test_id(f"cycleStep-{step_index}")
        self.wait_for_visible(step_container)

        # Fill step name
        name_input = step_container.get_by_role("textbox").first
        self.wait_for_visible(name_input)
        name_input.click()
        name_input.fill(step_name)
        name_input.press("Tab")

        # Fill temperature
        temp_input = step_container.get_by_role("textbox").nth(1)
        self.wait_for_visible(temp_input)
        temp_input.click()
        temp_input.fill(temperature)
        temp_input.press("Tab")

        # Fill time
        time_input = step_container.get_by_role("textbox").nth(2)
        self.wait_for_visible(time_input)
        time_input.click()
        time_input.fill(time)

    def delete_cycle_step(self, cycle_index: int, step_index: int) -> None:
        """
        Delete a step from a cycle.

        Args:
            cycle_index: The index of the cycle (0-based).
            step_index: The index of the step within the cycle (0-based).
        """
        step_container = self.page.get_by_test_id(f"cycleStep-{step_index}")
        delete_button = step_container.get_by_role("button", name="Delete")
        delete_button.click()

    def save_cycle(self, cycle_index: int) -> None:
        """
        Save a cycle.

        Args:
            cycle_index: The index of the cycle (0-based).
        """
        cycle_container = self.page.get_by_test_id("thermocyclerCycle").nth(cycle_index)
        save_button = cycle_container.get_by_role("button", name="Save")
        save_button.click()

    # ========== Thermocycler Steps (Non-cycle steps) ==========

    def add_step(self) -> None:
        """Add a standalone thermocycler step to the profile."""
        add_button = self.page.get_by_role("button", name="Add step")
        self.wait_for_visible(add_button)
        add_button.click()

    def fill_thermocycler_step(
        self,
        step_index: int,
        step_name: str,
        temperature: str,
        time: str,
    ) -> None:
        """
        Fill in a standalone thermocycler step's details.

        Args:
            step_index: The index of the thermocycler step (0-based).
            step_name: The step name (e.g., "Thermocycler step 2").
            temperature: The temperature (e.g., "25").
            time: The time in HH:MM or M:SS format (e.g., "02:02").
        """
        step_container = self.page.get_by_test_id(f"thermocyclerStep-{step_index}")
        self.wait_for_visible(step_container)

        # Fill step name
        name_input = step_container.get_by_role("textbox").first
        self.wait_for_visible(name_input)
        name_input.click()
        name_input.fill(step_name)
        name_input.press("Tab")

        # Fill temperature
        temp_input = step_container.get_by_role("textbox").nth(1)
        self.wait_for_visible(temp_input)
        temp_input.click()
        temp_input.fill(temperature)
        temp_input.press("Tab")

        # Fill time
        time_input = step_container.get_by_role("textbox").nth(2)
        self.wait_for_visible(time_input)
        time_input.click()
        time_input.fill(time)

    def delete_thermocycler_step(self, step_index: int) -> None:
        """
        Delete a standalone thermocycler step.

        Args:
            step_index: The index of the thermocycler step (0-based).
        """
        delete_button = self.page.get_by_test_id("cycleStep-0").locator("path")
        delete_button.click()

    def save_thermocycler_step(self, step_index: int) -> None:
        """
        Save a standalone thermocycler step.

        Args:
            step_index: The index of the thermocycler step (0-based).
        """
        step_container = self.page.get_by_test_id(f"thermocyclerStep-{step_index}")
        self.wait_for_visible(step_container)

        save_button = step_container.get_by_role("button", name="Save")
        self.wait_for_visible(save_button)
        save_button.click()

    # ========== Modal Navigation ==========

    def save_and_close_profile(self) -> None:
        """Save the profile and close the modal."""
        modal = self.page.get_by_label("ModalShell_ModalArea")
        save_button = modal.get_by_role("button", name="Save")
        save_button.click()

    def cancel_and_close_profile(self) -> None:
        """Cancel and close the profile modal without saving."""
        modal = self.page.get_by_label("ModalShell_ModalArea")
        cancel_button = modal.get_by_role("button", name="Cancel")
        cancel_button.click()
