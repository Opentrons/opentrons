"""Protocol editor page object."""

import re
from pathlib import Path
from typing import Sequence

from playwright.sync_api import Page, TimeoutError, expect

from automation.base_page import BasePage


class ProtocolEditorPage(BasePage):
    """Main protocol editor page for adding labware and steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def add_labware_to_slot(self, slot: str) -> None:
        """Add labware to a specific slot.

        Args:
            slot: Slot identifier like "D2"
        """

        slot_region = self.page.get_by_test_id(slot)
        if slot_region.count() == 0:
            test_ids = self.page.locator("[data-testid]").evaluate_all(
                "elements => elements.map(el => el.getAttribute('data-testid'))"
            )
            related_ids = self.page.locator("[data-testid*='" + slot + "']").evaluate_all(
                "elements => elements.map(el => el.getAttribute('data-testid'))"
            )
            raise AssertionError(f"Slot '{slot}' not found. Available test ids: {test_ids}. Related ids: {related_ids}")
        add_button = slot_region.get_by_role("button", name="Add labware", exact=False)
        if add_button.count() == 0:
            add_button = slot_region.get_by_role("button", name="Edit labware", exact=False)
            if add_button.count() == 0:
                text_trigger = slot_region.get_by_text("Add labware", exact=False)
                if text_trigger.count() > 0:
                    self.wait_for_visible(text_trigger)
                    text_trigger.click()
                else:
                    self.wait_for_visible(slot_region)
                    slot_region.click()
            else:
                self.wait_for_visible(add_button)
                add_button.click()
                edit_labware_option = self.page.get_by_text("Edit labware", exact=True).last
                self.wait_for_visible(edit_labware_option)
                edit_labware_option.click()

        else:
            self.wait_for_visible(add_button)
            add_button.click()

        self._ensure_labware_tab_active()
        self._open_select_labware_modal()

    def open_slot_tools(self, slot: str) -> None:
        """Open the overflow tools menu for a deck slot."""

        slot_region = self.page.get_by_test_id(slot)
        trigger_anchor = slot_region.locator("a[role='button']").first
        if trigger_anchor.count() > 0:
            trigger_anchor.click()
        trigger = slot_region.locator("[data-testid='SlotOverflowMenu_openTools']").first
        if trigger.count() == 0:
            trigger = self.page.get_by_test_id("SlotOverflowMenu_openTools").first
        self.wait_for_visible(trigger)
        trigger.click()

    def _ensure_labware_tab_active(self) -> None:
        """Ensure the labware tab in the toolbox is active."""

        labware_tab = self.page.get_by_role("button", name="Labware", exact=False)
        if labware_tab.count() == 0:
            return
        self.wait_for_visible(labware_tab.first)
        labware_tab.first.click()

    def _open_select_labware_modal(self) -> None:
        """Open the labware selection modal if the trigger is available."""

        selector_button = self.page.locator("[data-testid='EmptySelectorButton_click']").first
        search_input = self.page.locator("input[placeholder='Search labware']").first
        modal = self.page.get_by_role("dialog", name="Add labware", exact=False)
        if modal.count() > 0 and modal.is_visible():
            return
        if search_input.count() > 0 and search_input.is_visible():
            return
        if selector_button.count() > 0:
            self.wait_for_visible(selector_button)
            selector_button.click(force=True)

        if search_input.count() > 0:
            search_input.wait_for(state="visible", timeout=5000)

    def select_labware_category(self, category_index: int = 2) -> None:
        """Select a labware category from the list.

        Args:
            category_index: Index of the category button (default: 2)
        """
        self.page.get_by_test_id("ListButton_noActive").nth(category_index).click()

    def select_labware_category_by_name(self, category_name: str) -> None:
        """Select a labware category by its visible label."""
        self._open_select_labware_modal()

        search_input = self.page.locator("input[placeholder='Search labware']").first
        if search_input.count() > 0 and search_input.is_visible():
            search_input.fill("")

        modal = self.page.get_by_label("ModalShell_ModalArea")
        category = modal.locator("[data-testid^='ListButton_']").filter(has_text=category_name).first
        if category.count() == 0:
            category = modal.get_by_text(category_name, exact=False)
        if category.count() == 0:
            category_index_by_name = {
                "Tip racks": 0,
                "Tube racks": 1,
                "Well plates": 2,
                "Reservoirs": 3,
                "Aluminum blocks": 4,
                "Adapters": 5,
                "Lids": 6,
            }
            category_index = category_index_by_name.get(category_name)
            if category_index is not None:
                category = self.page.get_by_test_id("ListButton_noActive").nth(category_index)
        self.wait_for_visible(category.first)
        category.first.click()

    def select_labware_by_name(
        self, labware_name: str, stacker: bool = False, fill_num: int = 6, lid: bool = False
    ) -> None:
        """Select a specific labware by its name.

        Args:
            labware_name: Name of the labware to select
            stacker: Whether to add a stacker and fill number
            fill_num: Number of labware to fill if using stacker
            lid: Whether to add a lid to the labware
        """

        search_input = self.page.locator("input[placeholder='Search labware']").first
        if search_input.count() > 0:
            search_input.fill(labware_name)
        else:
            self._expand_labware_category("Well plates")

        filter_label = self.page.locator("label").filter(has_text="Only display recommended labware").first
        if filter_label.count() > 0:
            checkbox = filter_label.locator("input[type='checkbox']").first
            if checkbox.count() > 0 and checkbox.is_checked():
                filter_label.click()

        pattern = re.compile(re.escape(labware_name), re.IGNORECASE)
        modal = self.page.get_by_label("ModalShell_ModalArea")
        target = modal.locator("label").filter(has_text=pattern).first

        try:
            target.wait_for(state="visible", timeout=1000)
        except TimeoutError:
            fallback_target = modal.get_by_text(pattern, exact=False).first
            try:
                fallback_target.wait_for(state="visible", timeout=1000)
                target = fallback_target
            except TimeoutError as retry_error:
                if search_input.count() > 0 and search_input.is_visible():
                    search_input.fill("")
                category_buttons = self.page.get_by_test_id("ListButton_noActive")
                found = False
                for index in range(category_buttons.count()):
                    category_buttons.nth(index).click()
                    label_target = modal.locator("label").filter(has_text=pattern).first
                    text_target = modal.get_by_text(pattern, exact=False).first
                    try:
                        label_target.wait_for(state="visible", timeout=500)
                        target = label_target
                        found = True
                        break
                    except TimeoutError:
                        try:
                            text_target.wait_for(state="visible", timeout=500)
                            target = text_target
                            found = True
                            break
                        except TimeoutError:
                            continue

                if not found:
                    visible_options = modal.locator("label, [role='label'], button").all_inner_texts()
                    raise AssertionError(
                        f"Labware '{labware_name}' was not found in the selection modal. "
                        f"Available options: {visible_options}"
                    ) from retry_error

        target.click()
        if stacker:
            self.page.get_by_test_id("customize-expand-button-input-field").click()
            self.page.get_by_test_id("customize-expand-button-input-field").fill(str(fill_num))
        if lid:
            self._add_lid("Opentrons Flex 96 Tip Rack 50", "CheckboxField_icon")
        modal.get_by_role("button", name=re.compile(r"^Add labware$", re.IGNORECASE)).click()
        if modal.count() > 0:
            modal.wait_for(state="hidden", timeout=5000)

    def _expand_labware_category(self, category_name: str) -> None:
        """Expand a labware category if it is collapsed."""

        category_button = self.page.get_by_text(category_name, exact=False)
        if category_button.count() == 0:
            return
        category_button.first.click()

    def edit_liquid(self) -> None:
        """Open the liquid editing interface."""
        self.page.get_by_text("Edit liquid").wait_for(state="visible", timeout=10000)
        self.page.get_by_text("Edit liquid").click()

    def select_first_well(self) -> None:
        """Select the first well in the labware."""
        self.page.locator("circle").first.click()

    def select_wells(self, wells: Sequence[str]) -> None:
        """Select each well in the provided sequence."""

        for well in wells:
            locator = self.page.locator(f"circle[data-wellname='{well}']").first
            self.wait_for_visible(locator)
            locator.click()

    def click_add_liquid_button(self) -> None:
        """Open the Add liquid panel for the selected labware."""

        button = self.page.get_by_test_id("LabwareCard_addLiquid_button")
        self.wait_for_visible(button.first)
        button.first.click()

    def open_liquid_tab(self) -> None:
        """Switch to the Liquids tab within the labware panel."""

        tab = self.page.get_by_role("button", name="Liquids", exact=False)
        if tab.count() == 0:
            return
        self.wait_for_visible(tab.first)
        tab.first.click()

    def expect_liquid_panel(self) -> None:
        """Ensure the liquid management panel is displayed."""

        for text in ["Liquid", "Add liquid"]:
            self.wait_for_visible(self.page.get_by_text(text, exact=False).first)

    def define_liquid(self, name: str) -> None:
        """Define a new liquid with a name.

        Args:
            name: Name of the liquid, e.g., "Water"
        """
        self.click_button("Define a liquid")
        self.page.locator('input[name="displayName"]').click()
        self.page.locator('input[name="displayName"]').fill(name)
        self.page.get_by_label("ModalShell_ModalArea").get_by_role("button", name="Save").click()

    def assign_liquid_to_wells(self, liquid_name: str, volume: str) -> None:
        """Assign a liquid to selected wells with a specific volume.

        Args:
            liquid_name: Name of the liquid
            volume: Volume in µL as a string
        """
        self.click_test_id("dropdownMenu")
        self.click_button(liquid_name)
        self.page.get_by_role("textbox").click()
        self.page.get_by_role("textbox").fill(volume)
        self.click_button("Save")

    def confirm_toolbox(self) -> None:
        """Click the shared toolbox confirmation button."""

        button = self.page.get_by_test_id("Toolbox_confirmButton")
        self.wait_for_visible(button.first)
        button.first.click()

    def select_confirm_text(self) -> None:
        """
        Click a button with the text "Confirm".
        This is used in various places where a confirmation action is needed.
        """
        self.page.get_by_text("Confirm").click()

    def select_save_text(self) -> None:
        """
        Click a button with the text "Save".
        This is used in various places where a save action is needed."""
        self.page.get_by_text("Save", exact=True).click()

    def close_toolbox(self) -> None:
        """Close the deck setup toolbox if it is open."""

        close_button = self.page.get_by_test_id("Toolbox_closeButton").first
        if close_button.count() == 0:
            return
        self.wait_for_visible(close_button)
        close_button.click()
        try:
            close_button.wait_for(state="hidden", timeout=5000)
        except Exception:
            pass

    def confirm_liquid_setup(self) -> None:
        """Confirm the liquid setup and close the modal."""
        self.page.get_by_text("Done").click()

    def export_protocol(self, destination: Path, *, timeout: int = 60000) -> Path:
        """Click Export and save the downloaded protocol .py file."""
        destination.parent.mkdir(parents=True, exist_ok=True)
        with self.page.expect_download(timeout=timeout) as download_info:
            self.click_button("Export")
        download_info.value.save_as(str(destination))
        return destination

    def add_step(self, step_type: str = "Transfer") -> None:
        """Add a new protocol step.

        Args:
            step_type: Type of step to add, e.g., "Transfer", "Mix", etc.
        """
        self.open_add_step_menu()
        self.select_step_type(step_type)

    def open_add_step_menu(self) -> None:
        """Open the step selection menu."""

        self.click_button("Add Step")

    def verify_add_step_menu_options(self) -> None:
        """Verify the standard step options are visible."""

        menu_buttons = self.page.locator("button[class*='AddStepOverflowButton__MenuButton']")
        if menu_buttons.count() == 0:
            raise AssertionError("Add step menu is not open or contains no options")
        available = menu_buttons.all_inner_texts()
        guaranteed_options = ["Move", "Transfer", "Mix", "Pause", "Heater-Shaker"]
        for option in guaranteed_options:
            try:
                expect(menu_buttons.filter(has_text=option)).to_be_visible()
            except AssertionError as error:
                raise AssertionError(f"Expected '{option}' in add step menu. Available options: {available}") from error

        module_specific_options = ["Thermocycler", "Temperature"]
        if not any(option in available for option in module_specific_options):
            raise AssertionError(
                f"Expected a thermocycler or temperature step option to be present. Available options: {available}"
            )

    def select_step_type(self, step_type: str) -> None:
        """Select a step type from the open step menu."""

        self.page.get_by_role("button", name=step_type, exact=True).click()

    def expect_move_labware_form(self) -> None:
        """Verify the move labware step form fields are visible."""

        for text in [
            "Use gripper",
            "Select labware",
            "New location",
        ]:
            self.wait_for_visible(self.page.get_by_text(text, exact=False).first)

    def toggle_checkbox(self, field_name: str) -> None:
        """Toggle a checkbox-like control by its field name.

        Args:
            field_name: The name of the checkbox field to toggle.
        """

        self.click_checkbox_label(field_name)

    def _add_lid(self, labware: str, test_id: str) -> None:
        """Add a lid to the selected labware.
        Args:
            labware: Name of the labware to add a lid to.
            test_id: Test ID of the lid checkbox element.
        """
        self.page.locator("label").filter(has_text=labware).get_by_test_id(test_id).click()

    def move_labware(self, labware: str, new_location: str) -> None:
        """Select labware and new location to move the labware."""
        self.page.get_by_test_id("labware_dropdownMenu").first.click()
        self.page.get_by_role("button", name=labware).click()
        self.page.get_by_test_id("newLocation_dropdownMenu").first.click()

        if new_location == "Off-deck":
            self.page.locator("#stepFormTools").get_by_role("button", name="Off-deck").click()
        else:
            # Slot names like "A1" also appear on the deck map — scope to the open listbox.
            listbox = self.page.locator("div[role='listbox']").last
            self.wait_for_visible(listbox)
            option = listbox.get_by_role("button", name=new_location, exact=True)
            if option.count() == 0:
                option = listbox.get_by_role("button", name=re.compile(re.escape(new_location)))
            if option.count() == 0:
                option = listbox.get_by_text(new_location, exact=False)
            if option.count() == 0:
                available = listbox.locator("button").all_inner_texts()
                raise AssertionError(f"Move destination '{new_location}' not found. Available: {available}")
            option.first.click()
        self.page.get_by_role("button", name="Save").click()
        if "Waste Chute" in new_location:
            confirm = self.page.get_by_role("button", name="Confirm")
            if confirm.count() > 0 and confirm.first.is_visible():
                confirm.first.click()
        # Dismiss success toast if present; wait for the move form to close.
        toast = self.page.get_by_text("Move has been saved", exact=False)
        try:
            expect(toast.first).to_be_visible(timeout=10000)
            toast.first.click(timeout=2000)
        except Exception:
            self.page.keyboard.press("Escape")
        expect(self.page.get_by_test_id("labware_dropdownMenu")).to_have_count(0, timeout=15000)

    def drag_and_drop(self, from_index: int, to_num: int) -> None:
        """Drag and drop a step from one position to another in the step list.

        IMPORTANT NOTE ON PARAMETERS:

        Args:
            from_index: ALWAYS the index of the source step
            to_num: num is dependent on the direction you are moving the source step.
                If you are moving DOWN the list, to_num is the STEP NUMBER.
                If you are moving UP the list, to_num is the INDEX.
        """
        steps = self.page.locator('div[draggable="true"]')

        source = steps.nth(from_index)
        target = steps.nth(to_num)

        source.scroll_into_view_if_needed()
        target.scroll_into_view_if_needed()

        source_box = source.bounding_box()
        target_box = target.bounding_box()

        assert source_box is not None
        assert target_box is not None

        start_x = source_box["x"] + source_box["width"] / 2
        start_y = source_box["y"] + source_box["height"] / 2
        end_y = target_box["y"] + target_box["height"] / 2

        mouse = self.page.mouse

        ## Move mouse to source
        mouse.move(start_x, start_y)
        mouse.down()
        self.page.wait_for_timeout(150)
        source.dispatch_event("dragstart")

        ## NOTE: Future work? we can manipulate this move so that if the (end_y - start_y) is positive or negative we can # noqa: E501
        #  adjust the percentage the mouse moves to the target which may fix the issue of step versus index for target number # noqa: E501
        mouse.move(start_x, start_y + (end_y - start_y), steps=20)

        target.dispatch_event("drop")
        source.dispatch_event("dragend")

        mouse.up()
        self.page.wait_for_timeout(150)

    def select_step(self, step_count: int, step_type: str) -> None:
        """click to view step
        NOTE: This function has 1 not 0 based indexing
        Args:
            step_count: ALWAYS the index of the source step
            step_type: The type of step being selected (e.g., "Absorbance Plate Reader").
        """
        steps = self.page.locator('div[draggable="true"]')

        source = steps.nth(step_count)
        source.scroll_into_view_if_needed()

        source_box = source.bounding_box()

        assert source_box is not None

        start_x = source_box["x"] + source_box["width"] / 2
        start_y = source_box["y"] + source_box["height"] / 2
        mouse = self.page.mouse
        ## Ask mouse to double click
        mouse.click(start_x, start_y, click_count=2)
