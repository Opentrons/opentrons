"""A script to test the rear panel board"""
import argparse
import asyncio
from dataclasses import dataclass


from opentrons_hardware.drivers.binary_usb.build import (
    build_rear_panel_messenger,
    usb_driver
)
from opentrons_hardware.hardware_control.rear_panel_settings import (
    RearPinState,
    get_door_state,
    set_deck_light,
    get_deck_light_state,
    set_ui_color,
    get_all_pin_state
)

from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    DoorSwitchStateRequest,
    DoorSwitchStateInfo,
    AuxPresentDetectionChange,
    AuxPresentRequest,
    AuxIDRequest,
    AuxIDResponse,
    SetDeckLightRequest,
    GetDeckLightRequest,
    GetDeckLightResponse,
    EstopButtonPresentRequest,
    EstopButtonDetectionChange,
    Ack
)

##START TEST PASSING CONDITIONS
PRE_TEST_CONDITIONS_d = {"ESTOP_DETECT_1": 0,
                   "ESTOP_DETECT_2": 0,
                   "ESTOP": 1,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 1,
                   "DOOR_SW": 1,
                   "SYNC": 0,
                   "AUX_PRES_1": 1,
                   "AUX_PRES_2": 1}

#needs a sync state
PRE_TEST_CONDITIONS = RearPinState()
PRE_TEST_CONDITIONS.aux1_estop_det = False
PRE_TEST_CONDITIONS.aux2_estop_det = False
PRE_TEST_CONDITIONS.aux1_aux_det = False
PRE_TEST_CONDITIONS.aux2_aux_det = False
PRE_TEST_CONDITIONS.aux1_id_active = False
PRE_TEST_CONDITIONS.aux2_id_active = True
PRE_TEST_CONDITIONS.etop_active = False
PRE_TEST_CONDITIONS.door_open = True

AUX_1_CONDITIONS = RearPinState()
AUX_1_CONDITIONS.aux1_estop_det = True
AUX_1_CONDITIONS.aux2_estop_det = False
AUX_1_CONDITIONS.aux1_aux_det = False
AUX_1_CONDITIONS.aux2_aux_det = True
AUX_1_CONDITIONS.aux1_id_active = False
AUX_1_CONDITIONS.aux2_id_active = False
AUX_1_CONDITIONS.etop_active = False
AUX_1_CONDITIONS.door_open = True

POST_PLUG_CONDITIONS_d = {"ESTOP_DETECT_1": 1,
                   "ESTOP_DETECT_2": 1,
                   "ESTOP": 1,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 1,
                   "DOOR_SW": 1,
                   "SYNC": 0,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}

POST_PLUG_CONDITIONS = RearPinState()
POST_PLUG_CONDITIONS.aux1_estop_det = True
POST_PLUG_CONDITIONS.aux2_estop_det = True
POST_PLUG_CONDITIONS.aux1_aux_det = False
POST_PLUG_CONDITIONS.aux2_aux_det = True
POST_PLUG_CONDITIONS.aux1_id_active = False
POST_PLUG_CONDITIONS.aux2_id_active = False
POST_PLUG_CONDITIONS.etop_active = False
POST_PLUG_CONDITIONS.door_open = True


ESTOP_CONDITIONS_d = {"ESTOP_DETECT_1": 1,
                   "ESTOP_DETECT_2": 1,
                   "ESTOP": 0,
                   "AUX_ID_1": 0,
                   "AUX_ID_2": 1,
                   "DOOR_SW": 1,
                   "SYNC": 0,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}

ESTOP_CONDITIONS = RearPinState()
ESTOP_CONDITIONS.aux1_estop_det = True
ESTOP_CONDITIONS.aux2_estop_det = True
ESTOP_CONDITIONS.aux1_aux_det = False
ESTOP_CONDITIONS.aux2_aux_det = True
ESTOP_CONDITIONS.aux1_id_active = False
ESTOP_CONDITIONS.aux2_id_active = False
ESTOP_CONDITIONS.etop_active = True
ESTOP_CONDITIONS.door_open = True

SYNC_TEST_CONDITIONS_d = {"ESTOP_DETECT_1": 1,
                   "ESTOP_DETECT_2": 1,
                   "ESTOP": 0,
                   "AUX_ID_1": 1,
                   "AUX_ID_2": 0,
                   "DOOR_SW": 0,
                   "SYNC": 1,
                   "AUX_PRES_1": 0,
                   "AUX_PRES_2": 0}

SYNC_CONDITIONS = RearPinState()
SYNC_CONDITIONS.aux1_estop_det = True
SYNC_CONDITIONS.aux2_estop_det = True
SYNC_CONDITIONS.aux1_aux_det = False
SYNC_CONDITIONS.aux2_aux_det = True
SYNC_CONDITIONS.aux1_id_active = False
SYNC_CONDITIONS.aux2_id_active = False
SYNC_CONDITIONS.etop_active = False
SYNC_CONDITIONS.door_open = True

##END TEST PASSING CONDITIONS



async def get_all_states(usb_messenger):
    state = await get_all_pin_state(usb_messenger)
    print(str(state))
    return 1

async def check_all_states(usb_messenger):
    return 1

async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    async with usb_driver() as driver:
        usb_messenger = build_rear_panel_messenger(driver)
        usb_messenger.start()


        #request all states from rp
        #check states match PRE_TEST_CONDITIONS
        Print("TEST - UNPLUGGED STATE")
        result = await get_all_pin_state(usb_messenger)
        print(result)
        if (result == PRE_TEST_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")

        print()

        #instruct operator to plug in tester
        #start with aux port 1
        Print("TEST - AUX 1")
        input("PLUG IN AUX PORT 1 LEFT, PRESS ENTER WHEN COMPLETE")
        #set the sync pin so the tester can toggle the DOOR_SW and aux1_id
        #this must be done with only the aux 1 port plugged since the door sw
        #is shared between aux1 and aux 2
        await set_sync_pin(1, usb_messenger)
        result = await get_all_pin_state(usb_messenger)
        print(result)
        print("POST PLUG COMPARE: ")
        if (result == AUX_1_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")

        await set_sync_pin(0, usb_messenger)

        Print("TEST - AUX 2")
        input("PLUG IN AUX PORT 2 RIGHT, PRESS ENTER WHEN COMPLETE")


        response = await usb_messenger.send_and_receive(
        message=EstopButtonPresentRequest(),
        response_type=EstopButtonDetectionChange,
        )
        print(response)
        # if response is not None:
        #     current_state.aux1_estop_det = bool(
        #         cast(EstopButtonDetectionChange, response).aux1_detected.value
        #     )
        #     current_state.aux2_estop_det = bool(
        #         cast(EstopButtonDetectionChange, response).aux2_detected.value
        #     )

        #test E-Stop
        #make robot move, instruct operator to e-stop
        #do both buttons
        #request RP e-stop state, check it active
        #ask operator if E-stop LED is lit

        #test CAN

        #test AUX ID + Door SW
        #request RP nSYNC line high
        #check states against SYNC_TEST_CONDITIONS
        #AUX_IDs, DOOR_SW, and SYNC should have state changed
        await get_all_pin_state(usb_messenger)

        input("UNPLUG IN AUX PORT 1")


        input("door open")
        door_test_result = await get_door_state(usb_messenger)
        print(door_test_result)
        input("door closed")
        door_test_result = await get_door_state(usb_messenger)
        print(door_test_result)

        #LEDs
        input("turn deck light off")
        await set_deck_light(0, usb_messenger)
        input("turn deck light on")
        await set_deck_light(1, usb_messenger)
        input("set ui red")
        await set_ui_color(255,0,0,0, usb_messenger)
        input("set ui blue")
        await set_ui_color(0,255,0,0, usb_messenger)
        input("set ui green")
        await set_ui_color(0,0,255,0, usb_messenger)
        input("set ui white")
        await set_ui_color(0,0,0,255, usb_messenger)
        input("print state")
        await get_all_states(usb_messenger)
        input("done")

        #check eeprom



def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="Rear Panel testing.")

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
