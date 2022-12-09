"""Test the Protocol Landing of the page."""
import os

import pytest
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver

from automation.data.protocol import Protocol
from automation.data.protocols import Protocols
from automation.driver.drag_drop import drag_and_drop_file
from automation.menus.left_menu import LeftMenu
from automation.pages.protocol_landing import ProtocolLanding


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
    """Analyze many protocols."""
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    left_menu.navigate("protocols")
    protocol_landing: ProtocolLanding = ProtocolLanding(
        driver, console, request.node.nodeid
    )
    console.print(
        f"uploading protocol: {protocol.file_path.resolve()}", style="white on blue"
    )
    drag_and_drop_file(
        protocol_landing.get_drag_drop_file_button(),
        protocol.file_path,
    )
    assert protocol_landing.wait_until_loading_data_gone()

    # look for error
    if protocol.app_error:
        error_link = protocol_landing.get_error_details_safe()

        # stop the test if analysis did not fail
        assert error_link is not None
        protocol_landing.base.click_webelement(error_link)
        error_details = protocol_landing.get_popout_error().text
        assert error_details == protocol.app_analysis_error
        protocol_landing.click_popout_close()
    else:
        # stop the test if analysis did fail
        assert protocol_landing.get_error_details_safe() is None

    # Verifying elements on Protocol Landing Page
    assert protocol_landing.get_import_button_protocol_landing().is_displayed()
    assert protocol_landing.get_deckMap_protocol_landing(
        protocol_name=protocol.protocol_name
    ).is_displayed()
    assert (
        protocol_landing.get_protocol_name_text_protocol_landing(
            protocol_name=protocol.protocol_name
        )
        == protocol.protocol_name
    )

    # TODO validate robot

    # TODO verify modules

    # delete the protocol so we may run the test again from an empty state of the protocols page
    protocol_landing.click_overflow_menu()
    protocol_landing.base.click_webelement(protocol_landing.get_delete_protocol())
    protocol_landing.base.click_webelement(
        protocol_landing.get_delete_protocol_confirm()
    )

    # verify delete
    protocol_landing.get_choose_file_button()
