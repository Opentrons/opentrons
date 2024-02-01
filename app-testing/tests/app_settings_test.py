"""Test the initial state the application with various setups."""

import pytest
from automation.menus.left_menu import LeftMenu
from automation.pages.app_settings import AppSettings
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver


@pytest.mark.skip("Need to fix.")
def test_app_settings(
    driver: WebDriver,
    console: Console,
    request: pytest.FixtureRequest,
) -> None:
    """Validate most of the app settings are present and that some may be toggled or selected."""
    # Instantiate the page object for the App settings.
    app_settings: AppSettings = AppSettings(driver, console, request.node.nodeid)
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)

    # General tab verification
    left_menu.navigate("app-settings")
    assert app_settings.get_app_settings_header().text == "App Settings"

    assert app_settings.get_connect_robot_via_IP_header().is_displayed()
    assert app_settings.get_connect_to_robot_via_IP_address_button().is_displayed()
    app_settings.click_connect_to_robot_via_IP_address_button()
    assert app_settings.get_connect_to_robot_via_IP_address_slideout_header().is_displayed()
    assert app_settings.get_link_learn_more_about_connecting_a_robot_manually().is_displayed()
    assert (
        app_settings.get_link_learn_more_about_connecting_a_robot_manually().get_attribute("href")
        == "https://support.opentrons.com/s/article/Manually-adding-a-robot-s-IP-address"
    )
    assert app_settings.get_textbox_to_enter_the_ip().is_displayed()
    app_settings.click_add_ip_or_hostname()
    assert app_settings.get_try_again_link().is_displayed()
    app_settings.enter_hostname("localhost")
    assert app_settings.get_add_button().is_displayed()
    app_settings.click_add_button()
    assert app_settings.get_done_button().is_displayed()
    app_settings.click_done_button()

    assert app_settings.get_app_software_version_text().text == "App Software Version"
    assert (
        app_settings.get_release_notes_link().get_attribute("href")
        == "https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md"
    )
    assert app_settings.get_app_software_version_value().is_displayed()

    assert app_settings.get_link_restore_previous_version().is_displayed()
    app_settings.click_link_restore_previous_version()
    assert app_settings.get_how_to_restore_software_version_modal().is_displayed()
    assert app_settings.get_learn_more_about_uninstalling_opentrons_app().is_displayed()
    assert (
        app_settings.get_learn_more_about_uninstalling_opentrons_app().get_attribute("href")
        == "https://support.opentrons.com/s/article/Uninstall-the-Opentrons-App"
    )
    assert app_settings.get_link_to_previous_releases().is_displayed()
    assert app_settings.get_link_to_previous_releases().get_attribute("href") == "https://github.com/Opentrons/opentrons/releases"
    app_settings.click_close_previous_software_modal()

    assert app_settings.get_link_app_robot_sync().is_displayed()
    assert (
        app_settings.get_link_app_robot_sync().get_attribute("href")
        == "https://support.opentrons.com/s/article/Get-started-Update-your-OT-2"
    )
    assert app_settings.get_software_update_alert_header().is_displayed()
    assert app_settings.get_software_update_alert_toggle().is_displayed()

    # can't do this, it makes the alert appear
    # app_settings.click_software_update_alert_toggle()

    # Privacy Tab verification
    app_settings.click_privacy_tab()
    assert app_settings.get_robot_app_analytics().is_displayed()
    assert app_settings.get_robot_app_analytics_toggle().is_displayed()
    # app_settings.click_robot_app_analytics()

    # Advanced Tab Verification
    app_settings.click_advanced_tab()
    assert app_settings.get_advanced_tab().is_displayed()
    assert app_settings.get_update_channel().is_displayed()
    assert app_settings.get_update_channel_latest_stable().get_attribute("value") == "alpha"
    assert app_settings.get_additional_custom_labware_source_folder().is_displayed()
    assert app_settings.get_change_labware_source_folder_button().is_displayed()
    assert app_settings.get_additional_source_folder().is_displayed()

    assert app_settings.get_tip_length_calibration_method().is_displayed()
    assert app_settings.get_tip_calibration_block_to_calibrate().is_displayed()
    app_settings.click_tip_calibration_block_to_calibrate()
    assert app_settings.get_tip_calibration_trash_bin().is_displayed()
    app_settings.click_tip_calibration_trash_bin()
    assert app_settings.get_tip_calibration_prompt_choose().is_displayed()
    app_settings.click_tip_calibration_prompt_choose()

    assert app_settings.get_display_unavailable_robots_header().is_displayed()
    assert app_settings.get_display_unavailable_robots_toggle().is_displayed()
    app_settings.click_unavailable_robot_toggle()

    assert app_settings.get_clear_unavailable_robots_header().is_displayed()
    assert app_settings.get_clear_unavailable_robots_list_button().is_displayed()
    app_settings.click_clear_unavailable_robot_button()

    assert app_settings.get_enable_developer_tool_header().is_displayed()
    assert app_settings.get_enable_developer_tools_toggle().is_displayed()
    # not available when we run the app through chromedriver like this
    # app_settings.click_enable_developer_tools_toggle()
    # app_settings.click_feature_flag_tab()
    # assert app_settings.get_feature_flag_tab().is_displayed()
