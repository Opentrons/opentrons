"""Model for the App Settings page that displays info and settings for the app."""
from typing import Optional
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from src.driver.base import Base, Element


class AppSettings:
    """Elements and actions for the App Settings Page that loads when the app is opened."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    def get_app_settings_header(self) -> Optional[WebElement]:
        """Get the app settings text."""
        header: Element = Element(
            (By.XPATH, '//p[text()="App Settings"]'),
            "App Settings header text",
        )
        return self.base.present_wrapper(header, 2)

    def get_app_software_version_text(self) -> Optional[WebElement]:
        """Get the app App Software Version text."""
        text: Element = Element(
            (By.XPATH, '//p[text()="App Software Version"]'),
            "App App Software Version header text",
        )
        return self.base.present_wrapper(text, 2)

    def get_app_software_version_value(self) -> Optional[WebElement]:
        """Get the App Software Version value."""
        value: Element = Element(
            (By.ID, f"GeneralSettings_currentVersion"),
            "App Software Version header value",
        )
        return self.base.present_wrapper(value, 2)

    def get_link_restore_previous_version(self) -> Optional[WebElement]:
        """Get the link to restore the previous version."""
        link: Element = Element(
            (By.ID, f"GeneralSettings_previousVersionLink"),
            "Link to restore the previous app version",
        )
        return self.base.present_wrapper(link, 2)

    def click_link_restore_previous_version(self) -> None:
        """Click on the link to restore the previous version"""
        button: Optional[WebElement] = self.get_link_restore_previous_version()
        if button:
            button.click()

    def get_link_app_robot_sync(self) -> Optional[WebElement]:
        """Get the link to keep the robot and app in sync."""
        link: Element = Element(
            (By.ID, f"GeneralSettings_appAndRobotSync"),
            "Link to keep the robot and app in sync",
        )
        return self.base.present_wrapper(link, 2)

    def get_software_update_alert_toggle(self) -> Optional[WebElement]:
        """Get the toggle to update the software alert."""
        toggle: Element = Element(
            (By.ID, f"GeneralSettings_softwareUpdateAlerts"),
            "toggle button to get the software update button",
        )
        return self.base.present_wrapper(toggle, 5)

    def click_software_update_alert_toggle(self) -> None:
        """Click on the software update alert toggle button"""
        button: Optional[WebElement] = self.get_software_update_alert_toggle()
        if button:
            button.click()

    def get_connect_to_robot_via_IP_address_text(self) -> Optional[WebElement]:
        """Get the connect to robot via IP address."""
        text: Element = Element(
            (By.XPATH, '//p[text()="Connect to a Robot via IP Address"]'),
            "connect to robot via IP address text",
        )
        return self.base.present_wrapper(text, 2)

    def get_connect_to_robot_via_IP_address_button(self) -> Optional[WebElement]:
        """Get the connect to robot via IP address button."""
        button: Element = Element(
            (By.ID, f"GeneralSettings_setUpConnection"),
            "connect to robot via IP address button",
        )
        return self.base.present_wrapper(button, 2)

    def click_connect_to_robot_via_IP_address_button(self) -> None:
        """Click on the connect to robot via IP address button"""
        button: Optional[WebElement] = self.get_connect_to_robot_via_IP_address_button()
        if button:
            button.click()

    def get_how_to_restore_software_version_modal(self) -> Optional[WebElement]:
        """Get the modal for How to Restore a Previous Software Version."""
        button: Element = Element(
            (By.XPATH, '//h3[text()="How to Restore a Previous Software Version"]'),
            "How to Restore a Previous Software Version modal",
        )
        return self.base.present_wrapper(button, 2)

    def get_software_update_alert_header(self) -> Optional[WebElement]:
        """Get the software update alert header."""
        button: Element = Element(
            (By.XPATH, '//p[text()="Software Update Alerts"]'),
            "Software update alert header",
        )
        return self.base.present_wrapper(button, 2)

    def get_connect_robot_via_IP_header(self) -> Optional[WebElement]:
        """Get the software update alert header."""
        button: Element = Element(
            (By.XPATH, '//p[text()="Connect to a Robot via IP Address"]'),
            "Software update alert header",
        )
        return self.base.present_wrapper(button, 2)

    def get_learn_more_about_uninstalling_opentrons_app(self) -> Optional[WebElement]:
        """Get the link to uninstalling the opentrons app."""
        button: Element = Element(
            (By.ID, f"PreviousVersionModal_uninstallingAppLink"),
            "link to uninstalling the opentrons app",
        )
        return self.base.present_wrapper(button, 2)

    def get_link_to_previous_releases(self) -> Optional[WebElement]:
        """Get the link to previous releases."""
        button: Element = Element(
            (By.ID, f"PreviousVersionModal_previousReleases"),
            "link to previous releases",
        )
        return self.base.present_wrapper(button, 2)

    def get_close_previous_software_modal(self) -> Optional[WebElement]:
        """Get the close button in the previous software version modal."""
        button: Element = Element(
            (By.ID, f"PreviousVersionModal_closeButton"),
            "close button in the previous software version modal",
        )
        return self.base.present_wrapper(button, 2)

    def click_close_previous_software_modal(self) -> None:
        """Click the close button in the previous software version modal."""
        button: Optional[WebElement] = self.get_close_previous_software_modal()
        if button:
            button.click()

    # connect to IP address object
    def get_connect_to_robot_via_IP_address_slideout_header(
        self,
    ) -> Optional[WebElement]:
        """Get the connect to robot via IP address slideout header."""
        header: Element = Element(
            (
                By.XPATH,
                "//h2[@data-testid='Slideout_title_Connect to a Robot via IP Address']",
            ),
            "connect to robot via IP address slideout header text",
        )
        return self.base.present_wrapper(header, 2)

    def get_link_learn_more_about_connecting_a_robot_manually(
        self,
    ) -> Optional[WebElement]:
        """Get the link to connect to robot manually."""
        button: Element = Element(
            (By.ID, f"ConnectIPAddressSupportPage"),
            "the link to connect to robot manually",
        )
        return self.base.present_wrapper(button, 2)

    def get_textbox_to_enter_the_ip(
        self,
    ) -> Optional[WebElement]:
        """Get the textbox to enter the IP address."""
        button: Element = Element(
            (By.ID, f"ip"),
            "the textbox to enter the IP address",
        )
        return self.base.present_wrapper(button, 2)

    def get_try_again_link(
        self,
    ) -> Optional[WebElement]:
        """Get the try again link."""
        button: Element = Element(
            (By.ID, f"AppSettings_Connection_Button"),
            "the try again link",
        )
        return self.base.present_wrapper(button, 30)

    def click_add_ip_or_hostname(self) -> None:
        """Click on text box to add ip or hsotname"""
        button: Optional[WebElement] = self.get_textbox_to_enter_the_ip()
        if button:
            button.click()

    def get_add_button(
        self,
    ) -> Optional[WebElement]:
        """Get the add button."""
        button: Element = Element(
            (By.XPATH, f"//button[text()='Add']"),
            "the add button",
        )
        return self.base.present_wrapper(button, 2)

    def click_add_button(self) -> None:
        """Click on add button"""
        button: Optional[WebElement] = self.get_add_button()
        if button:
            button.click()

    def enter_hostname(self, hostname: str) -> None:
        input: Element = Element(
            (By.ID, f"ip"),
            f"Input hostname to the slideout.'",
        )
        element = self.base.clickable_wrapper(input)
        if element:
            element.clear()
            element.send_keys(hostname)

    def get_done_button(
        self,
    ) -> Optional[WebElement]:
        """Get the done button."""
        button: Element = Element(
            (By.XPATH, f"//button[text()='Done']"),
            "the done button",
        )
        return self.base.present_wrapper(button, 2)

    def click_done_button(self) -> None:
        """Click on add button"""
        button: Optional[WebElement] = self.get_done_button()
        if button:
            button.click()

    # Privacy Tab elements
    def get_privacy_tab(self) -> Optional[WebElement]:
        """Search for the privacy tab in app-settings."""
        privacy: Element = Element(
            (By.XPATH, '//a[contains(@href,"#/app-settings/privacy")]'),
            "privacy tab in App Settings",
        )
        return self.base.clickable_wrapper(privacy, 5)

    def click_privacy_tab(self) -> None:
        """Click on the privacy tab in app-settings"""
        button: Optional[WebElement] = self.get_privacy_tab()
        if button:
            button.click()

    def get_robot_app_analytics(self) -> Optional[WebElement]:
        """Get the robot and app analytics with Opentrons."""
        button: Element = Element(
            (By.XPATH, '//p[text()="Share Robot and App Analytics with Opentrons"]'),
            "the robot and app analytics with Opentrons",
        )
        return self.base.present_wrapper(button, 2)

    def get_robot_app_analytics_toggle(self) -> Optional[WebElement]:
        """Get the robot and app analytics with Opentrons toggle."""
        button: Element = Element(
            (By.ID, f"PrivacySettings_analytics"),
            "the robot and app analytics with Opentrons toggle",
        )
        return self.base.present_wrapper(button, 2)

    def click_robot_app_analytics(self) -> None:
        """Click on the robot app analytics"""
        button: Optional[WebElement] = self.get_robot_app_analytics_toggle()
        if button:
            button.click()

    # Advanced Tab elements
    def get_advanced_tab(self) -> Optional[WebElement]:
        """Search for the advanced tab in app-settings."""
        advanced: Element = Element(
            (By.XPATH, '//a[contains(@href,"#/app-settings/advanced")]'),
            "advanced tab in App Settings",
        )
        return self.base.clickable_wrapper(advanced, 5)

    def click_advanced_tab(self) -> None:
        """Click on the advanced tab"""
        button: Optional[WebElement] = self.get_advanced_tab()
        if button:
            button.click()

    def get_update_channel(self) -> Optional[WebElement]:
        """Get the update channel on advanced tab."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_updatedChannel"),
            "the update channel",
        )
        return self.base.present_wrapper(button, 2)

    def get_update_channel_latest_stable(self) -> Optional[WebElement]:
        """Get the update channel latest stable on advanced tab."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_latest"),
            "the update channel latest stable",
        )
        return self.base.present_wrapper(button, 2)

    def get_additional_custom_labware_source_folder(self) -> Optional[WebElement]:
        """Get the additional custom labware source folder on advanced tab."""
        text: Element = Element(
            (By.ID, f"AdvancedSettings_customLabware"),
            "the additional custom labware source folder on advanced tab",
        )
        return self.base.present_wrapper(text, 2)

    def get_change_labware_source_folder_button(self) -> Optional[WebElement]:
        """Get the change labware source folder on advanced tab."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_changeLabwareSource"),
            "the change labware source folder on advanced tab",
        )
        return self.base.present_wrapper(button, 2)

    def get_additional_source_folder(self) -> Optional[WebElement]:
        """Get the additional source folder on advanced tab."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_sourceFolderLink"),
            "the additional source folder on advanced tab",
        )
        return self.base.present_wrapper(button, 2)

    def get_tip_length_calibration_method(self) -> Optional[WebElement]:
        """Get the tip length calibration on advanced tab."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_tipLengthCalibration"),
            "the tip length calibration on advanced tab",
        )
        return self.base.present_wrapper(button, 2)

    def get_tip_calibration_block_to_calibrate(self) -> Optional[WebElement]:
        """Search for the Always use calibration block to calibrate."""
        privacy: Element = Element(
            (By.XPATH, '//div[text()="Always use calibration block to calibrate"]'),
            "Always use calibration block to calibrate",
        )
        return self.base.clickable_wrapper(privacy, 5)

    def click_tip_calibration_block_to_calibrate(self) -> None:
        """Click on Always use calibration block to calibrate option"""
        button: Optional[WebElement] = self.get_tip_calibration_block_to_calibrate()
        if button:
            button.click()

    def get_tip_calaibration_trash_bin(self) -> Optional[WebElement]:
        """Search for Always use trash bin to calibrate."""
        privacy: Element = Element(
            (By.XPATH, '//div[text()="Always use trash bin to calibrate"]'),
            "Always use trash bin to calibrate",
        )
        return self.base.clickable_wrapper(privacy, 5)

    def click_tip_calaibration_trash_bin(self) -> None:
        """Click on Always use trash bin to calibrate option"""
        button: Optional[WebElement] = self.get_tip_calaibration_trash_bin()
        if button:
            button.click()

    def get_tip_calibration_prompt_choose(self) -> Optional[WebElement]:
        """Search for the Always show the prompt to choose calibration block or trash bin."""
        privacy: Element = Element(
            (
                By.XPATH,
                '//div[text()="Always show the prompt to choose calibration block or trash bin"]',
            ),
            "Always show the prompt to choose calibration block or trash bin",
        )
        return self.base.clickable_wrapper(privacy, 5)

    def click_tip_calibration_prompt_choose(self) -> None:
        """Click on the Always show the prompt to choose calibration block or trash bin"""
        button: Optional[WebElement] = self.get_tip_calibration_prompt_choose()
        if button:
            button.click()

    def get_display_unavailable_robots_header(self) -> Optional[WebElement]:
        """Display unavailable robots."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_unavailableRobots"),
            "the unavailable robots on advanced tab",
        )
        return self.base.present_wrapper(button, 2)

    def get_display_unavailable_robots_toggle(self) -> Optional[WebElement]:
        """Display unavailable robots toggle."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_unavailableRobotsToggleButton"),
            "the unavailable robots toggle on advanced tab",
        )
        return self.base.present_wrapper(button, 2)

    def click_unavailable_robot_toggle(self) -> None:
        """Click on the unavailable robot toggle"""
        button: Optional[WebElement] = self.get_display_unavailable_robots_toggle()
        if button:
            button.click()

    def get_clear_unavailable_robots_header(self) -> Optional[WebElement]:
        """clear unavailable robots."""
        text: Element = Element(
            (By.ID, f"AdvancedSettings_clearRobots"),
            "the clear unavailable robots on advanced tab",
        )
        return self.base.present_wrapper(text, 2)

    def get_clear_unavailable_robots_list_button(self) -> Optional[WebElement]:
        """clear unavailable robots toggle."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_clearUnavailableRobots"),
            "the clear unavailable robots toggle on advanced tab",
        )
        return self.base.present_wrapper(button, 2)

    def click_clear_unavailable_robot_button(self) -> None:
        """Click on the clear unavailable robot button"""
        button: Optional[WebElement] = self.get_clear_unavailable_robots_list_button()
        if button:
            button.click()

    def get_enable_developer_tool_header(self) -> Optional[WebElement]:
        """Enable Developer Tools."""
        text: Element = Element(
            (By.ID, f"AdvancedSettings_devTools"),
            "the Enable Developer Tools on advanced tab",
        )
        return self.base.present_wrapper(text, 2)

    def get_enable_developer_tools_toggle(self) -> Optional[WebElement]:
        """Enable Developer Tools toggle."""
        button: Element = Element(
            (By.ID, f"AdvancedSettings_devTooltoggle"),
            "the Enable Developer Tools toggle on advanced tab",
        )
        return self.base.present_wrapper(button, 2)

    def click_enable_developer_tools_toggle(self) -> None:
        """Click on the Enable Developer Tools toggle"""
        button: Optional[WebElement] = self.get_enable_developer_tools_toggle()
        if button:
            button.click()

    ## Elements for Feature Flag

    def get_feature_flag_tab(self) -> Optional[WebElement]:
        """Search for the feature flag tab in app-settings."""
        ff: Element = Element(
            (By.XPATH, '//a[contains(@href,"#/app-settings/feature-flags")]'),
            "advanced tab in App Settings",
        )
        return self.base.clickable_wrapper(ff, 8)

    def click_feature_flag_tab(self) -> None:
        """Click on the feature flag tab"""
        button: Optional[WebElement] = self.get_feature_flag_tab()
        if button:
            button.click()
