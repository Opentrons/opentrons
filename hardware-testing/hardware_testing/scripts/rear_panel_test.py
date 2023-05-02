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
