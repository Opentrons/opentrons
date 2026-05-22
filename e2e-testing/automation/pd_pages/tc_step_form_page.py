"""Module for interactions within the Thermocycler Step configuration form."""

import re
from typing import Optional

from playwright.sync_api import Page

from automation.base_page import BasePage


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
            self.page.get_by_test_id("ToggleButton_Closed").click()
        else:
            self.page.get_by_test_id("ToggleButton_Open").click()

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
        cycle_container = self.page.locator(f'[aria-label="Thermocycler cycle {cycle_index + 1}"]')

        # Click on the "Number of cycles" area
        num_cycles_div = cycle_container.locator("div").filter(has_text="Number of cycles").nth(3)
        num_cycles_div.click()
        target = self.page.get_by_text("Number of cycles").locator("..").locator("..").locator("input")
        target.fill(count)

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
        step_container = self.page.locator(f'[aria-label="Thermocycler cycle step {step_index + 1}"]')
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
        step_container = self.page.locator(f'[aria-label="Thermocycler cycle step {step_index + 1}"]')
        self.wait_for_visible(step_container)
        delete_button = self.page.locator(f'[aria-label="Delete thermocycler cycle step {step_index + 1}"]')
        delete_button.click()

    def save_cycle(self, cycle_index: int) -> None:
        """
        Save a cycle.

        Args:
            cycle_index: The index of the cycle (0-based).
        """
        cycle_container = self.page.locator(f'[aria-label="Thermocycler cycle {cycle_index + 1}"]')
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
        delete_button = self.page.get_by_label(f"Delete thermocycler cycle step {step_index + 1}")
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


# Composite steps


def _add_thermocycler_state_step(
    page: Page,
    block_temp: Optional[str] = None,
    lid_temp: Optional[str] = None,
    lid_position: str = "open",
) -> None:
    """Add a Thermocycler step in STATE mode with configurable parameters.

    Args:
        page: The Playwright Page object for raw interactions.
        block_temp: Block target temperature (e.g., "40"). If None, block is not toggled.
        lid_temp: Lid target temperature (e.g., "110"). If None, lid is not toggled.
        lid_position: Lid position ("open" or "closed"). Defaults to "open".
    """
    tc_page = ThermocyclerStepPage(page)

    print("✓ Thermocycler step form loaded (State mode)")

    tc_page.select_state_mode()
    print("✓ State mode selected")

    if block_temp is not None:
        tc_page.toggle_block_temperature(enable=True)
        tc_page.set_block_temperature(block_temp)
        print(f"✓ Block temperature: ON at {block_temp}°C")
    else:
        print("⊘ Block temperature: not configured")

    if lid_temp is not None:
        tc_page.toggle_lid_temperature(enable=True)
        tc_page.set_lid_temperature(lid_temp)
        print(f"✓ Lid temperature: ON at {lid_temp}°C")
    else:
        print("⊘ Lid temperature: not configured")

    tc_page.set_lid_position(lid_position)
    print(f"✓ Lid position: {lid_position.upper()}")

    tc_page.save_step()
    print("✅ Thermocycler state step saved")


def _add_thermocycler_profile_step(
    page: Page,
    well_volume: str = "100",
    lid_temp: str = "50",
    cycles: Optional[list] = None,
) -> None:
    """Add a Thermocycler step in PROFILE mode with configurable cycle definition.

    Args:
        page: The Playwright Page object for raw interactions.
        well_volume: Well volume in µL (e.g., "100").
        lid_temp: Lid temperature (e.g., "50").
        cycles: List of cycle dictionaries. Each dict should contain:
            {
                "repeat_count": "2",
                "steps": [
                    {
                        "name": "Cycle 1",
                        "temperature": "40",
                        "time": "1:00"
                    },
                    ...
                ]
            }
            If None, defaults to a single cycle with 2 steps repeating 2 times.

    Example:
        _add_thermocycler_profile_step(
            well_volume="100",
            lid_temp="50",
            cycles=[{
                "repeat_count": "35",
                "steps": [
                    {"name": "Denature", "temperature": "95", "time": "0:30"},
                    {"name": "Anneal", "temperature": "60", "time": "0:30"},
                ]
            }]
        )
    """
    if cycles is None:
        cycles = [
            {
                "repeat_count": "2",
                "steps": [
                    {"name": "Cycle 1", "temperature": "40", "time": "1:00"},
                    {"name": "Cycle 2", "temperature": "4", "time": "0:01"},
                ],
            }
        ]

    tc_page = ThermocyclerStepPage(page)

    print("✓ Thermocycler step form loaded (Profile mode)")

    tc_page.select_profile_mode()
    print("✓ Profile mode selected")

    tc_page.set_well_volume(well_volume)
    print(f"✓ Well volume: {well_volume} µL")

    tc_page.set_profile_lid_temperature(lid_temp)
    print(f"✓ Lid temperature: {lid_temp}°C")

    profile_modal = tc_page.open_profile_programmer()
    profile_modal.wait_for_modal_load()

    for cycle_idx, cycle_config in enumerate(cycles):
        profile_modal.add_cycle()
        profile_modal.delete_thermocycler_step(step_index=0)
        print(f"✓ Cycle {cycle_idx} added")

        steps = cycle_config.get("steps", [])
        for step_idx, step_config in enumerate(steps):
            # to avoid arbitrary
            profile_modal.add_cycle_step(cycle_index=cycle_idx)
            profile_modal.fill_cycle_step(
                cycle_index=cycle_idx,
                step_index=step_idx,
                step_name=step_config["name"],
                temperature=step_config["temperature"],
                time=step_config["time"],
            )
            print(
                f"  ✓ Step {step_idx}: {step_config['name']} @ {step_config['temperature']}°C for {step_config['time']}"
            )

        repeat_count = cycle_config.get("repeat_count", "1")
        profile_modal.set_cycle_count(cycle_index=cycle_idx, count=repeat_count)
        print(f"✓ Cycle {cycle_idx} repeat count: {repeat_count}")

        profile_modal.save_cycle(cycle_index=cycle_idx)
        print(f"✓ Cycle {cycle_idx} saved")

    profile_modal.save_and_close_profile()
    print("✓ Profile modal saved and closed")

    tc_page.save_step()
    print("✅ Thermocycler profile step saved")
    page.get_by_text("Confirm").click()
