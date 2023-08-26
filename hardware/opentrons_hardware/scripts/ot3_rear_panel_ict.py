
import asyncio
import argparse

from opentrons_hardware.drivers.binary_usb import build

from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    SetDeckLightRequest,
    StartLightAction,
    AddLightActionRequest,
    ClearLightActionStagingQueue,
    WriteEEPromRequest,
    ReadEEPromRequest,
    ReadEEPromResponse,
    DoorSwitchStateRequest,
    DoorSwitchStateInfo,
    AuxPresentDetectionChange,
    AuxPresentRequest,
    AuxIDRequest,
    AuxIDResponse,
    EstopButtonPresentRequest,
    EstopButtonDetectionChange,
    EstopStateChange,
    Ack,
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
from opentrons_hardware.firmware_bindings.messages.fields import EepromDataField
from typing import cast, Optional
from opentrons_hardware.hardware_control.rear_panel_settings import (
    write_eeprom,
    read_eeprom,
    get_door_state,
)
from dataclasses import dataclass
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
@dataclass
class RearPinState:
    """Used during testing to query all of the pin states of the rear panel."""

    aux1_estop_det: bool = False
    aux2_estop_det: bool = False
    aux1_aux_det: bool = False
    aux2_aux_det: bool = False
    aux1_id_active: bool = False
    aux2_id_active: bool = False
    etop_active: bool = False
    door_open: bool = False

async def get_estop_change(messenger: Optional[BinaryMessenger]) -> RearPinState:
    current_state = RearPinState()
    if messenger is None:
        return current_state
    response = await messenger.send_and_receive(
        message=EstopButtonPresentRequest(),
        response_type=EstopStateChange,
    )
    if response is not None:
        current_state.etop_active = bool(
            cast(EstopStateChange, response).engaged.value
        )
        print(f'GETESTOPSTATUS={current_state.etop_active }')
        current_state.aux2_estop_det = bool(
            cast(EstopStateChange, response).engaged.value
        )
        print(f'GETESTOPSTATUS={current_state.etop_active}')


async def get_all_pin(messenger: Optional[BinaryMessenger],args: argparse.Namespace) -> RearPinState:
    """Returns the state of all IO GPIO pins on the rear panel."""
    current_state = RearPinState()
    if messenger is None:
        return current_state
    # estop port detection pins
    response = await messenger.send_and_receive(
        message=EstopButtonPresentRequest(),
        response_type=EstopButtonDetectionChange,
    )
    if response is not None:
        current_state.aux1_estop_det = bool(
            cast(EstopButtonDetectionChange, response).aux1_detected.value
        )
        
        current_state.aux2_estop_det = bool(
            cast(EstopButtonDetectionChange, response).aux2_detected.value
        )

        if args.getpintype =="aux1estop":

            print(f'AUX1ESTOPDET={current_state.aux1_estop_det}')
        elif args.getpintype =="aux2estop":
            print(f'AUX2ESTOPDET={current_state.aux2_estop_det}')
    else:
        if args.getpintype =="aux1estop":

            print(f'AUX1ESTOPDET=fail')
        elif args.getpintype =="aux2estop":
            print(f'AUX2ESTOPDET=fail')


    # Aux port detection pins
    response = await messenger.send_and_receive(
        message=AuxPresentRequest(),
        response_type=AuxPresentDetectionChange,
    )
    if response is not None:
        current_state.aux1_aux_det = bool(
            cast(AuxPresentDetectionChange, response).aux1_detected.value
        )
        
        current_state.aux2_aux_det = bool(
            cast(AuxPresentDetectionChange, response).aux2_detected.value
        )
        if args.getpintype =="aux1auxdet":
            print(f'AUX1AUXDET={current_state.aux1_aux_det}')
        elif args.getpintype =="aux2auxdet":
            print(f'AUX2AUXDET={current_state.aux2_aux_det}')
    else:
        if args.getpintype =="aux1auxdet":

            print(f'AUX1AUXDET=fail')
        elif args.getpintype =="aux2auxdet":
            print(f'AUX2AUXDET=fail')

    # Aux id pins
    response = await messenger.send_and_receive(
        message=AuxIDRequest(),
        response_type=AuxIDResponse,
    )
    if response is not None:
        current_state.aux1_id_active = bool(
            cast(AuxIDResponse, response).aux1_id_state.value
        )
        
        current_state.aux2_id_active = bool(
            cast(AuxIDResponse, response).aux2_id_state.value
        )
        
        if args.getpintype =="aux1iddet":
            print(f'AUX1IDDET={current_state.aux1_id_active}')
        elif args.getpintype =="aux2iddet":
            print(f'AUX2IDDET={current_state.aux2_id_active}')
    else:
        if args.getpintype =="aux1iddet":
            print(f'AUX1IDDET=fail')
        elif args.getpintype =="aux2iddet":
            print(f'AUX2IDDET=fail')

    # TODO add estop port detection request
    """
    #estop active pin
    response = await messenger.send_and_receive(
        message=EStopActiveRequeset(),
        response_type=EstopStateChange,
    )
    if response is not None:
        current_state.etop_active = bool(cast(EstopStateChange, response).engaged.value)
    """

async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--set-deck-light', action='store_true')
    parser.add_argument('--disable-deck-light', action='store_true')
    parser.add_argument('--set-status-bar', action='store_true')
    parser.add_argument('--disable-status-bar', action='store_true')
    parser.add_argument('--write-eeprom', action='store_true')
    parser.add_argument('--read-eeprom', action='store_true')
    parser.add_argument('--check-door-status', action='store_true')
    parser.add_argument('--check-all-pin',action='store_true')
    parser.add_argument('--get-estop-status',action='store_true')
    parser.add_argument(
        "--getpintype", type=str, help="iddet,auxdet,estopdet", default="iddet"
    )
    args = parser.parse_args()

    driver = build.build_rear_panel_messenger(driver=await build.build_rear_panel_driver())
    driver.start()
    if args.set_deck_light:
        try:
            await driver.send(message=SetDeckLightRequest(
                length=UInt16Field(1),
                setting=UInt8Field(1)
            ))
            print("SETDECKLIGHT=Pass")
        except:
            print("SETDECKLIGHT=Fail")
    if args.disable_deck_light:
        try:
            await driver.send(message=SetDeckLightRequest(
                length=UInt16Field(1),
                setting=UInt8Field(0)
            ))
            print("DISABLEDECKLIGHT=Pass")
        except:
            print("DISABLEDECKLIGHT=Fail")

    if args.set_status_bar:
        try:
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
            print("SETSTATUSBAR=Pass")
        except:
            print("SETSTATUSBAR=Fail")
    if args.disable_status_bar:
        try:
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
            print("DISABLESTATUSBAR=Pass")
        except:
            print("DISABLESTATUSBAR=Fail")
    if args.write_eeprom:
        response = await driver.send(message=WriteEEPromRequest(
            length=UInt16Field(12),
            data_address=UInt16Field(0),
            data_length=UInt16Field(8),
            data=EepromDataField('aaaaaaaa'.encode('utf-8')),
        ))
        if response is None:
            print(f'WRITEEPPROM=Fail')
        else:
            print(f'WRITEEPPROM={response}')   

    if args.read_eeprom:
        response = await read_eeprom(
            driver,
            #length = 4,
            data_addr=0,
            data_len=8,
        )
        if response is None:
            print(f'READEPPOM=Fail')
        else:
            print(f'READEPPROM={response}')

    if args.check_door_status:
        response = await get_door_state(driver)
        if response is None:
            print(f'CHECKDOORSTATUS=Fail')
        else:
            print(f'CHECKDOORSTATUS={response}')   # True, open, False, close

    if args.check_all_pin:
        response = await get_all_pin(driver,args)
        
    
    if args.get_estop_status:
        response = await get_estop_change(driver)
        if response is None:
            print(f'GETESTOPSTATUS=Fail')

if __name__ == '__main__':
    asyncio.run(main())