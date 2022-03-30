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
            (By.XPATH, '//p[text()="How to Restore a Previous Software Version"]'),
            "How to Restore a Previous Software Version modal",
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
