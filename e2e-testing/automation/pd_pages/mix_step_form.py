"""Page object for interacting with the Mix step form."""

from __future__ import annotations

from typing import Iterable, Sequence

from playwright.sync_api import Locator, Page

from .base_page import BasePage


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
        """Verify the tip handling dropdown exposes the expected options."""

        dropdown = self._dropdown_by_title("Tip handling")
        self.wait_for_visible(dropdown)
        dropdown.click()

        listbox = self.page.locator("div[role='listbox']").last
        self.wait_for_visible(listbox)
        available = [" ".join(text.split()) for text in listbox.locator("button").all_inner_texts()]
        missing = [option for option in options if option not in available]
        self.page.keyboard.press("Escape")
        if missing:
            raise AssertionError(f"Missing tip handling options: {missing}. Available options: {available}")

    def select_labware(self, option_text: str) -> None:
        """Select the labware entry shown in the dropdown."""

        dropdown = self.page.get_by_test_id("dropdownMenu").first
        self.wait_for_visible(dropdown)
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

        self._select_dropdown_option("Pipette", option_text)

    def select_tiprack(self, option_text: str | None = None) -> None:
        """Select a tip rack. Defaults to the first option if none provided."""

        self._select_dropdown_option("Tiprack", option_text)

    def open_well_selector(self) -> None:
        """Open the well selector modal."""

        self.page.locator('[name="wells"]').first.click()

    def expect_well_selector_modal(self) -> None:
        """Verify the well selector modal content is present."""

        modal = self._modal_area()
        self.wait_for_visible(modal.get_by_text("Select wells", exact=False).first)
        self.wait_for_visible(modal.get_by_role("button", name="Save"))

    def select_wells(self, wells: Iterable[str]) -> None:
        """Select each well in the provided iterable."""

        for well in wells:
            self.page.locator(f'circle[data-wellname="{well}"]').click()

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
        modal.locator('[data-testid="TipPositionModal_x_custom_input"]').fill(x)
        modal.locator("#TipPositionModal_y_custom_input").fill(y)
        modal.locator("#TipPositionModal_z_custom_input").fill(z)

    def toggle_checkbox(self, index: int = 0) -> None:
        """Toggle a checkbox-like control by index among visible controls."""

        switch = self.page.get_by_role("switch").nth(index)
        if switch.count() > 0:
            switch.click()
            return

        checkbox = self.page.get_by_role("checkbox").nth(index)
        if checkbox.count() > 0:
            checkbox.click()
            return

        checkbox = self.page.locator('[class*="Checkbox___StyledFlex3"]').nth(index)
        checkbox.click()

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

        self.page.locator('[data-testid="dropdownMenu"]').last.click()

    def open_blowout_position_modal(self) -> None:
        """Open the blowout position modal."""

        self.page.locator("#TipPositionField_blowout_z_offset").click()

    def set_blowout_position(self, value: str) -> None:
        """Adjust the blowout Z offset inside the modal."""

        modal = self._modal_area()
        modal.locator('[data-testid="TipPositionModal_custom_input"]').fill(value)

    def rename_step(self, name: str, notes: str) -> None:
        """Rename the Mix step and set notes."""

        self.page.get_by_role("button", name="Rename").click()
        modal = self._modal_area()
        modal.locator('input[name="stepName_input"]').fill(name)
        modal.locator('[data-testid="TextAreaField"]').fill(notes)
        modal.get_by_role("button", name="Save").click()

    def save_step(self) -> None:
        """Click the primary Save button on the Mix step form."""

        self.page.get_by_role("button", name="Save").first.click()

    def select_tip_handling_option(self, option: str) -> None:
        """Choose a tip handling option such as ``Once`` or ``Always``."""

        option_button = self.page.get_by_role("button", name=option)
        if option_button.count() == 0:
            option_button = self.page.get_by_text(option)
        option_button.first.click()

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
            candidates.extend(
                [
                    first_label.locator("xpath=../following-sibling::*[@data-testid='dropdownMenu']"),
                    first_label.locator("xpath=../../following-sibling::*[@data-testid='dropdownMenu']"),
                    first_label.locator("xpath=ancestor::*[@data-testid][1]//div[@data-testid='dropdownMenu']"),
                ]
            )

        normalized = " ".join(title.split())
        xpath_queries = [
            "xpath=//*[normalize-space()='%s']/parent::*/following-sibling::*[@data-testid='dropdownMenu'][1]"
            % normalized,
            "xpath=//*[normalize-space()='%s']/ancestor::*[@data-testid][1]//div[@data-testid='dropdownMenu'][1]"
            % normalized,
            "xpath=//*[normalize-space()='%s']/following::div[@data-testid='dropdownMenu'][1]" % normalized,
        ]
        if title == "Tip handling":
            xpath_queries.append(
                "xpath=//*[normalize-space()='Tip handling']/parent::*/"
                "following-sibling::*[@data-testid='dropdownMenu'][1]"
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
