"""A script to test the rear panel board"""
import argparse
import asyncio
from hardware_testing.opentrons_api.rear_panel_helpers import RearPanelController

from opentrons_hardware.drivers.binary_usb.build import (
    build_rear_panel_messenger,
    usb_driver
)
from opentrons_hardware.hardware_control.rear_panel_settings import (
    get_door_state,
    set_deck_light,
    get_deck_light_state
)

##START TEST PASSING CONDITIONS
PRE_TEST_CONDITIONS = {"ESTOP_DETECT_1": 0,
                   "ESTOP_DETECT_2": 0,
                   "ESTOP": 1,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 1,
                   "DOOR_SW": 1,
                   "SYNC": 0,
                   "AUX_PRES_1": 1,
                   "AUX_PRES_2": 1}

POST_PLUG_CONDITIONS = {"ESTOP_DETECT_1": 1,
                   "ESTOP_DETECT_2": 1,
                   "ESTOP": 1,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 1,
                   "DOOR_SW": 1,
                   "SYNC": 0,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}

ESTOP_CONDITIONS = {"ESTOP_DETECT_1": 1,
                   "ESTOP_DETECT_2": 1,
                   "ESTOP": 0,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 1,
                   "DOOR_SW": 1,
                   "SYNC": 0,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}

AUX_ID_1_CONDITIONS = {"ESTOP_DETECT_1": 1,
                   "ESTOP_DETECT_2": 1,
                   "ESTOP": 0,
                   "AUX_ID_1": 1,
                   "AUX_ID_2": 1,
                   "DOOR_SW": 1,
                   "SYNC": 1,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}

AUX_ID_2_CONDITIONS = {"ESTOP_DETECT_1": 1,
                   "ESTOP_DETECT_2": 1,
                   "ESTOP": 0,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 0,
                   "DOOR_SW": 1,
                   "SYNC": 1,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}

DOOR_SW_CONDITIONS = {"ESTOP_DETECT_1": 1,
                   "ESTOP_DETECT_2": 1,
                   "ESTOP": 0,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 0,
                   "DOOR_SW": 0,
                   "SYNC": 1,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}

##END TEST PASSING CONDITIONS

pre_test = {"ESTOP_DETECT_1": 0,
                   "ESTOP_DETECT_2": 0,
                   "ESTOP": 0,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 0,
                   "DOOR_SW": 0,
                   "SYNC": 0,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}



async def get_all_states(usb_messenger):
    return 1

async def check_all_states(usb_messenger):
    return 1

async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    async with usb_driver() as driver:
        usb_messenger = build_rear_panel_messenger(driver)
        usb_messenger.start()
        door_test_result = await get_door_state(usb_messenger)
        print(door_test_result)

        await set_deck_light(0, usb_messenger)
        await usb_messenger.stop()

def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="Rear Panel testing.")

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
