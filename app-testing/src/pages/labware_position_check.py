"""Model for the screen of Labware Position Check."""
import logging
from typing import Optional, Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)


class LabwarePositionCheck:
    """Class for Labware Position Check."""

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    labware_setup_position_check_button: Tuple[str, str] = (
        By.ID,
        "LabwareSetup_checkLabwarePositionsButton",
    )

    introScreen_labware_position_check_overview: Tuple[str, str] = (
        By.ID,
        "IntroScreen_labware_position_check_overview",
    )

    begin_labware_position_text_locator: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='begin labware position check, move to Slot 4']",
    )

    how_to_tell_pipette_is_centered_link: Tuple[str, str] = (
        By.ID,
        "StepDetailText_link",
    )

    reveal_all_jog_controls: Tuple[str, str] = (
        By.ID,
        "LabwarePositionCheckStepDetail_reveal_jog_controls",
    )

    back_jog_button: Tuple[str, str] = (
        By.XPATH,
        "//button[@title='back']",
    )
    left_jog_button: Tuple[str, str] = (
        By.XPATH,
        "//button[@title='left']",
    )
    right_jog_button: Tuple[str, str] = (
        By.XPATH,
        "//button[@title='right']",
    )
    forward_jog_button: Tuple[str, str] = (
        By.XPATH,
        "//button[@title='forward']",
    )
    up_jog_button: Tuple[str, str] = (
        By.XPATH,
        "//button[@title='up']",
    )
    down_jog_button: Tuple[str, str] = (
        By.XPATH,
        "//button[@title='down']",
    )

    confirm_position_button_pickup_tip: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='Confirm position, pick up tip']",
    )

    confirm_position_moveto_slot_2: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='Confirm position, move to slot 2']",
    )

    confirm_position_moveto_slot_5: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='Confirm position, move to slot 5']",
    )

    confirm_position_moveto_slot_6: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='Confirm position, move to slot 6']",
    )

    confirm_position_returntip_slot_home: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='Confirm position, return tip to Slot  and home']",
    )

    labware_position_check_complete: Tuple[str, str] = (
        By.XPATH,
        "//h3[text()='Labware Position Check Complete']",
    )

    deckmap_labware_check_complete: Tuple[str, str] = (
        By.ID,
        "LabwarePositionCheck_deckMap",
    )

    section_list_step0: Tuple[str, str] = (
        By.ID,
        "sectionList_step_0",
    )

    section_list_step1: Tuple[str, str] = (
        By.ID,
        "sectionList_step_1",
    )

    section_list_step2: Tuple[str, str] = (
        By.ID,
        "sectionList_step_2",
    )

    close_and_apply_labware_offset_data_button: Tuple[str, str] = (
        By.ID,
        "Lpc_summaryScreen_applyOffsetButton",
    )

    labware_success_toast: Tuple[str, str] = (
        By.XPATH,
        "//span[text()='Labware Position Check complete. 3 Labware Offsets created.']",
    )

    labware_offsetbox_slot_4: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_slot_4_offsetBox",
    )

    labware_display_name_slot_4: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_slot_4_displayName",
    )

    labware_slot_4_offset_x_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_4_x",
    )

    labware_slot_4_offset_x_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_4_xValue",
    )

    labware_slot_4_offset_y_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_4_y",
    )

    labware_slot_4_offset_y_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_4_yValue",
    )
    labware_slot_4_offset_z_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_4_z",
    )

    labware_slot_4_offset_z_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_4_zValue",
    )
    labware_display_name_slot_5: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_slot_5_displayName",
    )

    labware_slot_5_offset_x_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_5_x",
    )

    labware_slot_5_offset_x_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_5_xValue",
    )

    labware_slot_5_offset_y_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_5_y",
    )

    labware_slot_5_offset_y_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_5_yValue",
    )
    labware_slot_5_offset_z_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_5_z",
    )

    labware_slot_5_offset_z_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_5_zValue",
    )
    labware_display_name_slot_2: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_slot_2_displayName",
    )

    labware_slot_2_offset_x_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_2_x",
    )

    labware_slot_2_offset_x_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_2_xValue",
    )

    labware_slot_2_offset_y_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_2_y",
    )

    labware_slot_2_offset_y_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_2_yValue",
    )
    labware_slot_2_offset_z_text: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_2_z",
    )

    labware_slot_2_offset_z_value: Tuple[str, str] = (
        By.ID,
        "LabwareInfoOverlay_2_zValue",
    )

    @highlight
    def get_labware_position_check_button(self) -> WebElement:
        """Button to locate LPC button."""
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_setup_position_check_button
            )
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    @highlight
    def get_labware_success_toast(self) -> WebElement:
        """Element to locate the success toast of LPC"""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.labware_success_toast)
        )

    @highlight
    def get_close_and_apply_labware_offset_data_button(self) -> WebElement:
        """Button to close and apply labware oddset data on LPC flow."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.close_and_apply_labware_offset_data_button
            )
        )

    @highlight
    def get_section_list_step2(self) -> WebElement:
        """Element to locate the section list step2"""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.section_list_step2)
        )

    @highlight
    def get_section_list_step1(self) -> WebElement:
        """Element to locate the section list step1"""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.section_list_step1)
        )

    @highlight
    def get_section_list_step0(self) -> WebElement:
        """Element to locate the section list step0"""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.section_list_step0)
        )

    @highlight
    def get_deckmap_labware_check_complete(self) -> WebElement:
        """Element to locate the deckmap"""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.deckmap_labware_check_complete
            )
        )

    @highlight
    def get_labware_position_check_complete(self) -> WebElement:
        """Element to locate the LPC complete text"""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_position_check_complete
            )
        )

    def click_labware_position_button(self) -> None:
        self.get_labware_position_check_button().click()

    @highlight
    def get_introScreen_labware_position_check_overview(self) -> WebElement:
        """Element to locate into screen of LPC overview"""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.introScreen_labware_position_check_overview
            )
        )

    @highlight
    def get_begin_labware_position_check_button(self) -> WebElement:
        """Element to locate begin LPC button"""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.begin_labware_position_text_locator
            )
        )

    def click_begin_labware_position_check_button(self) -> None:
        self.get_begin_labware_position_check_button().click()

    @highlight
    def get_how_to_tell_pipette_is_centered_link(self) -> WebElement:
        """Locator for how to tell pipette is centered link."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.how_to_tell_pipette_is_centered_link
            )
        )

    def click_how_to_tell_pipette_is_centered_link(self) -> None:
        self.get_how_to_tell_pipette_is_centered_link().click()

    @highlight
    def get_reveal_all_jog_controls(self) -> WebElement:
        """Locator for reveal all jog controls."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.reveal_all_jog_controls)
        )

    def click_reveal_all_jog_controls(self) -> None:
        self.get_reveal_all_jog_controls().click()

    @highlight
    def get_back_jog_button(self) -> WebElement:
        """Locator for back jog button."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.back_jog_button)
        )

    def click_back_jog_button(self) -> None:
        self.get_back_jog_button().click()

    @highlight
    def get_left_jog_button(self) -> WebElement:
        """Locator for left jog button."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.left_jog_button)
        )

    def click_left_jog_button(self) -> None:
        self.get_left_jog_button().click()

    @highlight
    def get_right_jog_button(self) -> WebElement:
        """Locator for right jog button."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.right_jog_button)
        )

    def click_right_jog_button(self) -> None:
        self.get_right_jog_button().click()

    @highlight
    def get_forward_jog_button(self) -> WebElement:
        """Locator for forward jog button."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.forward_jog_button)
        )

    def click_forward_jog_button(self) -> None:
        self.get_forward_jog_button().click()

    @highlight
    def get_up_jog_button(self) -> WebElement:
        """Locator for up jog button."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.up_jog_button)
        )

    def click_up_jog_button(self) -> None:
        self.get_up_jog_button().click()

    @highlight
    def get_down_jog_button(self) -> WebElement:
        """Locator for down jog button."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.down_jog_button)
        )

    def click_down_jog_button(self) -> None:
        self.get_down_jog_button().click()

    @highlight
    def get_confirm_position_button_pickup_tip(self) -> WebElement:
        """Locator for confirm position button pickup."""
        toggle: WebElement = WebDriverWait(self.driver, 5).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.confirm_position_button_pickup_tip
            )
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_confirm_position_button_pickup_tip(self) -> None:
        self.get_confirm_position_button_pickup_tip().click()

    @highlight
    def get_confirm_position_moveto_slot_2(self) -> WebElement:
        """Locator for confirm positin moveto slot."""
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.confirm_position_moveto_slot_2
            )
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_confirm_position_moveto_slot_2(self) -> None:
        self.get_confirm_position_moveto_slot_2().click()

    @highlight
    def get_confirm_position_moveto_slot_5(self) -> WebElement:
        """Locator for confirm positin moveto slot."""
        toggle: WebElement = WebDriverWait(self.driver, 5).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.confirm_position_moveto_slot_5
            )
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_confirm_position_moveto_slot_5(self) -> None:
        self.get_confirm_position_moveto_slot_5().click()

    @highlight
    def get_confirm_position_moveto_slot_6(self) -> WebElement:
        """Locator for confirm positin moveto slot."""
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.confirm_position_moveto_slot_6
            )
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_confirm_position_moveto_slot_6(self) -> None:
        self.get_confirm_position_moveto_slot_6().click()

    @highlight
    def get_confirm_position_returntip_slot_home(self) -> WebElement:
        """Locator for confirm positin return tip ."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.confirm_position_returntip_slot_home
            )
        )

    def click_confirm_position_returntip_slot_home(self) -> None:
        self.get_confirm_position_returntip_slot_home().click()

    def click_get_close_and_apply_labware_offset_data_button(self) -> None:
        self.get_close_and_apply_labware_offset_data_button().click()

    @highlight
    def get_labware_display_name_slot_4(self) -> Optional[WebElement]:
        """locator for Labware name on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.labware_display_name_slot_4)
        )

    @highlight
    def get_labware_offsetbox_slot_4(self) -> Optional[WebElement]:
        """locator for Labware offset box on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.labware_offsetbox_slot_4)
        )

    @highlight
    def get_labware_slot_4_offset_x_text(self) -> Optional[WebElement]:
        """locator for Labware x text on slot 4 on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_x_text
            )
        )

    @highlight
    def get_labware_slot_4_offset_x_value(self) -> Optional[WebElement]:
        """locator for Labware x offset value on slot 4 on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_x_value
            )
        )

    @highlight
    def get_labware_slot_4_offset_y_text(self) -> Optional[WebElement]:
        """locator for Labware y osset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_y_text
            )
        )

    @highlight
    def get_labware_slot_4_offset_y_value(self) -> Optional[WebElement]:
        """locator for Labware y offset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_y_value
            )
        )

    @highlight
    def get_labware_slot_4_offset_z_text(self) -> Optional[WebElement]:
        """locator for Labware y osset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_z_text
            )
        )

    @highlight
    def get_labware_slot_4_offset_z_value(self) -> Optional[WebElement]:
        """locator for Labware y offset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_z_value
            )
        )

    @highlight
    def get_labware_display_name_slot_5(self) -> Optional[WebElement]:
        """locator for Labware name on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.labware_display_name_slot_5)
        )

    @highlight
    def get_labware_offsetbox_slot_5(self) -> Optional[WebElement]:
        """locator for Labware offset box on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.labware_offsetbox_slot_5)
        )

    @highlight
    def get_labware_slot_5_offset_x_text(self) -> Optional[WebElement]:
        """locator for Labware x text on slot 4 on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_5_offset_x_text
            )
        )

    @highlight
    def get_labware_slot_5_offset_x_value(self) -> Optional[WebElement]:
        """locator for Labware x offset value on slot 4 on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_5_offset_x_value
            )
        )

    @highlight
    def get_labware_slot_5_offset_y_text(self) -> Optional[WebElement]:
        """locator for Labware y osset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_5_offset_y_text
            )
        )

    @highlight
    def get_labware_slot_5_offset_y_value(self) -> Optional[WebElement]:
        """locator for Labware y offset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_5_offset_y_value
            )
        )

    @highlight
    def get_labware_slot_5_offset_z_text(self) -> Optional[WebElement]:
        """locator for Labware y osset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_5_offset_z_text
            )
        )

    @highlight
    def get_labware_slot_5_offset_z_value(self) -> Optional[WebElement]:
        """locator for Labware y offset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_5_offset_z_value
            )
        )

    @highlight
    def get_labware_display_name_slot_2(self) -> Optional[WebElement]:
        """locator for Labware name on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.labware_display_name_slot_4)
        )

    @highlight
    def get_labware_offsetbox_slot_2(self) -> Optional[WebElement]:
        """locator for Labware offset box on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwarePositionCheck.labware_offsetbox_slot_4)
        )

    @highlight
    def get_labware_slot_2_offset_x_text(self) -> Optional[WebElement]:
        """locator for Labware x text on slot 4 on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_x_text
            )
        )

    @highlight
    def get_labware_slot_2_offset_x_value(self) -> Optional[WebElement]:
        """locator for Labware x offset value on slot 4 on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_x_value
            )
        )

    @highlight
    def get_labware_slot_2_offset_y_text(self) -> Optional[WebElement]:
        """locator for Labware y osset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_y_text
            )
        )

    @highlight
    def get_labware_slot_2_offset_y_value(self) -> Optional[WebElement]:
        """locator for Labware y offset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_y_value
            )
        )

    @highlight
    def get_labware_slot_2_offset_z_text(self) -> Optional[WebElement]:
        """locator for Labware y osset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_z_text
            )
        )

    @highlight
    def get_labware_slot_2_offset_z_value(self) -> Optional[WebElement]:
        """locator for Labware y offset value on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwarePositionCheck.labware_slot_4_offset_z_value
            )
        )
