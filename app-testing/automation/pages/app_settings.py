"""Model for the App Settings page that displays info and settings for the app."""
from typing import Optional

from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from automation.driver.base import Base, Element


class AppSettings:
    """Elements and actions for the App Settings Page that loads when the app is opened."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    app_settings_header: Element = Element(
        (By.XPATH, '//p[text()="App Settings"]'),
        "App Settings header text",
    )

    def get_app_settings_header(self) -> WebElement:
        """Get the app settings text."""
        return self.base.present_wrapper(self.app_settings_header, 2)

    app_software_version_text: Element = Element(
        (By.XPATH, '//p[text()="App Software Version"]'),
        "App App Software Version header text",
    )

    def get_app_software_version_text(self) -> WebElement:
        """Get the app App Software Version text."""
        return self.base.present_wrapper(self.app_software_version_text, 2)

    app_software_version_value: Element = Element(
        (By.ID, "GeneralSettings_currentVersion"),
        "App Software Version header value",
    )

    def get_app_software_version_value(self) -> WebElement:
        """Get the App Software Version value."""
        return self.base.present_wrapper(self.app_software_version_value, 2)

    link_restore_previous_version: Element = Element(
        (By.ID, "GeneralSettings_previousVersionLink"),
        "Link to restore the previous app version",
    )

    def get_link_restore_previous_version(self) -> WebElement:
        """Get the link to restore the previous version."""
        return self.base.present_wrapper(self.link_restore_previous_version, 2)

    def click_link_restore_previous_version(self) -> None:
        """Click on the link to restore the previous version."""
        self.base.click(self.link_restore_previous_version)

    link_app_robot_sync: Element = Element(
        (By.ID, "GeneralSettings_appAndRobotSync"),
        "Link to keep the robot and app in sync",
    )

    def get_link_app_robot_sync(self) -> WebElement:
        """Get the link to keep the robot and app in sync."""
        return self.base.present_wrapper(self.link_app_robot_sync, 2)

    software_update_alert_toggle: Element = Element(
        (By.ID, "GeneralSettings_softwareUpdateAlerts"),
        "toggle button to get the software update button",
    )

    def get_software_update_alert_toggle(self) -> WebElement:
        """Get the toggle to update the software alert."""
        return self.base.present_wrapper(self.software_update_alert_toggle, 5)

    def click_software_update_alert_toggle(self) -> None:
        """Click on the software update alert toggle button."""
        self.base.click(self.software_update_alert_toggle)

    connect_to_robot_via_IP_address_text: Element = Element(
        (By.XPATH, '//p[text()="Connect to a Robot via IP Address"]'),
        "connect to robot via IP address text",
    )

    def get_connect_to_robot_via_IP_address_text(self) -> WebElement:
        """Get the connect to robot via IP address."""
        return self.base.present_wrapper(self.connect_to_robot_via_IP_address_text, 2)

    connect_to_robot_via_IP_address_button: Element = Element(
        (By.ID, "GeneralSettings_setUpConnection"),
        "connect to robot via IP address button",
    )

    def get_connect_to_robot_via_IP_address_button(self) -> WebElement:
        """Get the connect to robot via IP address button."""
        return self.base.present_wrapper(self.connect_to_robot_via_IP_address_button, 2)

    def click_connect_to_robot_via_IP_address_button(self) -> None:
        """Click on the connect to robot via IP address button."""
        self.base.click(self.connect_to_robot_via_IP_address_button)

    how_to_restore_software_version_modal: Element = Element(
        (By.XPATH, '//h3[text()="How to Restore a Previous Software Version"]'),
        "How to Restore a Previous Software Version modal",
    )

    def get_how_to_restore_software_version_modal(self) -> WebElement:
        """Get the modal for How to Restore a Previous Software Version."""
        return self.base.present_wrapper(self.how_to_restore_software_version_modal, 2)

    software_update_alert_header: Element = Element(
        (By.XPATH, '//p[text()="Software Update Alerts"]'),
        "Software update alert header",
    )

    def get_software_update_alert_header(self) -> WebElement:
        """Get the software update alert header."""
        return self.base.present_wrapper(self.software_update_alert_header, 2)

    connect_robot_via_IP_header: Element = Element(
        (By.XPATH, '//p[text()="Connect to a Robot via IP Address"]'),
        "Software update alert header",
    )

    def get_connect_robot_via_IP_header(self) -> WebElement:
        """Get the software update alert header."""
        return self.base.present_wrapper(self.connect_robot_via_IP_header, 2)

    learn_more_about_uninstalling_opentrons_app: Element = Element(
        (By.ID, "PreviousVersionModal_uninstallingAppLink"),
        "link to uninstalling the opentrons app",
    )

    def get_learn_more_about_uninstalling_opentrons_app(self) -> WebElement:
        """Get the link to uninstalling the opentrons app."""
        return self.base.present_wrapper(self.learn_more_about_uninstalling_opentrons_app, 2)

    link_to_previous_releases: Element = Element(
        (By.ID, "PreviousVersionModal_previousReleases"),
        "link to previous releases",
    )

    def get_link_to_previous_releases(self) -> WebElement:
        """Get the link to previous releases."""
        return self.base.present_wrapper(self.link_to_previous_releases, 2)

    close_previous_software_modal: Element = Element(
        (By.ID, "PreviousVersionModal_closeButton"),
        "close button in the previous software version modal",
    )

    def get_close_previous_software_modal(self) -> WebElement:
        """Get the close button in the previous software version modal."""
        return self.base.present_wrapper(self.close_previous_software_modal, 2)

    def click_close_previous_software_modal(self) -> None:
        """Click the close button in the previous software version modal."""
        button: Optional[WebElement] = self.get_close_previous_software_modal()
        if button:
            button.click()

    connect_to_robot_via_IP_address_slideout_header: Element = Element(
        (
            By.XPATH,
            "//h2[@data-testid='Slideout_title_Connect to a Robot via IP Address']",
        ),
        "connect to robot via IP address slideout header text",
    )

    def get_connect_to_robot_via_IP_address_slideout_header(
        self,
    ) -> WebElement:
        """Get the connect to robot via IP address slideout header."""
        return self.base.present_wrapper(self.connect_to_robot_via_IP_address_slideout_header, 2)

    link_learn_more_about_connecting_a_robot_manually: Element = Element(
        (By.ID, "ConnectIPAddressSupportPage"),
        "the link to connect to robot manually",
    )

    def get_link_learn_more_about_connecting_a_robot_manually(
        self,
    ) -> WebElement:
        """Get the link to connect to robot manually."""
        return self.base.present_wrapper(self.link_learn_more_about_connecting_a_robot_manually, 2)

    textbox_to_enter_the_ip: Element = Element(
        (By.ID, "ip"),
        "the textbox to enter the IP address",
    )

    def get_textbox_to_enter_the_ip(
        self,
    ) -> WebElement:
        """Get the textbox to enter the IP address."""
        return self.base.present_wrapper(self.textbox_to_enter_the_ip, 2)

    def click_add_ip_or_hostname(self) -> None:
        """Click on text box to add ip or hostname."""
        self.base.click(self.textbox_to_enter_the_ip)

    try_again_link: Element = Element(
        (By.ID, "AppSettings_Connection_Button"),
        "the try again link",
    )

    def get_try_again_link(
        self,
    ) -> WebElement:
        """Get the try again link."""
        return self.base.present_wrapper(self.try_again_link, 31)

    add_button: Element = Element(
        (By.XPATH, "//button[text()='Add']"),
        "the add button",
    )

    def get_add_button(
        self,
    ) -> WebElement:
        """Get the add button."""
        return self.base.present_wrapper(self.add_button, 2)

    def click_add_button(self) -> None:
        """Click on add button."""
        self.base.click(self.add_button)

    ip: Element = Element(
        (By.ID, "ip"),
        "Input hostname to the slideout.'",
    )

    def enter_hostname(self, hostname: str) -> None:
        """Enter hostname text."""
        element = self.base.clickable_wrapper(self.ip, 3)
        element.clear()
        element.send_keys(hostname)

    done_button: Element = Element(
        (By.XPATH, "//button[text()='Done']"),
        "the done button",
    )

    def get_done_button(
        self,
    ) -> WebElement:
        """Get the done button."""
        return self.base.present_wrapper(self.done_button, 2)

    def click_done_button(self) -> None:
        """Click on add button."""
        self.base.click(self.done_button)

    # Privacy Tab elements

    privacy_tab: Element = Element(
        (By.XPATH, '//a[contains(@href,"#/app-settings/privacy")]'),
        "privacy tab in App Settings",
    )

    def get_privacy_tab(self) -> WebElement:
        """Search for the privacy tab in app-settings."""
        return self.base.clickable_wrapper(self.privacy_tab, 5)

    def click_privacy_tab(self) -> None:
        """Click on the privacy tab in app-settings."""
        self.base.click(self.privacy_tab)

    robot_app_analytics: Element = Element(
        (By.XPATH, '//p[text()="Share Robot and App Analytics with Opentrons"]'),
        "the robot and app analytics with Opentrons",
    )

    def get_robot_app_analytics(self) -> WebElement:
        """Get the robot and app analytics with Opentrons."""
        return self.base.present_wrapper(self.robot_app_analytics, 2)

    robot_app_analytics_toggle: Element = Element(
        (By.ID, "PrivacySettings_analytics"),
        "the robot and app analytics with Opentrons toggle",
    )

    def get_robot_app_analytics_toggle(self) -> WebElement:
        """Get the robot and app analytics with Opentrons toggle."""
        return self.base.present_wrapper(self.robot_app_analytics_toggle, 2)

    def click_robot_app_analytics(self) -> None:
        """Click on the robot app analytics."""
        self.base.click(self.robot_app_analytics_toggle)

    # Advanced Tab elements

    advanced_tab: Element = Element(
        (By.XPATH, '//a[contains(@href,"#/app-settings/advanced")]'),
        "advanced tab in App Settings",
    )

    def get_advanced_tab(self) -> WebElement:
        """Search for the advanced tab in app-settings."""
        return self.base.clickable_wrapper(self.advanced_tab, 5)

    def click_advanced_tab(self) -> None:
        """Click on the advanced tab."""
        self.base.click(self.advanced_tab)

    update_channel: Element = Element(
        (By.ID, "AdvancedSettings_updatedChannel"),
        "the update channel",
    )

    def get_update_channel(self) -> WebElement:
        """Get the update channel on advanced tab."""
        return self.base.present_wrapper(self.update_channel, 2)

    update_channel_latest_stable: Element = Element(
        (By.NAME, "__UpdateChannel__"),
        "the update channel latest stable",
    )

    def get_update_channel_latest_stable(self) -> WebElement:
        """Get the update channel latest stable on advanced tab."""
        return self.base.present_wrapper(self.update_channel_latest_stable, 2)

    additional_custom_labware_source_folder: Element = Element(
        (By.ID, "AdvancedSettings_customLabware"),
        "the additional custom labware source folder on advanced tab",
    )

    def get_additional_custom_labware_source_folder(self) -> WebElement:
        """Get the additional custom labware source folder on advanced tab."""
        return self.base.present_wrapper(self.additional_custom_labware_source_folder, 2)

    change_labware_source_folder_button: Element = Element(
        (By.ID, "AdvancedSettings_changeLabwareSource"),
        "the change labware source folder on advanced tab",
    )

    def get_change_labware_source_folder_button(self) -> WebElement:
        """Get the change labware source folder on advanced tab."""
        return self.base.present_wrapper(self.change_labware_source_folder_button, 2)

    additional_source_folder: Element = Element(
        (By.ID, "AdvancedSettings_sourceFolderLink"),
        "the additional source folder on advanced tab",
    )

    def get_additional_source_folder(self) -> WebElement:
        """Get the additional source folder on advanced tab."""
        return self.base.present_wrapper(self.additional_source_folder, 2)

    tip_length_calibration_method: Element = Element(
        (By.ID, "AdvancedSettings_tipLengthCalibration"),
        "the tip length calibration on advanced tab",
    )

    def get_tip_length_calibration_method(self) -> WebElement:
        """Get the tip length calibration on advanced tab."""
        return self.base.present_wrapper(self.tip_length_calibration_method, 2)

    tip_calibration_block_to_calibrate: Element = Element(
        (By.XPATH, '//div[text()="Always use calibration block to calibrate"]'),
        "Always use calibration block to calibrate",
    )

    def get_tip_calibration_block_to_calibrate(self) -> WebElement:
        """Search for the Always use calibration block to calibrate."""
        return self.base.clickable_wrapper(self.tip_calibration_block_to_calibrate, 5)

    def click_tip_calibration_block_to_calibrate(self) -> None:
        """Click on Always use calibration block to calibrate option."""
        self.base.click(self.tip_calibration_block_to_calibrate)

    tip_calibration_trash_bin: Element = Element(
        (By.XPATH, '//div[text()="Always use trash bin to calibrate"]'),
        "Always use trash bin to calibrate",
    )

    def get_tip_calibration_trash_bin(self) -> WebElement:
        """Search for Always use trash bin to calibrate."""
        return self.base.clickable_wrapper(self.tip_calibration_trash_bin, 5)

    def click_tip_calibration_trash_bin(self) -> None:
        """Click on Always use trash bin to calibrate option."""
        self.base.click(self.tip_calibration_trash_bin)

    tip_calibration_prompt: Element = Element(
        (
            By.XPATH,
            '//div[text()="Always show the prompt to choose calibration block or trash bin"]',
        ),
        "Always show the prompt to choose calibration block or trash bin",
    )

    def get_tip_calibration_prompt_choose(self) -> WebElement:
        """Search for the Always show the prompt to choose calibration block or trash bin."""
        return self.base.clickable_wrapper(self.tip_calibration_prompt, 5)

    def click_tip_calibration_prompt_choose(self) -> None:
        """Click on the Always show the prompt to choose calibration block or trash bin."""
        self.base.click(self.tip_calibration_prompt)

    display_unavailable_robots: Element = Element(
        (By.ID, "AdvancedSettings_unavailableRobots"),
        "the unavailable robots on advanced tab",
    )

    def get_display_unavailable_robots_header(self) -> WebElement:
        """Display unavailable robots."""
        return self.base.present_wrapper(self.display_unavailable_robots, 2)

    display_unavailable_robots_toggle: Element = Element(
        (By.ID, "AdvancedSettings_unavailableRobotsToggleButton"),
        "the unavailable robots toggle on advanced tab",
    )

    def get_display_unavailable_robots_toggle(self) -> WebElement:
        """Display unavailable robots toggle."""
        return self.base.clickable_wrapper(self.display_unavailable_robots_toggle, 2)

    def click_unavailable_robot_toggle(self) -> None:
        """Click on the unavailable robot toggle."""
        self.base.click(self.display_unavailable_robots_toggle)

    clear_unavailable_robots_header: Element = Element(
        (By.ID, "AdvancedSettings_clearRobots"),
        "the clear unavailable robots on advanced tab",
    )

    def get_clear_unavailable_robots_header(self) -> WebElement:
        """Clear unavailable robots."""
        return self.base.present_wrapper(self.clear_unavailable_robots_header, 2)

    clear_unavailable_robots_list_button: Element = Element(
        (By.ID, "AdvancedSettings_clearUnavailableRobots"),
        "the clear unavailable robots toggle on advanced tab",
    )

    def get_clear_unavailable_robots_list_button(self) -> WebElement:
        """Clear unavailable robots toggle."""
        return self.base.present_wrapper(self.clear_unavailable_robots_list_button, 2)

    def click_clear_unavailable_robot_button(self) -> None:
        """Click on the clear unavailable robot button."""
        self.base.click(self.clear_unavailable_robots_list_button)

    enable_developer_tool_header: Element = Element(
        (By.ID, "AdvancedSettings_devTools"),
        "the Enable Developer Tools on advanced tab",
    )

    def get_enable_developer_tool_header(self) -> WebElement:
        """Enable Developer Tools."""
        return self.base.present_wrapper(self.enable_developer_tool_header, 2)

    enable_developer_tools_toggle: Element = Element(
        (By.ID, "AdvancedSettings_devTooltoggle"),
        "the Enable Developer Tools toggle on advanced tab",
    )

    def get_enable_developer_tools_toggle(self) -> WebElement:
        """Enable Developer Tools toggle."""
        return self.base.clickable_wrapper(self.enable_developer_tools_toggle, 2)

    def click_enable_developer_tools_toggle(self) -> None:
        """Click on the Enable Developer Tools toggle.

        This option may not be toggled to off in the mode in which we run these
        tests.  The click works but has no effect.
        """
        button = self.get_enable_developer_tools_toggle()
        actions = ActionChains(self.base.driver)
        actions.move_to_element(button).perform()
        self.base.click(self.enable_developer_tools_toggle)

    # Elements for Feature Flag

    feature_flag_tab: Element = Element(
        (By.XPATH, '//a[contains(@href,"#/app-settings/feature-flags")]'),
        "advanced tab in App Settings",
    )

    def get_feature_flag_tab(self) -> WebElement:
        """Search for the feature flag tab in app-settings."""
        return self.base.clickable_wrapper(self.feature_flag_tab, 3)

    def click_feature_flag_tab(self) -> None:
        """Click on the feature flag tab."""
        self.base.click(self.feature_flag_tab)

    release_notes_link: Element = Element(
        (By.ID, "GeneralSettings_GitHubLink"),
        "Link to release notes",
    )

    def get_release_notes_link(self) -> WebElement:
        """Get release notes link."""
        return self.base.present_wrapper(self.release_notes_link, 2)
