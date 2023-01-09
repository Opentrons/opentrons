"""Test the Protocol Landing of the page."""
import os

import pytest
from automation.data.protocol import Protocol
from automation.data.protocols import Protocols
from automation.driver.drag_drop import drag_and_drop_file
from automation.menus.left_menu import LeftMenu
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
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    left_menu.base.click(left_menu.protocols)

    protocol_landing: ProtocolLanding = ProtocolLanding(driver, console, request.node.nodeid)
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
        assert protocol_landing.get_error_details_safe() is None, "Unexpected analysis error."

    # Verifying elements on Protocol Landing Page
    assert protocol_landing.get_deckMap_protocol_landing(protocol_name=protocol.protocol_name).is_displayed()
    assert (
        protocol_landing.get_protocol_name_text_protocol_landing(protocol_name=protocol.protocol_name)
        == protocol.protocol_name
    )

    # TODO validate robot

    # TODO verify modules

    # No cleanup, do at the beginning of the test.
