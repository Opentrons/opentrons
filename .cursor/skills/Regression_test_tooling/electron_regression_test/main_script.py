import bootstrap  # noqa: F401

import Open_app
from App_layout.app_tests.devices_test import DevicesCardTest
from App_layout.app_tests.left_panel_nav import LeftPanelNav
from setup_usb_or_wifi import DEFAULT_ROBOT_IP, connect_robot

PROTOCOL_NAME = "Flex Smoke Test - v2.29 - No LLD/meniscus"
ROBOT_NAME = "QA1Potato"
IP_address = DEFAULT_ROBOT_IP


def main():
    # Connect to robot before the app grabs the USB port
    robot = connect_robot(default_ip=IP_address)
    if robot.over_usb:
        print("Robot is connected over usb")
        connector = robot.usb_port
    else:
        print("Robot is connected over wifi")
        connector = robot.ip

    print(f"Robot connector: {connector}")
    Open_app.init()
    test_left_panel_nav()


def test_left_panel_nav():
    if Open_app.page is None:
        raise RuntimeError("App not launched. Call main() or Open_app.init() first.")

    left_panel_nav = LeftPanelNav(
        Open_app.page,
        protocol_name=PROTOCOL_NAME,
        robot_name=ROBOT_NAME,
    )
    left_panel_nav.test_all()


def test_devices_cards():
    if Open_app.page is None:
        raise RuntimeError("App not launched. Call main() or Open_app.init() first.")

    devices_card_test = DevicesCardTest(Open_app.page, robot_name=ROBOT_NAME)
    devices_card_test.test_all()


if __name__ == "__main__":
    main()
    # Uncomment to run device card exercises after left-panel navigation:
    # test_devices_cards()
