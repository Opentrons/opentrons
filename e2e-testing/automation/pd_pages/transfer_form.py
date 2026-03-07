"""Protocol editor page object."""

import re
from typing import List, Literal, Optional, Union

from playwright.sync_api import Page

from automation.base_page import BasePage


class TransferPage(BasePage):
    """Main transfer page for configuring transfer steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    ## Step 1 Transfer Form Methods

    def select_nozzles(self, nozzles: Literal["All", "Column", "Single"]) -> None:
        """
        Select nozzles for transfer step.
        args:
            nozzles: Choose between
            All, Column, or Single nozzles.
        """
        initial_nozzle = self.page.get_by_text("All")
        initial_nozzle.click()
        actual_nozzle_option = self.page.get_by_text(nozzles)
        actual_nozzle_option.click()

    def tip_rack_page_1_transfer_select(self, tiprack: str) -> None:
        """Select tip rack
        args:
            tiprack: The tip rack to select like "Opentrons 96 Filter Tip Rack 20 µL".
        """
        self.page.get_by_test_id("tipRack_dropdownMenu").click()
        tip_rack = self.page.get_by_text(tiprack)
        tip_rack.click()

    def source_labware_select(self, labware: str) -> None:
        """Select source labware in transfer step.
        args:
            labware: The labware to select like "Opentrons Tough 300 mL 1 Well Reservoir".
        """
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
                self.page.locator(f'circle[data-wellname="{well}"]').click()
        self.page.get_by_text("Save", exact=True).click()

    def destination_labware_select(self, labware: str) -> None:
        """Select destination labware in transfer step."""
        self.page.get_by_test_id("dispense_labware_dropdownMenu").click()
        option = self.page.get_by_role("listbox").get_by_text(labware)
        option.scroll_into_view_if_needed()
        option.click()

    def pipette_path_select(self, pathtype: str) -> None:
        """Select pipette path type in transfer step.
        Args:
            pathtype: The type of pipette path to select like
            "Single transfer", "Consolidate", or "Distribute".
        """
        path_option = self.page.get_by_text(re.compile(pathtype, re.IGNORECASE))

        path_option.click()

    def input_volume(self, volume: str) -> None:
        """Input volume for transfer step.
        args:
            volume: The volume to input like "30".
        """
        volume_input = self.page.locator('input[name="volume"]')
        volume_input.fill(volume)

    def transfer_continue_to_next_step(self) -> None:
        """Click continue to next step button in transfer step."""
        self.dismiss_release_notes_toast()
        self.page.get_by_text("Continue").click()

    def go_back_to_previous_step(self) -> None:
        """Click back to previous step button in transfer step."""
        self.page.get_by_text("Back", exact=True).click()

    ## STEP 2 Selecting liquid class

    def part_2_transfer_form_liquid_class(self, liquid_class: str) -> None:
        """Select liquid class in part 2 of transfer step.
        Args:
            liquid_class: The liquid class to select like "Aqueous", "Viscous", "Volatile", etc.
        """
        liquid_class_option = self.page.get_by_text(liquid_class)
        liquid_class_option.click()

    ### Step 3 transfer form Aspiration and Dispense

    def select_aspirate_or_dispense_advanced_settings(self, setting: Literal["Aspirate", "Dispense"]) -> None:
        """Select advanced settings for aspirate or dispense.
        Args:
            setting: Choose between "Aspirate" or "Dispense".
        """
        if setting == "Aspirate":
            self.page.get_by_role("button", name="Aspirate").click()
        elif setting == "Dispense":
            self.page.get_by_role("button", name="Dispense").click()

    def update_or_keep_liquid_class_settings(self, action: Literal["Update settings", "Keep current settings"]) -> None:
        """Click to update or keep current liquid class settings.
        Args:
            action: Choose between "Update settings" or "Keep current settings".
        """
        if action == "Update settings":
            self.page.get_by_text("Update settings").click()
        elif action == "Keep current settings":
            self.page.get_by_text("Keep current settings").click()

    def set_flow_rate_aspirate(self, flow_rate: float) -> None:
        """Sets the aspirate flow rate based on field name.
        Args:
            flow_rate: The aspirate flow rate (µL/s).
        """
        self.page.locator('input[name="aspirate_flowRate"]').fill(str(flow_rate))

    # Submerge and Retract Settings
    def set_submerge_and_retract(
        self, aspirate: bool, submerge_speed: float, submerge_delay: float, retract_speed: float, retract_delay: float
    ) -> None:
        """
        ToDO: Please include snapshot before/after
        Sets the submerge and retract settings for aspirate or dispense.
        Args:
            aspirate: True for aspirate settings, False for dispense settings.
            submerge_speed: Speed for submerging (mm/s).
            submerge_delay: Delay time for submerging (s).
            retract_speed: Speed for retracting (mm/s).
            retract_delay: Delay time for retracting (s).
        """
        if aspirate:
            strat = "aspirate"
        else:
            strat = "dispense"
        """Sets the submerge and retract settings based on field names."""
        # Submerge
        self.page.locator(f'input[name="{strat}_submerge_speed"]').fill(str(submerge_speed))
        self.page.locator(f'input[name="{strat}_submerge_delay_seconds"]').fill(str(submerge_delay))
        # Retract
        self.page.locator(f'input[name="{strat}_retract_speed"]').fill(str(retract_speed))
        self.page.locator(f'input[name="{strat}_retract_delay_seconds"]').fill(str(retract_delay))

    ## Positions
    def xyz_position(self, xyz: tuple[float, float, float]) -> None:
        """
        Sets the XYZ position settings for anything that uses XYZ coordinates.
        Args:
            x: X coordinate (mm).
            y: Y coordinate (mm).
            z: Z coordinate (mm).
        """
        self.page.get_by_test_id("TipPositionModal_x_custom_input").fill(str(xyz[0]))
        self.page.get_by_test_id("TipPositionModal_y_custom_input").fill(str(xyz[1]))
        self.page.get_by_test_id("TipPositionModal_z_custom_input").fill(str(xyz[2]))

    def tip_position_asp_disp(self, aspirate: bool, xyz: tuple[float, float, float]) -> None:
        """
        Sets the tip position settings for aspirate or dispense.
        Args:
            aspirate: True for aspirate settings, False for dispense settings.
            xyz: A tuple containing the X, Y, and Z coordinates (mm).
        """
        if aspirate:
            strat = "aspirate"
        else:
            strat = "dispense"

        self.page.get_by_test_id(f"PositionField_ListButton_{strat}").click()
        self.xyz_position(xyz)
        self.page.get_by_text("Save", exact=True).click()

    def tip_position_submerge_retract(self, aspirate: bool, submerge: bool, xyz: tuple[float, float, float]) -> None:
        """
        Sets the tip position settings for aspirate or dispense.
        Args:
            aspirate: True for aspirate settings, False for dispense settings.
            submerge: True for submerge settings, False for retract settings.
            xyz: A tuple containing the X, Y, and Z coordinates (mm).
        """
        if aspirate:
            strat = "aspirate"
        else:
            strat = "dispense"
        if submerge:
            summerge_strat = "submerge"
        else:
            summerge_strat = "retract"

        """Sets the tip position settings based on field names."""
        self.page.get_by_test_id(f"PositionField_ListButton_{strat}_{summerge_strat}").click()
        self.xyz_position(xyz)
        self.page.get_by_text("Save", exact=True).click()

    ## Advanced Settings

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
                self.page.locator(f"input[name='{strat}_touchTip_mmFromEdge']").fill(str(distance))
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

    def set_blowout(self, location: str, flow_rate: float, enable: bool) -> None:
        """
        Configures blowout settings.

        Args:
            location: The blowout location, e.g., "Source well", "Destination well", "Trash"
            or "Waste chute"
            flow_rate: The blowout flow rate (µL/s).
        """
        if enable:
            self.page.get_by_text("Blowout").click()
            self.page.get_by_test_id("blowout_location_dropdownMenu").click()
            self.page.get_by_text(location, exact=True).click()
            self.page.locator('input[name="blowout_flowRate"]').fill(str(flow_rate))
        else:
            pass

    def set_disposal_volume(self, volume: float, location: str, flowrate: float, enable: bool) -> None:
        """
        Configures disposal volume settings.

        Args:
            volume: The disposal volume (µL).
            location: The disposal location, e.g., "Source well", "Destination well", "Trash"
            or "Waste chute"
            flowrate: The disposal flow rate (µL/s).
        """
        if enable:
            self.page.locator('input[name="disposalVolume_volume"]').fill(str(volume))
            self.page.get_by_test_id("blowout_location_dropdownMenu").select_option(label=location)
            self.page.locator('input[name="blowout_flowRate"]').fill(str(flowrate))
        else:
            pass

    def advanced_settings(
        self,
        Aspirate: bool,
        Pre_wetting: Optional[bool] = False,
        Touch_tip: bool = False,
        Touch_tip_speed: Optional[float] = None,
        Touch_tip_distance_from_edge: Optional[float] = None,
        Air_gap: bool = False,
        Air_gap_volume: Optional[float] = None,
        Delay: bool = False,
        Delay_time: Optional[float] = None,
        set_blowout: Optional[bool] = False,
        set_disposal_volume: Optional[bool] = False,
        blowout_location: Optional[str] = None,
        blowout_flow_rate: Optional[float] = None,
        disposal_volume: Optional[float] = None,
        disposal_location: Optional[str] = None,
        disposal_flowrate: Optional[float] = None,
    ) -> None:
        """
        Sets advanced settings based on aspirate or dispense.
        args:
            Aspirate: True for aspirate settings, False for dispense settings.
            Pre_wetting: True to enable pre-wetting, False to disable.
            Touch_tip: True to enable touch tip, False to disable.
            Touch_tip_speed: Speed for touch tip (mm/s).
            Touch_tip_distance_from_edge: Distance from edge for touch tip (mm).
            Air_gap: True to enable air gap, False to disable.
            Air_gap_volume: Volume for air gap (µL).
            Delay: True to enable delay, False to disable.
            Delay_time: Time for delay (s).
            set_blowout: True to enable blowout settings, False to disable.
            blowout_location: Location for blowout.
            blowout_flow_rate: Flow rate for blowout (µL/s).
            set_disposal_volume: True to enable disposal volume settings, False to disable.
            disposal_volume: Volume for disposal (µL).
            disposal_location: Location for disposal.
            disposal_flowrate: Flow rate for disposal (µL/s).
        """
        strat = "aspirate" if Aspirate else "dispense"
        if strat == "aspirate":
            if Pre_wetting:
                self.set_pre_wetting(Pre_wetting)
        else:
            if set_blowout and blowout_location is not None and blowout_flow_rate is not None:
                self.set_blowout(
                    location=blowout_location,
                    flow_rate=blowout_flow_rate,
                    enable=True,
                )
            if (
                set_disposal_volume
                and disposal_volume is not None
                and disposal_location is not None
                and disposal_flowrate is not None
            ):
                self.set_disposal_volume(
                    volume=disposal_volume,
                    location=disposal_location,
                    flowrate=disposal_flowrate,
                    enable=True,
                )
        if Touch_tip:
            self.set_touch_tip(strat, True, Touch_tip_speed, Touch_tip_distance_from_edge)
        if Air_gap and Air_gap_volume is not None:
            self.set_air_gap(strat, True, Air_gap_volume)
        if Delay and Delay_time is not None:
            self.set_delay(strat, True, Delay_time)

    def set_mix_settings(self, mix_times: int, mix_volume: float, aspirate: bool) -> None:
        """Sets mix settings based on dynamic field names."""
        # Cleanly determine strategy
        strat = "aspirate" if aspirate else "dispense"
        self.page.get_by_text("Mix").click()
        self.page.locator(f"input[name='{strat}_mix_times']").fill(str(mix_times))
        self.page.locator(f"input[name='{strat}_mix_volume']").fill(str(mix_volume))

    ## Step 4
    def tip_change_strategy(self, tipstrat: str, drop_location: str) -> None:
        """Sets tip change strategy to Once and drop location to Tip rack.
        args:
            tipstrat: Tip change strategy like "Once", "Always", "Never", etc.
            drop_location: Drop location like "Tip rack", "Trash", etc.
        """
        self.page.get_by_test_id("changeTip_dropdownMenu").click()
        self.page.get_by_text(tipstrat).click()
        self.page.get_by_test_id("dropTip_location_dropdownMenu").click()
        self.page.get_by_text(drop_location).click()

    def save_transfer_step(self) -> None:
        """Click save transfer step button in transfer step."""
        self.page.get_by_text("Save", exact=True).click()
