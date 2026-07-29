"""Protocol editor page object."""

import re
from dataclasses import dataclass
from typing import List, Literal, Optional, Union

from playwright.sync_api import Locator, Page, expect

from automation.base_page import BasePage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage


class TransferPage(BasePage):
    """Main transfer page for configuring transfer steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    ## Step 1 Transfer Form Methods
    def _modal_area(self) -> Locator:
        return self.page.get_by_label("ModalShell_ModalArea")

    def tip_rack_page_1_transfer_select(self, tiprack: str) -> None:
        """Select tip rack
        args:
            tiprack: The tip rack to select like "Opentrons 96 Filter Tip Rack 20 µL".
        """
        self.tip_rack_select(tiprack)

    def tip_rack_select(self, tiprack: str) -> None:
        """Select tip rack in transfer step step 1, if multiple racks are available."""
        if self._static_tiprack_field_matches(tiprack):
            return

        dropdown = self.page.get_by_test_id("tipRack_dropdownMenu")
        if dropdown.count() == 0:
            return

        current_value = " ".join(dropdown.inner_text().split())
        if tiprack in current_value:
            return

        self.wait_for_visible(dropdown)
        dropdown.click()

        listbox = self.page.locator("div[role='listbox']").last
        self.wait_for_visible(listbox)
        buttons = listbox.locator("button")
        exact_match = None
        partial_match = None
        for index in range(buttons.count()):
            button = buttons.nth(index)
            normalized = " ".join(button.inner_text().split())
            if tiprack == normalized:
                exact_match = button
                break
            if tiprack in normalized and partial_match is None:
                partial_match = button

        target = exact_match if exact_match is not None else partial_match
        if target is not None:
            target.click()
            return

        available = buttons.all_inner_texts()
        raise AssertionError(f"Tip rack option '{tiprack}' not found. Available options: {available}")

    def _static_tiprack_field_matches(self, tiprack: str) -> bool:
        """Return True when Tiprack is a read-only field already showing the requested rack."""
        label = self.page.get_by_text("Tiprack", exact=True)
        if label.count() == 0:
            label = self.page.get_by_text("Tiprack", exact=False)
        if label.count() == 0:
            return False

        list_item = label.first.locator("xpath=../*[@data-testid='ListItem_default']")
        if list_item.count() == 0:
            list_item = label.first.locator("xpath=../../*[@data-testid='ListItem_default']")
        if list_item.count() == 0:
            return False

        texts = [" ".join(text.split()) for text in list_item.locator("p").all_inner_texts()]
        return any(tiprack in text for text in texts)

    def pipette_select(self, pipette: str) -> None:
        """Select pipette in transfer step step 1."""
        dropdown = self.page.get_by_test_id("pipette_dropdownMenu")
        if dropdown.count() == 0:
            return
        self.wait_for_visible(dropdown)
        dropdown.click()
        self.page.get_by_role("listbox").get_by_text(pipette).click()

    def source_labware_select(self, labware: str) -> None:
        """Select source labware in transfer step.
        args:
            labware: The labware to select like "Opentrons Tough 300 mL 1 Well Reservoir".
        """
        self._select_labware_dropdown_option("aspirate_labware_dropdownMenu", labware)

    locations = Literal["Source", "Destination"]

    def open_nozzle_and_well_selector(self) -> None:
        """Open the well selector modal."""
        self.page.get_by_test_id("nozzle_and_well_modal").click()

    def select_nozzles(self) -> None:
        """Select all nozzles and continue to well selection."""
        self.select_nozzle_configuration("All nozzles (recommended)")

    NozzleConfig = Literal[
        "All nozzles (recommended)",
        "Single nozzle",
        "Single column of nozzles",
        "Single row of nozzles",
        "Partial nozzles",
    ]

    def select_primary_nozzle(self, nozzle: str) -> None:
        """Click a primary nozzle in the 96-channel nozzle selection modal."""
        modal = self._modal_area()
        modal.locator(f'[data-wellname="{nozzle}"]').click()

    def select_nozzle_configuration(
        self,
        config: NozzleConfig,
        partial_count: Optional[int] = None,
        primary_nozzle: Optional[str] = None,
    ) -> None:
        """Select nozzle configuration in step 1 of the nozzle/well modal."""
        modal = self._modal_area()
        self.wait_for_visible(modal.get_by_text("Select Pipette nozzles to use", exact=False).first)
        self.wait_for_visible(modal.get_by_role("button", name="Continue"))
        modal.locator(f'label:has-text("{config}")').click()
        if partial_count is not None:
            self.select_partial_nozzle_count(partial_count)
        if primary_nozzle is not None:
            self.select_primary_nozzle(primary_nozzle)
        modal.get_by_role("button", name="Continue").click()

    def select_partial_nozzle_count(self, count: int) -> None:
        """Select partial nozzle count from the dropdown (e.g. 5 for 5/8 nozzles)."""
        modal = self._modal_area()
        dropdown = modal.get_by_test_id("dropdownMenu")
        self.wait_for_visible(dropdown)
        dropdown.click()
        modal.get_by_role("listbox").get_by_text(f"{count} nozzles", exact=True).click()

    def configure_nozzle_and_wells(
        self,
        *,
        nozzle_config: NozzleConfig,
        partial_count: Optional[int],
        source_labware: str,
        source_wells: Union[str, List[str]],
        dest_labware: str,
        dest_wells: Union[str, List[str]],
        primary_nozzle: Optional[str] = None,
    ) -> None:
        """Open the nozzle/well modal and complete all three wizard steps."""
        self.open_nozzle_and_well_selector()
        self.select_nozzle_configuration(nozzle_config, partial_count, primary_nozzle)
        self.wells_select("Source", source_labware, source_wells, False)
        self.wells_select("Destination", dest_labware, dest_wells, True)

    def _click_well_in_modal(self, modal: Locator, well: str) -> None:
        """Click a well or tip in a modal via mouse coordinates for SelectionRect.

        Prefer ``data-wellname`` (the element ``getCollidingWells`` uses) over ``#id``,
        which can resolve to a non-interactive outer SVG wrapper.
        """
        well_locator = modal.locator(f"[data-wellname='{well}']").first
        if well_locator.count() == 0:
            well_locator = modal.locator(f"#{well}").first
        if well_locator.count() == 0:
            well_locator = modal.locator(f"[id='{well}']").first
        well_locator.scroll_into_view_if_needed()
        self.wait_for_visible(well_locator)
        box = well_locator.bounding_box()
        if box is not None:
            cx = box["x"] + box["width"] / 2
            cy = box["y"] + box["height"] / 2
            # Tiny non-zero drag so SelectionRect registers a collision without
            # spanning neighboring wells on a dense 96-well map.
            self.page.mouse.move(cx, cy)
            self.page.mouse.down()
            self.page.mouse.move(cx + 1, cy + 1)
            self.page.mouse.up()
        else:
            well_locator.click(force=True)

    def _well_selector_labware_label(self, labware: str) -> str:
        """Well selector headings use labware displayName, not slot or deck nicknames."""
        normalized = re.sub(r"\s+\(\d+\)$", "", labware)
        slot_match = re.match(r"^([A-D]\d+)\s+(.+)$", normalized)
        if slot_match is not None:
            return slot_match.group(2)
        return normalized

    def wells_select(
        self, location: locations, labwareName: str, wells: Union[str, List[str]], finalStep: bool
    ) -> None:
        """
        Select source or destination wells in the nozzle/well modal.

        Well-selector headings use labware *def* metadata.displayName (not deck nicknames),
        so match the heading prefix only.

        Changing nozzles clears well fields. For 1-well labware the UI still *renders* A1 as
        selected (computedSelectedWells), so the first click toggles that fake selection off;
        a second click is required to write A1 into the form field.
        """
        modal = self._modal_area()
        if location == "Source":
            aspirate_heading = "Select wells to aspirate liquid from"
            self.wait_for_visible(modal.get_by_text(aspirate_heading, exact=False).first)
        elif location == "Destination":
            dispense_heading = "Select wells to dispense liquid into"
            self.wait_for_visible(
                modal.get_by_text(dispense_heading, exact=False).first,
                timeout=10000,
            )

        well_list = [wells] if isinstance(wells, str) else wells
        action_button = modal.get_by_role("button", name="Save" if finalStep else "Continue")
        modal_shell = self.page.locator("#main-page-modal-portal-root").get_by_label("ModalShell_ModalArea")

        def _click_wells() -> None:
            for well in well_list:
                self._click_well_in_modal(modal, well)

        def _advance_succeeded() -> bool:
            # Disabled Save/Continue means wells are not written yet — do not wait
            # the full action timeout on a disabled control.
            if not action_button.is_enabled():
                return False
            action_button.click()
            if finalStep:
                try:
                    modal_shell.wait_for(state="hidden", timeout=2000)
                    return True
                except Exception:
                    return False
            # Source Continue: success when aspirate heading is gone.
            heading = modal.get_by_text("Select wells to aspirate liquid from", exact=False)
            try:
                heading.first.wait_for(state="hidden", timeout=2000)
                return True
            except Exception:
                return False

        # Click wells first. Up to 2 rounds: 1-well labware may render a fake A1
        # selection that the first click clears; the second writes the field.
        # Do not click Save/Continue before selecting — a disabled button stalls.
        for _ in range(2):
            _click_wells()
            if _advance_succeeded():
                return

        raise AssertionError(f"Could not complete well selection for {location} wells={well_list!r}")

    def destination_labware_select(self, labware: str) -> None:
        """Select destination labware in transfer step."""
        self._select_labware_dropdown_option("dispense_labware_dropdownMenu", labware)

    def _labware_option_matches(self, option_text: str, labware: str) -> bool:
        """Return True when a dropdown row matches the requested labware nickname."""
        normalized_option = " ".join(option_text.split())
        normalized_labware = " ".join(labware.split())
        if normalized_option == normalized_labware:
            return True

        slot_match = re.match(r"^([A-D]\d+)\s+(.+)$", normalized_labware)
        if slot_match is not None:
            return normalized_option == normalized_labware

        # Options may prefix display names with one or more deck slots (e.g. "A1+B1 …").
        option_without_slot = re.sub(
            r"^(?:[A-D]\d+(?:\+[A-D]\d+)*) +",
            "",
            normalized_option,
        )
        if option_without_slot == normalized_labware:
            return True

        option_slot_match = re.match(r"^([A-D]\d+)\s+(.+)$", normalized_option)
        if option_slot_match is not None:
            return option_slot_match.group(2) == normalized_labware

        return False

    def _select_labware_dropdown_option(self, dropdown_test_id: str, labware: str) -> None:
        """Select a labware nickname from a transfer-step labware dropdown."""
        dropdown = self.page.get_by_test_id(dropdown_test_id)
        self.wait_for_visible(dropdown)
        dropdown.click()

        listbox = self.page.locator("div[role='listbox']").last
        self.wait_for_visible(listbox)
        buttons = listbox.locator("button")
        matching_indices = [
            index
            for index in range(buttons.count())
            if self._labware_option_matches(buttons.nth(index).inner_text(), labware)
        ]

        if not matching_indices:
            available = buttons.all_inner_texts()
            raise AssertionError(f"Labware option '{labware}' not found. Available options: {available}")

        buttons.nth(matching_indices[0]).click()

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

    def complete_liquid_class_step(self, liquid_class: str = "Aqueous") -> None:
        """Select a liquid class and continue to advanced settings."""
        self.part_2_transfer_form_liquid_class(liquid_class)
        self.transfer_continue_to_next_step()

    def complete_advanced_settings_step(self) -> None:
        """Continue through advanced settings with defaults."""
        self.transfer_continue_to_next_step()

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
        self.page.get_by_test_id("tip-position-modal-x-custom-input").fill(str(xyz[0]))
        self.page.get_by_test_id("tip-position-modal-x-custom-input").fill(str(xyz[1]))
        self.page.get_by_test_id("tip-position-modal-x-custom-input").fill(str(xyz[2]))

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
    TipTrackingMode = Literal["Automatic tip tracking (recommended)", "Manual tip tracking"]

    def select_tip_tracking(self, mode: TipTrackingMode) -> None:
        """Select automatic or manual tip tracking on the tip settings step."""
        self.page.locator(f'label:has-text("{mode}")').click()

    def select_manual_tips(self, tips: List[str]) -> None:
        """Open the manual tip tracking wizard and select tip positions."""
        self.page.get_by_text("No tips selected").click()
        modal = self._modal_area()
        self.wait_for_visible(modal.get_by_text("Select tips for manual tip tracking"))
        tip_map = modal.get_by_text("Click to select tips in", exact=False)
        continue_button = modal.get_by_role("button", name="Continue")
        # Tiprack step: Continue advances only when a tiprack is selected (auto-select
        # during render or preselected from the prior transfer). Skip if tip map already open.
        if tip_map.count() == 0 and continue_button.count() > 0 and continue_button.is_visible():
            continue_button.click()
        self.wait_for_visible(tip_map, timeout=10000)
        for tip in tips:
            # One primary per pickup group (e.g. A4 for 3/8 partial → A4–C4).
            self._click_well_in_modal(modal, tip)
            if modal.get_by_text("All tips selected").count() > 0:
                break
        expect(modal.get_by_text("All tips selected")).to_be_visible(timeout=10000)
        modal.get_by_role("button", name="Select tips").click()
        expect(modal.get_by_text("Select tips for manual tip tracking")).to_be_hidden(timeout=10000)
        self.wait_for_visible(
            self.page.get_by_text(re.compile(r"\d+ pickups? selected")),
            timeout=10000,
        )

    def save_transfer_with_tip_settings(
        self,
        change_tip: str,
        drop_location: str = "Tip rack",
        tip_tracking: TipTrackingMode = "Automatic tip tracking (recommended)",
        manual_tips: Optional[List[str]] = None,
    ) -> None:
        """Configure tip settings and save the transfer step."""
        self.tip_change_strategy(change_tip, drop_location=drop_location)
        if change_tip != "Never":
            self.select_tip_tracking(tip_tracking)
            if tip_tracking == "Manual tip tracking" and manual_tips is not None:
                self.select_manual_tips(manual_tips)
        self.save_transfer_step()

    def tip_change_strategy(self, tipstrat: str, drop_location: str) -> None:
        """Sets tip change strategy to Once and drop location to Tip rack.
        args:
            tipstrat: Tip change strategy like "Once", "Always", "Never", etc.
            drop_location: Drop location like "Tip rack", "Trash", etc.
        """
        self.page.get_by_test_id("changeTip_dropdownMenu").click()
        self.page.get_by_role("listbox").get_by_text(tipstrat, exact=True).click()
        self.page.get_by_test_id("dropTip_location_dropdownMenu").click()
        self.page.get_by_role("listbox").get_by_text(drop_location, exact=True).click()

    def save_transfer_step(self) -> None:
        """Click save transfer step button in transfer step."""
        self.dismiss_release_notes_toast()
        self.page.get_by_role("button", name="Save", exact=True).last.click()


@dataclass
class TransferStepConfig:
    """Configuration for a single transfer step in the wizard."""

    tip_rack: str
    source_labware: str
    dest_labware: str
    source_wells: Union[str, List[str]]
    dest_wells: Union[str, List[str]]
    path: str
    volume: str
    change_tip: str
    pipette: Optional[str] = None
    drop_location: str = "Tip rack"
    tip_tracking: TransferPage.TipTrackingMode = "Automatic tip tracking (recommended)"
    manual_tips: Optional[List[str]] = None
    nozzle_config: TransferPage.NozzleConfig = "All nozzles (recommended)"
    partial_count: Optional[int] = None
    primary_nozzle: Optional[str] = None


def add_transfer_step(
    editor: ProtocolEditorPage,
    transfer: TransferPage,
    config: TransferStepConfig,
) -> None:
    """Add and save a transfer step through the four-step wizard."""
    editor.add_step("Transfer")
    transfer.wait_for_visible(transfer.page.get_by_test_id("aspirate_labware_dropdownMenu"))
    if config.pipette is not None:
        transfer.pipette_select(config.pipette)
    transfer.tip_rack_select(config.tip_rack)
    transfer.source_labware_select(config.source_labware)
    transfer.destination_labware_select(config.dest_labware)
    transfer.configure_nozzle_and_wells(
        nozzle_config=config.nozzle_config,
        partial_count=config.partial_count,
        primary_nozzle=config.primary_nozzle,
        source_labware=config.source_labware,
        source_wells=config.source_wells,
        dest_labware=config.dest_labware,
        dest_wells=config.dest_wells,
    )
    transfer.pipette_path_select(config.path)
    transfer.input_volume(config.volume)
    transfer.transfer_continue_to_next_step()
    transfer.complete_liquid_class_step()
    transfer.complete_advanced_settings_step()
    transfer.save_transfer_with_tip_settings(
        change_tip=config.change_tip,
        drop_location=config.drop_location,
        tip_tracking=config.tip_tracking,
        manual_tips=config.manual_tips,
    )
