"""Protocol editor page object."""

import re
from typing import List, Literal, Optional, Union

from playwright.sync_api import Page

from .base_page import BasePage


class TransferPage(BasePage):
    """Main transfer page for configuring transfer steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def select_nozzles(self, nozzles: Literal["All", "Column", "Single"]) -> None:
        """Select from All, Column, or Single nozzles."""
        initial_nozzle = self.page.get_by_text("All")
        initial_nozzle.click()
        actual_nozzle_option = self.page.get_by_text(nozzles)
        actual_nozzle_option.click()

    def tip_rack_page_1_transfer_select(self, tiprack: str) -> None:
        """Select tip rack on page 1 of transfer step for Flex robot."""
        self.page.get_by_test_id("tipRack_dropdownMenu").click()
        tip_rack = self.page.get_by_text(tiprack)
        tip_rack.click()

    def source_labware_select(self, labware: str) -> None:
        """Select source labware in transfer step."""
        self.page.get_by_test_id("aspirate_labware_dropdownMenu").click()
        source_labware = self.page.get_by_text(labware)
        source_labware.click()

    locations = Literal["Source", "Destination"]

    def wells_select(self, location: locations, wells: Union[str, List[str]], rect: bool = True) -> None:
        """
        Select source wells.
        Args:
            wells: A single well name (e.g., "A1") or a list (e.g., ["A1", "B1", "C1"]).
            rect: If True, uses the 'rect' selector logic for SVG grids.
        """
        if location == "Source":
            self.page.locator('input[name="aspirate_wells"]').click()
        elif location == "Destination":
            self.page.locator('input[name="dispense_wells"]').click()

        # 2. Convert single string to list for uniform processing
        well_list = [wells] if isinstance(wells, str) else wells

        for well in well_list:
            if rect:
                # Target the SVG rect specifically by its data attribute
                self.page.locator(f'rect[data-wellname="{well}"]').click()
            else:
                # Fallback for non-rect elements if applicable
                self.page.get_by_text(f'circle[data-wellname="{well}"]').click()
        self.page.get_by_text("Save", exact=True).click()

    def destination_labware_select(self, labware: str) -> None:
        """Select destination labware in transfer step."""
        self.page.get_by_test_id("dispense_labware_dropdownMenu").click()
        destination_labware = self.page.get_by_text(labware)
        destination_labware.click()

    def pipette_path_select(self, pathtype: str) -> None:
        """Select pipette path type in transfer step.
        Args:
            pathtype: The type of pipette path to select like
            "Single transfer", "Consolidate", or "Distribute".
        """
        path_option = self.page.get_by_text(re.compile(pathtype, re.IGNORECASE))

        path_option.click()

    def input_volume(self, volume: str) -> None:
        """Input volume for transfer step."""
        volume_input = self.page.locator('input[name="volume"]')
        volume_input.fill(volume)

    def transfer_continue_to_next_step(self) -> None:
        """Click continue to next step button in transfer step."""
        self.page.get_by_text("Continue").click()

    def go_back_to_previous_step(self) -> None:
        """Click back to previous step button in transfer step."""
        self.page.get_by_text("Back", exact=True).click()

    def part_2_transfer_form_liquid_class(self, liquid_class: str) -> None:
        """Select liquid class in part 2 of transfer step.
        Args:
            liquid_class: The liquid class to select like "Aqueous", "Viscous", "Volatile", etc.
        """
        liquid_class_option = self.page.get_by_text(liquid_class)
        liquid_class_option.click()

    def select_aspirate_or_dispense_advanced_settings(self, setting: Literal["Aspirate", "Dispense"]) -> None:
        """Select advanced settings for aspirate or dispense."""
        if setting == "Aspirate":
            self.page.get_by_role("button", name="Aspirate").click()
        elif setting == "Dispense":
            self.page.get_by_role("button", name="Dispense").click()

    def update_or_keep_liquid_class_settings(self, action: Literal["Update settings", "Keep current settings"]) -> None:
        """Click to update or keep current liquid class settings."""
        if action == "Update settings":
            self.page.get_by_text("Update settings").click()
        elif action == "Keep current settings":
            self.page.get_by_text("Keep current settings").click()

    def set_flow_rate_aspirate(self, flow_rate: float) -> None:
        """Sets the aspirate flow rate based on field name."""
        self.page.locator('input[name="aspirate_flowRate"]').fill(str(flow_rate))

    def set_submerge_and_retract_aspirate(
        self, submerge_speed: float, submerge_delay: float, retract_speed: float, retract_delay: float
    ) -> None:
        """Sets the submerge and retract settings based on field names."""
        # Submerge
        self.page.locator('input[name="aspirate_submerge_speed"]').fill(str(submerge_speed))
        self.page.locator('input[name="aspirate_submerge_delay_seconds"]').fill(str(submerge_delay))
        # Retract
        self.page.locator('input[name="aspirate_retract_speed"]').fill(str(retract_speed))
        self.page.locator('input[name="aspirate_retract_delay_seconds"]').fill(str(retract_delay))

    def set_pre_wetting(self, enable: bool) -> None:
        """
        Toggles the 'Pre-wet tip' setting.

        Args:
            enable: If True, ensures the Pre-wet tip toggle is clicked.
        """
        if enable:
            self.page.get_by_text("Pre-wet tip", exact=True).click()

    def set_touch_tip(
        self, strat: str, enable: bool, speed: Optional[float] = None, distance: Optional[float] = None
    ) -> None:
        """
        Syncs the Touch Tip toggle state and optionally updates speed and distance.

        Uses the visibility of the speed input to determine if the section needs
        to be expanded or collapsed to match the 'enable' state.

        Args:
            strat: UI prefix, either 'aspirate' or 'dispense'.
            enable: The desired state of the Touch Tip setting.
            speed: Optional speed value (mm/s) to fill.
            distance: Optional distance from edge (mm) to fill.
        """
        input_locator = self.page.locator(f"input[name='{strat}_touchTip_speed']")
        is_visible = input_locator.is_visible()

        if enable:
            if not is_visible:
                self.page.get_by_text("Touch tip", exact=True).click()
            if speed is not None:
                input_locator.fill(str(speed))
            if distance is not None:
                self.page.locator(f"input[name='{strat}_touchTip_distance_from_edge']").fill(str(distance))
        elif is_visible:
            self.page.get_by_text("Touch tip", exact=True).click()

    def set_air_gap(self, strat: str, enable: bool, volume: Optional[float] = None) -> None:
        """
        Syncs the Air Gap toggle state and optionally updates the volume.

        Args:
            strat: UI prefix, either 'aspirate' or 'dispense'.
            enable: The desired state of the Air Gap setting.
            volume: Optional volume value (µL) to fill.
        """
        input_locator = self.page.locator(f"input[name='{strat}_airGap_volume']")
        is_visible = input_locator.is_visible()

        if enable:
            if not is_visible:
                self.page.get_by_text("Air gap", exact=True).click()
            if volume is not None:
                input_locator.fill(str(volume))
        elif is_visible:
            self.page.get_by_text("Air gap", exact=True).click()

    def set_delay(self, strat: str, enable: bool, seconds: Optional[float] = None) -> None:
        """
        Syncs the Delay toggle state and optionally updates the duration.

        Args:
            strat: UI prefix, either 'aspirate' or 'dispense'.
            enable: The desired state of the Delay setting.
            seconds: Optional time value (s) to fill.
        """
        input_locator = self.page.locator(f"input[name='{strat}_delay_seconds']")
        is_visible = input_locator.is_visible()

        if enable:
            if not is_visible:
                self.page.get_by_text("Delay", exact=True).click()
            if seconds is not None:
                input_locator.fill(str(seconds))
        elif is_visible:
            self.page.get_by_text("Delay", exact=True).click()

    def advanced_settings(
        self,
        Aspirate: bool,
        Pre_wetting: bool = False,
        Touch_tip: bool = False,
        Touch_tip_speed: Optional[float] = None,
        Touch_tip_distance_from_edge: Optional[float] = None,
        Air_gap: bool = False,
        Air_gap_volume: Optional[float] = None,
        Delay: bool = False,
        Delay_time: Optional[float] = None,
    ) -> None:
        """
        High-level orchestrator to configure all advanced pipetting parameters.

        This method determines the 'aspirate' or 'dispense' context and delegates
        individual settings to their respective handler functions.

        Args:
            Aspirate: True for 'aspirate' context, False for 'dispense'.
            Pre_wetting: Whether to toggle Pre-wetting ON.
            Touch_tip: Whether the Touch Tip setting should be ON or OFF.
            Touch_tip_speed: Speed for touch tip (only filled if Touch_tip=True).
            Touch_tip_distance_from_edge: Offset from edge (only filled if Touch_tip=True).
            Air_gap: Whether the Air Gap setting should be ON or OFF.
            Air_gap_volume: Volume for air gap (only filled if Air_gap=True).
            Delay: Whether the Delay setting should be ON or OFF.
            Delay_time: Seconds for delay (only filled if Delay=True).
        """
        strat = "aspirate" if Aspirate else "dispense"

        self.set_pre_wetting(Pre_wetting)
        self.set_touch_tip(strat, Touch_tip, Touch_tip_speed, Touch_tip_distance_from_edge)
        self.set_air_gap(strat, Air_gap, Air_gap_volume)
        self.set_delay(strat, Delay, Delay_time)

    def set_mix_settings(self, mix_times: int, mix_volume: float, aspirate: bool) -> None:
        """Sets mix settings based on dynamic field names."""
        # Cleanly determine strategy
        strat = "aspirate" if aspirate else "dispense"
        self.page.get_by_text("Mix").click()
        self.page.locator(f"input[name='{strat}_mix_times']").fill(str(mix_times))
        self.page.locator(f"input[name='{strat}_mix_volume']").fill(str(mix_volume))
