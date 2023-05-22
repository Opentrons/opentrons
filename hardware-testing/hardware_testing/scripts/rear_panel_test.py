"""A script to test the rear panel board"""
import argparse
import asyncio

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
    get_all_pin_state,
    set_sync_pin
)

##START TEST PASSING CONDITIONS

#Pre-test conditions, nothing plugged in
PRE_TEST_CONDITIONS = RearPinState()
PRE_TEST_CONDITIONS.aux1_estop_det = False
PRE_TEST_CONDITIONS.aux2_estop_det = False
PRE_TEST_CONDITIONS.aux1_aux_det = False
PRE_TEST_CONDITIONS.aux2_aux_det = False
PRE_TEST_CONDITIONS.aux1_id_active = False
PRE_TEST_CONDITIONS.aux2_id_active = False
PRE_TEST_CONDITIONS.estop_active = False
PRE_TEST_CONDITIONS.door_open = True
PRE_TEST_CONDITIONS.sync_engaged = False

#Aux 1 only plugged in, sync active on tester
AUX_1_CONDITIONS = RearPinState()
AUX_1_CONDITIONS.aux1_estop_det = True
AUX_1_CONDITIONS.aux2_estop_det = False
AUX_1_CONDITIONS.aux1_aux_det = True
AUX_1_CONDITIONS.aux2_aux_det = False
AUX_1_CONDITIONS.aux1_id_active = True
AUX_1_CONDITIONS.aux2_id_active = False
AUX_1_CONDITIONS.estop_active = False
AUX_1_CONDITIONS.door_open = False
AUX_1_CONDITIONS.sync_engaged = True

#Aux 2 only plugged in, sync active on tester
AUX_2_CONDITIONS = RearPinState()
AUX_2_CONDITIONS.aux1_estop_det = False
AUX_2_CONDITIONS.aux2_estop_det = True
AUX_2_CONDITIONS.aux1_aux_det = False
AUX_2_CONDITIONS.aux2_aux_det = True
AUX_2_CONDITIONS.aux1_id_active = False
AUX_2_CONDITIONS.aux2_id_active = True
AUX_2_CONDITIONS.estop_active = False
AUX_2_CONDITIONS.door_open = False
AUX_2_CONDITIONS.sync_engaged = True

#Aux 1 and 2 plugged in, sync NOT active on tester
POST_PLUG_CONDITIONS = RearPinState()
POST_PLUG_CONDITIONS.aux1_estop_det = True
POST_PLUG_CONDITIONS.aux2_estop_det = True
POST_PLUG_CONDITIONS.aux1_aux_det = True
POST_PLUG_CONDITIONS.aux2_aux_det = True
POST_PLUG_CONDITIONS.aux1_id_active = False
POST_PLUG_CONDITIONS.aux2_id_active = False
POST_PLUG_CONDITIONS.estop_active = False
POST_PLUG_CONDITIONS.door_open = True
POST_PLUG_CONDITIONS.sync_engaged = False

#Aux 1 and 2 plugged in, ESTOP pressed, sync NOT active on tester
ESTOP_CONDITIONS = RearPinState()
ESTOP_CONDITIONS.aux1_estop_det = True
ESTOP_CONDITIONS.aux2_estop_det = True
ESTOP_CONDITIONS.aux1_aux_det = True
ESTOP_CONDITIONS.aux2_aux_det = True
ESTOP_CONDITIONS.aux1_id_active = False
ESTOP_CONDITIONS.aux2_id_active = False
ESTOP_CONDITIONS.estop_active = True
ESTOP_CONDITIONS.door_open = True
ESTOP_CONDITIONS.sync_engaged = False

#Aux 1 and 2 not plugged in, door closed
DOOR_CONDITIONS = RearPinState()
DOOR_CONDITIONS.aux1_estop_det = False
DOOR_CONDITIONS.aux2_estop_det = False
DOOR_CONDITIONS.aux1_aux_det = False
DOOR_CONDITIONS.aux2_aux_det = False
DOOR_CONDITIONS.aux1_id_active = False
DOOR_CONDITIONS.aux2_id_active = False
DOOR_CONDITIONS.estop_active = False
DOOR_CONDITIONS.door_open = False
DOOR_CONDITIONS.sync_engaged = False

##END TEST PASSING CONDITIONS

async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    async with usb_driver() as driver:
        usb_messenger = build_rear_panel_messenger(driver)
        usb_messenger.start()



        #request all states from rp
        #check states match PRE_TEST_CONDITIONS
        print("TEST - UNPLUGGED STATE")
        await set_sync_pin(0, usb_messenger)
        result = await get_all_pin_state(usb_messenger)
        print(result)
        if (result == PRE_TEST_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")


        #instruct operator to plug in tester
        #start with aux port 1
        print()
        print("TEST - AUX 1")
        input("PLUG IN AUX PORT 1 RIGHT, PRESS ENTER WHEN COMPLETE")
        #set the sync pin so the tester can toggle the DOOR_SW and aux1_id
        #this must be done with only the aux 1 port plugged since the door sw
        #is shared between aux1 and aux 2
        await set_sync_pin(1, usb_messenger)
        result = await get_all_pin_state(usb_messenger)
        print(result)
        print("AUX 1 SIGNALS: ")
        if (result == AUX_1_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")

        #test the default plugged state after plugging in both aux 1 and 2
        print()
        print("TEST - PLUGGED STATE")
        input("PLUG IN AUX PORT 2 LEFT, PRESS ENTER WHEN COMPLETE")
        await set_sync_pin(0, usb_messenger)
        result = await get_all_pin_state(usb_messenger)
        print(result)
        if (result == POST_PLUG_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")

        # test E-Stop
        # make robot move, instruct operator to e-stop
        # do both buttons
        # request RP e-stop state, check it active
        # ask operator if E-stop LED is lit
        print()
        print("TEST - ESTOP 1")
        await set_sync_pin(0, usb_messenger)
        result = await get_all_pin_state(usb_messenger)
        input("PRESS ESTOP 1")
        result = await get_all_pin_state(usb_messenger)

        print(result)
        if (result == ESTOP_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")
        input("RELEASE ESTOP 1")

        print()
        print("TEST - ESTOP 2")
        await set_sync_pin(0, usb_messenger)
        result = await get_all_pin_state(usb_messenger)
        input("PRESS ESTOP 2")
        result = await get_all_pin_state(usb_messenger)

        print(result)
        if (result == ESTOP_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")
        input("RELEASE ESTOP 2")


        #test CAN

        print("TEST - AUX 2")
        input("UNPLUG AUX PORT 1 RIGHT, PRESS ENTER WHEN COMPLETE")
        #set the sync pin so the tester can toggle the DOOR_SW and aux1_id
        #this must be done with only the aux 1 port plugged since the door sw
        #is shared between aux1 and aux 2
        await set_sync_pin(1, usb_messenger)
        result = await get_all_pin_state(usb_messenger)
        print(result)
        print("AUX 2 SIGNALS: ")
        if (result == AUX_2_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")

        await set_sync_pin(0, usb_messenger)

        input("UNPLUG AUX PORT 2 LEFT, PRESS ENTER WHEN COMPLETE")


        print("TEST - DOOR")
        input("CLOSE DOOR")
        await set_sync_pin(0, usb_messenger)
        door_open_result = await get_door_state(usb_messenger)
        if(door_open_result == True):
            print("~~~ DOOR OPEN ~~~")
        else:
            print("~~~ DOOR CLOSED ~~~")
        result = await get_all_pin_state(usb_messenger)
        print(result)
        print("DOOR TEST: ")
        if (result == DOOR_CONDITIONS):
            print("PASS")
        else:
            print("FAIL")

        #LEDs
        print("TEST - LEDS")
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

        #check eeprom



def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="Rear Panel testing.")

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
