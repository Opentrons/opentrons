"""Page object for interacting with the Mix step form."""

from __future__ import annotations

from typing import Iterable, Literal, Optional, Sequence

from playwright.sync_api import Locator, Page

from automation.base_page import BasePage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage


class MixStepForm(BasePage):
    """Encapsulates interactions with the Mix step form."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def expect_part_header(self, text: str | Sequence[str]) -> None:
        """Ensure the part header (e.g., ``Part 1 / 4``) is visible."""

        options = (text,) if isinstance(text, str) else text
        for value in options:
            locator = self.page.get_by_text(value).first
            try:
                self.wait_for_visible(locator, timeout=10000)
                return
            except AssertionError:
                continue
        available_headers = self.page.get_by_text("Part", exact=False).all_text_contents()
        raise AssertionError(
            f"None of the expected headers were visible: {options}. Found headers: {available_headers}"
        )

    def expect_text(self, text: str) -> None:
        """Expect arbitrary visible text within the form."""

        self.wait_for_visible(self.page.get_by_text(text).first)

    def expect_tip_handling_options(self, options: Sequence[str]) -> None:
        """Verify the tip handling dropdown exposes the expected options.

        Leaves the listbox open so ``select_tip_handling_option`` can reuse it
        (Escape does not reliably dismiss this dropdown).
        """

        dropdown = self._change_tip_dropdown()
        self.wait_for_visible(dropdown)
        listbox = self.page.get_by_role("listbox")
        if listbox.count() == 0 or not listbox.first.is_visible():
            dropdown.click()
            self.wait_for_visible(listbox)

        available = [" ".join(text.split()) for text in listbox.get_by_role("button").all_inner_texts()]
        missing = [option for option in options if option not in available]
        if missing:
            raise AssertionError(f"Missing tip handling options: {missing}. Available options: {available}")

    def select_labware(self, option_text: str) -> None:
        """Select the labware entry shown in the dropdown."""

        print(f"Selecting labware option: {option_text}")
        # Try field-specific test ID first (labware_dropdownMenu), then fallback to generic
        dropdown = self.page.get_by_test_id("labware_dropdownMenu").first
        if dropdown.count() == 0:
            dropdown = self.page.get_by_test_id("dropdownMenu").first
        self.wait_for_visible(dropdown, timeout=10000)
        dropdown.click()
        listbox = self.page.locator("div[role='listbox']").last
        self.wait_for_visible(listbox)
        buttons = listbox.locator("button")
        for index in range(buttons.count()):
            button = buttons.nth(index)
            normalized = " ".join(button.inner_text().split())
            if option_text in normalized:
                button.click()
                return

        available = buttons.all_inner_texts()
        raise AssertionError(f"Labware option '{option_text}' not found. Available options: {available}")

    def select_pipette(self, option_text: str | None = None) -> None:
        """Select a pipette. Defaults to the first option if none provided."""
        print(f"Selecting pipette option: {option_text}")
        self._select_dropdown_option("Pipette", option_text)

    def select_tiprack(self, option_text: str | None = None) -> None:
        """Select a tip rack. Defaults to the first option if none provided."""
        print(f"Selecting tiprack option: {option_text}")
        self._select_dropdown_option("Tiprack", option_text)

    NozzleConfig = Literal[
        "All nozzles (recommended)",
        "Single nozzle",
        "Single column of nozzles",
        "Single row of nozzles",
        "Partial nozzles",
    ]

    def open_nozzle_and_well_selector(self) -> None:
        """Open the well selector modal."""

        self.page.get_by_test_id("nozzle_and_well_modal").click()

    def select_primary_nozzle(self, nozzle: str) -> None:
        """Click a primary nozzle in the nozzle selection modal."""
        modal = self._modal_area()
        modal.locator(f'[data-wellname="{nozzle}"]').click()

    def select_partial_nozzle_count(self, count: int) -> None:
        """Select partial nozzle count from the dropdown (e.g. 4 for 4/8 nozzles)."""
        modal = self._modal_area()
        dropdown = modal.get_by_test_id("dropdownMenu")
        self.wait_for_visible(dropdown)
        dropdown.click()
        modal.get_by_role("listbox").get_by_text(f"{count} nozzles", exact=True).click()

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

    def select_nozzles(self) -> None:
        """Select all nozzles and continue to well selection."""
        self.select_nozzle_configuration("All nozzles (recommended)")

    def expect_well_modal(self) -> None:
        modal = self._modal_area()
        self.wait_for_visible(
            modal.get_by_text(
                "Select wells to mix liquid in Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt", exact=False
            ).first
        )
        self.wait_for_visible(modal.get_by_role("button", name="Save"))

    def expect_mix_well_modal(self, labware_name: str) -> None:
        """Wait for the mix well-selection modal for a given labware display name."""
        modal = self._modal_area()
        self.wait_for_visible(modal.get_by_text(labware_name, exact=False).first)
        self.wait_for_visible(modal.get_by_role("button", name="Save"))

    def select_wells(self, wells: Iterable[str]) -> None:
        """Select each well in the provided iterable."""

        for well in wells:
            self.page.locator(f"#{well}").click()
        modal = self._modal_area()
        modal.get_by_role("button", name="Save").click()

    def save_modal(self) -> None:
        """Click the Save button within the currently open modal."""

        modal = self._modal_area()
        modal.get_by_role("button", name="Save").click()

    def enter_volume(self, volume: str) -> None:
        """Fill the volume-per-well input."""

        self._fill_input_and_blur('input[name="volume"]', volume)

    def enter_mix_repetitions(self, repetitions: str) -> None:
        """Fill the mix repetitions input."""

        self._fill_input_and_blur('input[name="times"]', repetitions)

    def click_continue(self) -> None:
        """Advance to the next section."""

        button = self.page.get_by_role("button", name="Continue").first
        self.wait_for_visible(button)
        try:
            button.click()
        except Exception:
            # Fallback when overlays intercept pointer events; triggering Enter emulates user action
            button.press("Enter")

    def click_aspirate_tab(self) -> None:
        """Switch to the Aspirate tab."""

        self.page.get_by_role("button", name="Aspirate").click()

    def click_dispense_tab(self) -> None:
        """Switch to the Dispense tab."""

        self.page.get_by_role("button", name="Dispense").click()

    def set_flow_rate(self, field_name: str, value: str) -> None:
        """Update a flow rate field."""

        self._fill_input_and_blur(f'input[name="{field_name}"]', value)

    def open_aspirate_well_order(self) -> None:
        """Open the aspirate well-order popover."""

        self.page.get_by_test_id("WellsOrderField_ListButton_aspirate").click()

    def reset_settings(self) -> None:
        """Click the "Reset to default" button when present."""

        modal = self.page.get_by_label("ModalShell_ModalArea")
        if modal.count() > 0 and modal.first.is_visible():
            modal.first.get_by_role("button", name="Reset to default").click()
            return

        self.page.get_by_role("button", name="Reset to default").click()

    def close_popover(self, button_name: str = "Back to overview") -> None:
        """Close the currently open popover via the provided button."""

        self.page.get_by_role("button", name=button_name).click()

    def open_mix_tip_modal(self) -> None:
        """Open the mix tip position modal."""

        self.page.get_by_test_id("PositionField_ListButton_mix").click()

    def set_mix_tip_position(self, x: str, y: str, z: str) -> None:
        """Configure mix tip X/Y/Z positions."""

        modal = self._modal_area()
        modal.locator('[data-testid="tip-position-modal-x-custom-input"]').fill(x)
        modal.locator('[data-testid="tip-position-modal-y-custom-input"]').fill(y)
        modal.locator('[data-testid="tip-position-modal-z-custom-input"]').fill(z)

    def toggle_checkbox(self, index: int = 0) -> None:
        """Toggle a checkbox-like control by index among visible controls."""

        # Try switch first (ToggleButton components)
        switch = self.page.get_by_role("switch").nth(index)
        if switch.count() > 0:
            self.wait_for_visible(switch)
            switch.click()
            return

        # Try checkbox role (Checkbox component from @opentrons/components)
        checkbox = self.page.get_by_role("checkbox").nth(index)
        if checkbox.count() > 0:
            try:
                self.wait_for_visible(checkbox)
                checkbox.click()
                return
            except Exception:
                # New Checkbox implementation may expose a hidden input;
                # continue to label/test-id based fallbacks.
                pass

        # CheckboxExpandStepFormField renders ListButton rows with visible titles.
        checkbox_titles = ["Delay", "Push out", "Blowout", "Touch tip", "Air gap", "Mix"]
        visible_rows: list[Locator] = []
        for title in checkbox_titles:
            row = self.page.locator('[data-testid="ListButton_noActive"]').filter(has_text=title).first
            if row.count() > 0 and row.is_visible():
                visible_rows.append(row)
        if len(visible_rows) > index:
            checkbox_row = visible_rows[index]
            self.wait_for_visible(checkbox_row)
            checkbox_row.click()
            return

        # Last resort: try to find input[type="checkbox"] (CheckboxField component)
        checkbox_input = self.page.locator('input[type="checkbox"]').nth(index)
        if checkbox_input.count() > 0:
            self.wait_for_visible(checkbox_input)
            checkbox_input.click()
            return

        checkbox_test_id_count = self.page.locator("[data-testid*='checkbox']").count()
        raise AssertionError(
            f"Could not find checkbox or switch at index {index}. "
            f"Found {self.page.get_by_role('switch').count()} switches, "
            f"{self.page.get_by_role('checkbox').count()} checkboxes, "
            f"{checkbox_test_id_count} checkbox test IDs."
        )

    def fill_delay_seconds(self, value: str) -> None:
        """Fill whichever delay seconds input is present."""

        delay_input = self._first_existing_locator(
            [
                'input[name="aspirate_delay_seconds"]',
                'input[name="dispense_delay_seconds"]',
                'input[name$="_delay_seconds"]',
            ]
        )
        delay_input.fill(value)

    def set_push_out_volume(self, value: str) -> None:
        """Fill the push-out volume input."""

        self._fill_input_and_blur('input[name="pushOut_volume"]', value)

    def open_blowout_location_dropdown(self) -> None:
        """Open the blowout location dropdown menu."""
        # Prefer the rendered dropdown if the blowout row is already expanded.
        dropdown_locator = self.page.locator('[data-testid="blowout_location_dropdownMenu"]')

        try:
            dropdown_locator.wait_for(state="attached", timeout=15000)
            dropdown = dropdown_locator.first
            self.wait_for_visible(dropdown, timeout=10000)
            dropdown.click()
            return
        except Exception:
            # If the dropdown isn't rendered yet, explicitly expand the Blowout row.
            blowout_row = self.page.locator('[data-testid="ListButton_noActive"]').filter(has_text="Blowout").first
            if blowout_row.count() > 0 and blowout_row.is_visible():
                self.wait_for_visible(blowout_row)
                blowout_row.click()
                self.page.wait_for_timeout(300)
                try:
                    dropdown_locator.wait_for(state="attached", timeout=5000)
                    dropdown = dropdown_locator.first
                    self.wait_for_visible(dropdown, timeout=5000)
                    dropdown.click()
                    return
                except Exception:
                    pass

        # Fallback: Try using the dropdown_by_title helper which finds dropdowns by their label text
        try:
            dropdown = self._dropdown_by_title("Blowout location")
            self.wait_for_visible(dropdown, timeout=10000)
            dropdown.click()
            return
        except (ValueError, AssertionError):
            pass

        # Last resort: try any dropdown ending with _dropdownMenu, but wait for it
        dropdown = self.page.locator('[data-testid$="_dropdownMenu"]').last
        try:
            dropdown.wait_for(state="attached", timeout=10000)
            self.wait_for_visible(dropdown, timeout=10000)
            dropdown.click()
            return
        except Exception:
            pass

        # Provide helpful error message with available dropdown test IDs
        try:
            available_test_ids = self.page.locator('[data-testid*="dropdown"]').evaluate_all(
                "elements => elements.map(el => el.getAttribute('data-testid'))"
            )
        except Exception:
            available_test_ids = []

        raise AssertionError(
            f"Could not find blowout location dropdown. "
            f"Available dropdown test IDs: {available_test_ids}. "
            f"Make sure the blowout checkbox is checked first (call toggle_checkbox() before this method)."
        )

    def open_blowout_position_modal(self) -> None:
        """Open the blowout position modal."""

        self.page.locator("[data-testid='tip-position-field-blowout_z_offset']").click()

    def set_blowout_position(self, value: str) -> None:
        """Adjust the blowout Z offset inside the modal."""

        modal = self._modal_area()
        modal.locator('[data-testid="tip-position-modal-custom-input"]').fill(value)

    def rename_step(self, name: str, notes: str) -> None:
        """Rename the Mix step and set notes."""

        self.page.get_by_role("button", name="Rename").click()
        modal = self._modal_area()
        modal.locator('input[name="stepName_input"]').fill(name)
        modal.get_by_role("textbox", name="Step Notes").fill(notes)
        modal.get_by_role("button", name="Save").click()

    def save_step(self) -> None:
        """Click the primary Save button on the Mix step form."""

        self.page.get_by_role("button", name="Save").first.click()

    def select_tip_handling_option(self, option: str) -> None:
        """Choose a tip handling option such as ``Once`` or ``Always``."""

        listbox = self.page.get_by_role("listbox")
        if listbox.count() == 0 or not listbox.first.is_visible():
            dropdown = self._change_tip_dropdown()
            self.wait_for_visible(dropdown)
            dropdown.click()
            self.wait_for_visible(listbox)
        listbox.get_by_text(option, exact=True).click()

    def _change_tip_dropdown(self) -> Locator:
        """Return the Mix/Transfer tip-handling (changeTip) dropdown control."""

        dropdown = self.page.get_by_test_id("changeTip_dropdownMenu")
        if dropdown.count() > 0:
            return dropdown.first
        return self._dropdown_by_title("Tip handling")

    def _fill_input_and_blur(self, selector: str, value: str) -> None:
        locator = self.page.locator(selector).first
        self.wait_for_visible(locator)
        locator.fill(value)
        locator.press("Tab")

    def _select_dropdown_option(self, title: str, option_text: str | None) -> None:
        if self._static_field_matches(title, option_text):
            return

        dropdown = self._dropdown_by_title(title)
        if dropdown.count() == 0:
            return

        self.wait_for_visible(dropdown)
        dropdown.click()

        listbox = self.page.locator("div[role='listbox']").last
        self.wait_for_visible(listbox)
        buttons = listbox.locator("button")
        if option_text is None:
            buttons.first.click()
            return

        for index in range(buttons.count()):
            button = buttons.nth(index)
            normalized = " ".join(button.inner_text().split())
            if option_text in normalized:
                button.click()
                return

        available = buttons.all_inner_texts()
        raise AssertionError(f"Dropdown option '{option_text}' not found. Available options: {available}")

    def _first_existing_locator(self, selectors: Iterable[str]) -> Locator:
        for selector in selectors:
            locator = self.page.locator(selector).first
            if locator.count() > 0:
                return locator
        raise ValueError("No matching locator found for provided selectors")

    def _modal_area(self) -> Locator:
        return self.page.get_by_label("ModalShell_ModalArea")

    def _dropdown_by_title(self, title: str) -> Locator:
        label = self.page.get_by_text(title, exact=True)
        candidates: list[Locator] = []
        if label.count() == 0:
            label = self.page.get_by_text(title, exact=False)

        if label.count() > 0:
            first_label = label.first
            # Use contains() to match both 'dropdownMenu' and 'xxx_dropdownMenu' test IDs
            candidates.extend(
                [
                    first_label.locator("xpath=../following-sibling::*[contains(@data-testid, 'dropdownMenu')]"),
                    first_label.locator("xpath=../../following-sibling::*[contains(@data-testid, 'dropdownMenu')]"),
                    first_label.locator(
                        "xpath=ancestor::*[@data-testid][1]//div[contains(@data-testid, 'dropdownMenu')]"
                    ),
                ]
            )

        normalized = " ".join(title.split())
        xpath_queries = [
            f"xpath=//*[normalize-space()='{normalized}']/parent::*/"
            f"following-sibling::*[contains(@data-testid, 'dropdownMenu')][1]",
            f"xpath=//*[normalize-space()='{normalized}']/ancestor::*[@data-testid][1]//"
            f"div[contains(@data-testid, 'dropdownMenu')][1]",
            f"xpath=//*[normalize-space()='{normalized}']/following::div[contains(@data-testid, 'dropdownMenu')][1]",
        ]
        if title == "Tip handling":
            xpath_queries.append(
                "xpath=//*[normalize-space()='Tip handling']/parent::*/"
                "following-sibling::*[contains(@data-testid, 'dropdownMenu')][1]"
            )

        for query in xpath_queries:
            candidates.append(self.page.locator(query))

        for candidate in candidates:
            if candidate.count() > 0:
                return candidate.first

        raise ValueError(f"Dropdown titled '{title}' was not found")

    def _static_field_matches(self, title: str, option_text: str | None) -> bool:
        label = self.page.get_by_text(title, exact=True)
        if label.count() == 0:
            label = self.page.get_by_text(title, exact=False)
        if label.count() == 0:
            return False

        list_item = label.first.locator("xpath=../*[@data-testid='ListItem_default']")
        if list_item.count() == 0:
            list_item = label.first.locator("xpath=../../*[@data-testid='ListItem_default']")
        if list_item.count() == 0:
            return False

        if option_text is None:
            return True

        texts = [" ".join(text.split()) for text in list_item.locator("p").all_inner_texts()]
        return any(option_text in text for text in texts)


def add_mix_step(
    editor: ProtocolEditorPage,
    mix_form: MixStepForm,
    *,
    pipette: str,
    tip_rack: str,
    labware: str,
    wells: Sequence[str],
    volume: str,
    repetitions: str,
    nozzle_config: MixStepForm.NozzleConfig = "All nozzles (recommended)",
    partial_count: Optional[int] = None,
    primary_nozzle: Optional[str] = None,
) -> None:
    """Add and save a basic mix step through the four-part wizard."""
    editor.add_step("Mix")
    mix_form.select_pipette(pipette)
    mix_form.select_tiprack(tip_rack)
    mix_form.select_labware(labware)
    mix_form.open_nozzle_and_well_selector()
    mix_form.select_nozzle_configuration(
        nozzle_config,
        partial_count=partial_count,
        primary_nozzle=primary_nozzle,
    )
    mix_form.expect_mix_well_modal(labware)
    mix_form.select_wells(wells)
    mix_form.enter_volume(volume)
    mix_form.enter_mix_repetitions(repetitions)
    mix_form.click_continue()
    mix_form.click_continue()
    mix_form.click_continue()
    mix_form.save_step()
