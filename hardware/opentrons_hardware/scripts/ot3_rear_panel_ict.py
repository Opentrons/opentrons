
import asyncio
import argparse

from opentrons_hardware.drivers.binary_usb import build

from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    SetDeckLightRequest,
    StartLightAction,
    AddLightActionRequest,
    ClearLightActionStagingQueue,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    LightTransitionType,
    LightTransitionTypeField,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt16Field,
    UInt32Field,
    UInt64Field,
    UInt8Field,
)


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--set-deck-light', action='store_true')
    parser.add_argument('--disable-deck-light', action='store_true')
    parser.add_argument('--set-status-bar', action='store_true')
    parser.add_argument('--disable-status-bar', action='store_true')

    args = parser.parse_args()

    driver = build.build_rear_panel_messenger(driver=await build.build_rear_panel_driver())
    driver.start()
    if args.set_deck_light:
        await driver.send(message=SetDeckLightRequest(
            setting=UInt8Field(1)
        ))
    if args.disable_deck_light:
        await driver.send(message=SetDeckLightRequest(
            setting=UInt8Field(0)
        ))
    if args.set_status_bar:
        await driver.send(message=ClearLightActionStagingQueue())
        await driver.send(message=AddLightActionRequest(
            transition_time=UInt16Field(100),
            transition_type=LightTransitionTypeField(LightTransitionType.instant),
            red=UInt8Field(255),
            green=UInt8Field(255),
            blue=UInt8Field(255),
            white=UInt8Field(255),
        ))
        await driver.send(message=StartLightAction())

    if args.disable_status_bar:
        await driver.send(message=ClearLightActionStagingQueue())
        await driver.send(message=AddLightActionRequest(
            transition_time=UInt16Field(100),
            transition_type=LightTransitionTypeField(LightTransitionType.instant),
            red=UInt8Field(0),
            green=UInt8Field(0),
            blue=UInt8Field(0),
            white=UInt8Field(0),
        ))
        await driver.send(message=StartLightAction())
    

if __name__ == '__main__':
    asyncio.run(main())