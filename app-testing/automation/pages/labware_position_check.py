"""Model for the screen of Labware Position Check."""

from typing import Optional

from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from automation.driver.base import Base, Element


class LabwarePositionCheck:
    """Class for Labware Position Check."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    labware_setup_position_check_button: Element = Element(
        (
            By.ID,
            "LabwareSetup_checkLabwarePositionsButton",
        ),
        "",
    )

    introScreen_labware_position_check_overview: Element = Element(
        (
            By.ID,
            "IntroScreen_labware_position_check_overview",
        ),
        "",
    )

    begin_labware_position_text_locator: Element = Element(
        (
            By.XPATH,
            "//button[text()='begin labware position check, move to Slot 2']",
        ),
        "",
    )

    how_to_tell_pipette_is_centered_link: Element = Element(
        (
            By.ID,
            "StepDetailText_link",
        ),
        "",
    )

    reveal_all_jog_controls: Element = Element(
        (
            By.ID,
            "LabwarePositionCheckStepDetail_reveal_jog_controls",
        ),
        "",
    )

    back_jog_button: Element = Element(
        (
            By.XPATH,
            "//button[@title='back']",
        ),
        "",
    )
    left_jog_button: Element = Element(
        (
            By.XPATH,
            "//button[@title='left']",
        ),
        "",
    )
    right_jog_button: Element = Element(
        (
            By.XPATH,
            "//button[@title='right']",
        ),
        "",
    )
    forward_jog_button: Element = Element(
        (
            By.XPATH,
            "//button[@title='forward']",
        ),
        "",
    )
    up_jog_button: Element = Element(
        (
            By.XPATH,
            "//button[@title='up']",
        ),
        "",
    )
    down_jog_button: Element = Element(
        (
            By.XPATH,
            "//button[@title='down']",
        ),
        "",
    )

    confirm_position_button_pickup_tip: Element = Element(
        (
            By.XPATH,
            "//button[text()='Confirm position, pick up tip']",
        ),
        "",
    )

    confirm_position_moveto_slot_2: Element = Element(
        (
            By.XPATH,
            "//button[text()='Confirm position, move to slot 2']",
        ),
        "",
    )

    confirm_position_moveto_slot_5: Element = Element(
        (
            By.XPATH,
            "//button[text()='Confirm position, move to slot 5']",
        ),
        "",
    )

    confirm_position_moveto_slot_6: Element = Element(
        (
            By.XPATH,
            "//button[text()='Confirm position, move to slot 6']",
        ),
        "",
    )

    confirm_position_returntip_slot_home: Element = Element(
        (
            By.XPATH,
            "//button[text()='Confirm position, return tip to Slot 2 and home']",
        ),
        "",
    )

    labware_position_check_complete: Element = Element(
        (
            By.XPATH,
            "//h3[text()='Labware Position Check Complete']",
        ),
        "",
    )

    deckmap_labware_check_complete: Element = Element(
        (
            By.ID,
            "LabwarePositionCheck_deckMap",
        ),
        "",
    )

    section_list_step0: Element = Element(
        (
            By.ID,
            "sectionList_step_0",
        ),
        "",
    )

    section_list_step1: Element = Element(
        (
            By.ID,
            "sectionList_step_1",
        ),
        "",
    )

    section_list_step2: Element = Element(
        (
            By.ID,
            "sectionList_step_2",
        ),
        "",
    )

    close_and_apply_labware_offset_data_button: Element = Element(
        (
            By.ID,
            "Lpc_summaryScreen_applyOffsetButton",
        ),
        "",
    )

    labware_success_toast: Element = Element(
        (
            By.XPATH,
            "//span[text()='Labware Position Check complete. 3 Labware Offsets created.']",
        ),
        "",
    )

    labware_offsetbox_slot_4: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_slot_4_offsetBox",
        ),
        "",
    )

    labware_display_name_slot_4: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_slot_4_displayName",
        ),
        "",
    )

    labware_slot_4_offset_x_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_4_x",
        ),
        "",
    )

    labware_slot_4_offset_x_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_4_xValue",
        ),
        "",
    )

    labware_slot_4_offset_y_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_4_y",
        ),
        "",
    )

    labware_slot_4_offset_y_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_4_yValue",
        ),
        "",
    )
    labware_slot_4_offset_z_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_4_z",
        ),
        "",
    )

    labware_slot_4_offset_z_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_4_zValue",
        ),
        "",
    )
    labware_display_name_slot_5: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_slot_5_displayName",
        ),
        "",
    )

    labware_slot_5_offset_x_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_5_x",
        ),
        "",
    )

    labware_slot_5_offset_x_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_5_xValue",
        ),
        "",
    )

    labware_slot_5_offset_y_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_5_y",
        ),
        "",
    )

    labware_slot_5_offset_y_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_5_yValue",
        ),
        "",
    )
    labware_slot_5_offset_z_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_5_z",
        ),
        "",
    )

    labware_slot_5_offset_z_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_5_zValue",
        ),
        "",
    )
    labware_display_name_slot_2: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_slot_2_displayName",
        ),
        "",
    )

    labware_slot_2_offset_x_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_2_x",
        ),
        "",
    )

    labware_slot_2_offset_x_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_2_xValue",
        ),
        "",
    )

    labware_slot_2_offset_y_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_2_y",
        ),
        "",
    )

    labware_slot_2_offset_y_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_2_yValue",
        ),
        "",
    )
    labware_slot_2_offset_z_text: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_2_z",
        ),
        "",
    )

    labware_slot_2_offset_z_value: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_2_zValue",
        ),
        "",
    )

    labware_offsetbox_slot_2: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_slot_2_offsetBox",
        ),
        "",
    )

    labware_offsetbox_slot_5: Element = Element(
        (
            By.ID,
            "LabwareInfoOverlay_slot_5_offsetBox",
        ),
        "",
    )

    def get_labware_position_check_button(self) -> WebElement:
        """Button to locate LPC button."""
        button = self.base.clickable_wrapper(self.labware_setup_position_check_button, 2)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(button).perform()
        return button

    def get_labware_success_toast(self) -> WebElement:
        """Element to locate the success toast of LPC."""
        return self.base.clickable_wrapper(self.labware_success_toast, 2)

    def get_close_and_apply_labware_offset_data_button(self) -> WebElement:
        """Button to close and apply labware oddset data on LPC flow."""
        return self.base.clickable_wrapper(self.close_and_apply_labware_offset_data_button, 2)

    def get_section_list_step2(self) -> WebElement:
        """Element to locate the section list step2."""
        return self.base.clickable_wrapper(self.section_list_step2, 2)

    def get_section_list_step1(self) -> WebElement:
        """Element to locate the section list step1."""
        return self.base.clickable_wrapper(self.section_list_step1, 2)

    def get_section_list_step0(self) -> WebElement:
        """Element to locate the section list step0."""
        return self.base.clickable_wrapper(self.section_list_step0, 2)

    def get_deckmap_labware_check_complete(self) -> WebElement:
        """Element to locate the deckmap."""
        return self.base.clickable_wrapper(self.deckmap_labware_check_complete, 2)

    def get_labware_position_check_complete(self) -> WebElement:
        """Element to locate the LPC complete text."""
        return self.base.clickable_wrapper(self.labware_position_check_complete, 2)

    def click_labware_position_button(self) -> None:
        """Click labware position button."""
        button = self.base.clickable_wrapper(self.labware_setup_position_check_button, 2)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(button).perform()
        self.base.click(self.labware_setup_position_check_button)

    def get_introScreen_labware_position_check_overview(self) -> WebElement:
        """Element to locate into screen of LPC overview."""
        return self.base.clickable_wrapper(self.introScreen_labware_position_check_overview, 2)

    def get_begin_labware_position_check_button(self) -> WebElement:
        """Element to locate begin LPC button."""
        return self.base.clickable_wrapper(self.begin_labware_position_text_locator, 2)

    def click_begin_labware_position_check_button(self) -> None:
        """Click begin_labware_position_text."""
        self.base.click(self.begin_labware_position_text_locator)

    def get_how_to_tell_pipette_is_centered_link(self) -> WebElement:
        """Locator for how to tell pipette is centered link."""
        return self.base.clickable_wrapper(self.how_to_tell_pipette_is_centered_link, 2)

    def click_how_to_tell_pipette_is_centered_link(self) -> None:
        """Click is centered."""
        self.base.click(self.how_to_tell_pipette_is_centered_link)

    def get_reveal_all_jog_controls(self) -> WebElement:
        """Locator for reveal all jog controls."""
        return self.base.clickable_wrapper(self.reveal_all_jog_controls, 2)

    def click_reveal_all_jog_controls(self) -> None:
        """Click reveal all."""
        self.base.click(self.reveal_all_jog_controls)

    def get_back_jog_button(self) -> WebElement:
        """Locator for back jog button."""
        return self.base.clickable_wrapper(self.back_jog_button, 2)

    def click_back_jog_button(self) -> None:
        """Click back jog."""
        self.base.click(self.back_jog_button)

    def get_left_jog_button(self) -> WebElement:
        """Locator for left jog button."""
        return self.base.clickable_wrapper(self.left_jog_button, 2)

    def click_left_jog_button(self) -> None:
        """Click left jog."""
        self.base.click(self.left_jog_button)

    def get_right_jog_button(self) -> WebElement:
        """Locator for right jog button."""
        return self.base.clickable_wrapper(self.right_jog_button, 2)

    def click_right_jog_button(self) -> None:
        """Click right jog."""
        self.base.click(self.right_jog_button)

    def get_forward_jog_button(self) -> WebElement:
        """Locator for forward jog button."""
        return self.base.clickable_wrapper(self.forward_jog_button)

    def click_forward_jog_button(self) -> None:
        """Click forward jog."""
        self.base.click(self.forward_jog_button)

    def get_up_jog_button(self) -> WebElement:
        """Locator for up jog button."""
        return self.base.clickable_wrapper(self.up_jog_button, 2)

    def click_up_jog_button(self) -> None:
        """Click up jog."""
        self.base.click(self.up_jog_button)

    def get_down_jog_button(self) -> WebElement:
        """Locator for down jog button."""
        return self.base.clickable_wrapper(self.down_jog_button, 2)

    def click_down_jog_button(self) -> None:
        """Click down jog."""
        self.base.click(self.down_jog_button)

    def get_confirm_position_button_pickup_tip(self) -> WebElement:
        """Locator for confirm position button pickup."""
        toggle: WebElement = self.base.clickable_wrapper(self.confirm_position_button_pickup_tip, 5)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_confirm_position_button_pickup_tip(self) -> None:
        """Click confirm and pick up tip."""
        self.get_confirm_position_button_pickup_tip()
        self.base.click(self.confirm_position_button_pickup_tip)

    def get_confirm_position_moveto_slot_2(self) -> WebElement:
        """Locator for confirm position moveto slot."""
        toggle: WebElement = self.base.clickable_wrapper(self.confirm_position_moveto_slot_2, 5)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_confirm_position_moveto_slot_2(self) -> None:
        """Click confirm position move to slot 2."""
        self.get_confirm_position_moveto_slot_2()
        self.base.click(self.confirm_position_moveto_slot_2)

    def get_confirm_position_moveto_slot_5(self) -> WebElement:
        """Locator for confirm position move to slot."""
        toggle: WebElement = self.base.clickable_wrapper(self.confirm_position_moveto_slot_5, 5)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_confirm_position_moveto_slot_5(self) -> None:
        """Click confirm position move to slot 5."""
        self.get_confirm_position_moveto_slot_5()
        self.base.click(self.confirm_position_moveto_slot_5)

    def get_confirm_position_moveto_slot_6(self) -> WebElement:
        """Locator for confirm position moveto slot."""
        toggle: WebElement = self.base.clickable_wrapper(self.confirm_position_moveto_slot_6, 5)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_confirm_position_moveto_slot_6(self) -> None:
        """Click confirm position move to slot 6."""
        self.get_confirm_position_moveto_slot_6()
        self.base.click(self.confirm_position_moveto_slot_6)

    def get_confirm_position_returntip_slot_home(self) -> WebElement:
        """Locator for confirm position return tip ."""
        return self.base.clickable_wrapper(self.confirm_position_returntip_slot_home, 2)

    def click_confirm_position_returntip_slot_home(self) -> None:
        """Click confirm position return tip slot home."""
        self.base.click(self.confirm_position_returntip_slot_home)

    def click_get_close_and_apply_labware_offset_data_button(self) -> None:
        """Click get close and apply."""
        self.base.click(self.close_and_apply_labware_offset_data_button)

    def get_labware_display_name_slot_4(self) -> WebElement:
        """Labware name on deckmap."""
        return self.base.clickable_wrapper(self.labware_display_name_slot_4, 2)

    def get_labware_offsetbox_slot_4(self) -> WebElement:
        """Labware offset box on deckmap."""
        return self.base.clickable_wrapper(self.labware_offsetbox_slot_4, 2)

    def get_labware_slot_4_offset_x_text(self) -> WebElement:
        """Labware x text on slot 4 on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_4_offset_x_text, 2)

    def get_labware_slot_4_offset_x_value(self) -> WebElement:
        """Labware x offset value on slot 4 on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_4_offset_x_value, 2)

    def get_labware_slot_4_offset_y_text(self) -> WebElement:
        """Labware y osset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_4_offset_y_text, 2)

    def get_labware_slot_4_offset_y_value(self) -> WebElement:
        """Labware y offset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_4_offset_y_value, 2)

    def get_labware_slot_4_offset_z_text(self) -> WebElement:
        """Labware y osset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_4_offset_z_text, 2)

    def get_labware_slot_4_offset_z_value(self) -> WebElement:
        """Labware y offset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_4_offset_z_value, 2)

    def get_labware_display_name_slot_5(self) -> WebElement:
        """Labware name on deckmap."""
        return self.base.clickable_wrapper(self.labware_display_name_slot_5, 2)

    def get_labware_offsetbox_slot_5(self) -> WebElement:
        """Labware offset box on deckmap."""
        return self.base.clickable_wrapper(self.labware_offsetbox_slot_5, 2)

    def get_labware_slot_5_offset_x_text(self) -> WebElement:
        """Labware x text on slot 4 on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_5_offset_x_text, 2)

    def get_labware_slot_5_offset_x_value(self) -> WebElement:
        """Labware x offset value on slot 4 on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_5_offset_x_value, 2)

    def get_labware_slot_5_offset_y_text(self) -> WebElement:
        """Labware y offset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_5_offset_y_text, 2)

    def get_labware_slot_5_offset_y_value(self) -> WebElement:
        """Labware y offset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_5_offset_y_value, 2)

    def get_labware_slot_5_offset_z_text(self) -> WebElement:
        """Labware y osset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_5_offset_z_text, 2)

    def get_labware_slot_5_offset_z_value(self) -> WebElement:
        """Labware y offset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_5_offset_z_value, 2)

    def get_labware_display_name_slot_2(self) -> WebElement:
        """Labware name on deckmap."""
        return self.base.clickable_wrapper(self.labware_display_name_slot_2, 2)

    def get_labware_offsetbox_slot_2(self) -> WebElement:
        """Labware offset box on deckmap."""
        return self.base.clickable_wrapper(self.labware_offsetbox_slot_2, 2)

    def get_labware_slot_2_offset_x_text(self) -> WebElement:
        """Labware x text on slot 4 on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_2_offset_x_text, 2)

    def get_labware_slot_2_offset_x_value(self) -> WebElement:
        """Labware x offset value on slot 4 on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_2_offset_x_value, 2)

    def get_labware_slot_2_offset_y_text(self) -> WebElement:
        """Labware y osset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_2_offset_y_text, 2)

    def get_labware_slot_2_offset_y_value(self) -> WebElement:
        """Labware y offset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_2_offset_y_value, 2)

    def get_labware_slot_2_offset_z_text(self) -> WebElement:
        """Labware y osset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_2_offset_z_text, 2)

    def get_labware_slot_2_offset_z_value(self) -> WebElement:
        """Labware y offset value on deckmap."""
        return self.base.clickable_wrapper(self.labware_slot_2_offset_z_value, 2)

    ignore_stored_data_button: Element = Element(
        (By.XPATH, "//button[text()='Ignore stored data']"),
        "ignore stored data button on modal for LPC enhancement",
    )

    def get_ignored_stored_data(self) -> Optional[WebElement]:
        """Safely get the ignore stored data button."""
        return self.base.clickable_wrapper_safe(self.ignore_stored_data_button, 4)

    def click_ignored_stored_data(self) -> None:
        """Click the ignore stored data button."""
        self.base.click(self.ignore_stored_data_button)
