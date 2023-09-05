"""Test the Protocol Landing of the page."""
import os

import pytest
from automation.data.protocol import Protocol
from automation.data.protocols import Protocols
from automation.driver.drag_drop import drag_and_drop_file
from automation.menus.left_menu import LeftMenu
from automation.pages.labware_landing import LabwareLanding
from automation.pages.protocol_landing import ProtocolLanding
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver


def _what_protocols() -> list[(Protocol)]:
    """Use the environment variable to select which protocols are used in the test."""
    protocols: Protocols = Protocols()
    protocols_to_test: str = os.getenv("APP_ANALYSIS_TEST_PROTOCOLS", "upload_protocol")
    tests: list[(Protocol)] = []
    for protocol_name in [x.strip() for x in protocols_to_test.split(",")]:
        tests.append((getattr(protocols, protocol_name)))
    return tests


@pytest.mark.parametrize(
    "protocol",
    _what_protocols(),
)
def test_analyses(
    driver: WebDriver,
    console: Console,
    request: pytest.FixtureRequest,
    protocol: Protocol,
) -> None:
    """Analyze a protocol in the app and validate its details."""
    labware_landing: LabwareLanding = LabwareLanding(driver, console, request.node.nodeid)
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    protocol_landing: ProtocolLanding = ProtocolLanding(driver, console, request.node.nodeid)

    # Upload labware if any
    if protocol.custom_labware:
        for labware in protocol.labware_paths:
            left_menu.navigate("labware")
            labware_landing.click_import_button()
            assert labware_landing.get_import_custom_labware_definition_header().is_displayed()
            assert labware_landing.get_choose_file_button().is_displayed()
            console.print(
                f"uploading labware: {labware.resolve()}",
                style="white on blue",
            )
            drag_and_drop_file(labware_landing.get_drag_drop_file_button(), labware)
            if labware_landing.get_success_toast_message(
                filename=labware.name
            ) or labware_landing.get_duplicate_error_toast_message(filename=labware.name):
                console.print(
                    f"{labware.name} uploaded to app.",
                    style="white on blue",
                )
            else:
                raise AssertionError("No toast message that the labware was uploaded.")

    left_menu.base.click(left_menu.protocols)
    # Clean up any protocols that did not get deleted
    protocol_landing.delete_all_protocols()
    console.print(f"uploading protocol: {protocol.file_path.resolve()}", style="white on blue")
    drag_and_drop_file(
        protocol_landing.get_drag_drop_file_button(),
        protocol.file_path,
    )

    analysis_timeout: int = 61
    assert protocol_landing.wait_until_loading_data_gone(
        timeout_sec=analysis_timeout
    ), f"Analysis took more than {analysis_timeout} seconds."

    # look for analysis error if the protocol should have one
    if protocol.app_error:
        error_link = protocol_landing.get_error_details_safe()

        assert error_link is not None, "No analysis error but was expecting one."
        protocol_landing.base.click_webelement(error_link)
        error_details = protocol_landing.get_popout_error().text
        assert error_details == protocol.app_analysis_error
        protocol_landing.click_popout_close()
    else:
        error_link = protocol_landing.get_error_details_safe()

        if error_link is not None:
            protocol_landing.base.click_webelement(error_link)
            error_details = protocol_landing.get_popout_error().text
            raise AssertionError(f"Unexpected analysis error: {error_details}")

    # Verifying elements on Protocol Landing Page
    # todo fix next line needs to be safe and print name not found
    assert protocol_landing.get_deckMap_protocol_landing(protocol_name=protocol.protocol_name).is_displayed()
    assert (
        protocol_landing.get_protocol_name_text_protocol_landing(protocol_name=protocol.protocol_name)
        == protocol.protocol_name
    )

    # TODO validate robot

    # TODO verify modules

    # No cleanup, do at the beginning of the test.
