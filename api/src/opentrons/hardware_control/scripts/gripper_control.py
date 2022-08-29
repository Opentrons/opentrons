import sys
import datetime

from logging.config import dictConfig
from typing import Dict

sys.path.append("/opt/opentrons-robot-server")

from opentrons.hardware_control.thread_manager import ThreadManager  # noqa: E402
from opentrons.hardware_control.ot3api import OT3API  # noqa: E402
from opentrons.hardware_control.types import OT3Axis, OT3Mount  # noqa: E402
from opentrons.hardware_control.protocols import HardwareControlAPI  # noqa: E402
from opentrons.types import Point  # noqa: E402
from opentrons_shared_data.deck import load as load_deck_def  # noqa: E402


VERSION = 1.0
MOUNT = OT3Mount.GRIPPER
deck_def = load_deck_def("ot3_standard", version=3)
# Offset of the center of the gripper jaw to the desired location
GRIPPER_OFFSET = Point(0.0, 2.65, 0.0)


class InvalidInput(Exception):
    """Invalid input exception."""

    pass


def prompt_int_input(prompt_name: str) -> int:
    """Prompt to choose a member of the enum.

    Args:
        output_func: Function to output text to user.
        get_user_input: Function to get user input.
        enum_type: an enum type

    Returns:
        The choice.

    """
    try:
        return int(input(f"{prompt_name}: "))
    except (ValueError, IndexError) as e:
        raise InvalidInput(e)


def prompt_float_input(prompt_name: str) -> float:
    """Prompt for a float."""
    try:
        return float(input(f"{prompt_name}: "))
    except (ValueError, IndexError) as e:
        raise InvalidInput(e)


def prompt_bool_input(prompt_name: str) -> float:
    """Prompt for a bool."""
    try:
        return {"true": True, "false": False}[input(f"{prompt_name}: ").lower()]
    except (ValueError, IndexError) as e:
        raise InvalidInput(e)


def get_slot_center_in_deck_coord(slot_id: int) -> Point:
    corner = Point(*deck_def["locations"]["orderedSlots"][slot_id - 1]["position"])
    return Point(corner.x + 128.0 / 2, corner.y + 86.0 / 2, corner.z)


def build_api() -> ThreadManager[HardwareControlAPI]:
    api = ThreadManager(OT3API.build_hardware_controller)
    api.managed_thread_ready_blocking()
    return api


def print_current_state(
    api: ThreadManager[HardwareControlAPI],
    cycle_index: int,
    slot: int,
):
    """
    1. timestamp
    2. current cycle
    3. current slot
    4. gripper position (X, Y, Z_G)
    5. gripper state: open/closed
    6. encoder position (X, Y, G)
    """
    gripper = api.sync._gripper_handler.get_gripper()

    pos = api.sync.current_position_ot3(OT3Mount.GRIPPER)
    gripper_loc = (pos[OT3Axis.X], pos[OT3Axis.Y], pos[OT3Axis.Z_G])

    enc_pos = api.sync._encoder_current_position
    enc_loc = (enc_pos[OT3Axis.X], enc_pos[OT3Axis.Y], enc_pos[OT3Axis.G])
    print(
        f"{datetime.datetime.now()}, {cycle_index}, {slot}, "
        f"{gripper_loc}, {gripper.state}, {enc_loc}\n"
    )


if __name__ == "__main__":
    from_slot = prompt_int_input("Origin slot (1-12)")
    to_slot = prompt_int_input("Destination slot (1-12)")
    grip_force = prompt_float_input("Force in Newton to grip the labware (rec: 20 N)")
    grip_height = prompt_float_input(
        "Z-Height from the deck in mm to grip labware (rec: 25 mm)"
    )
    return_to_origin = prompt_bool_input(
        "Do you want the gripper to return the plate to the origin slot? True or False"
    )
    repeats = prompt_int_input(
        "How many times do you want this script to repeat? Type 0 if you only want to run the script once"
    )

    hc_api = build_api()
    api = hc_api.sync
    api.home()
    homed_pos = api.gantry_position(MOUNT)

    from_slot_loc = get_slot_center_in_deck_coord(from_slot) + GRIPPER_OFFSET
    to_slot_loc = get_slot_center_in_deck_coord(to_slot) + GRIPPER_OFFSET

    for cycle in range(repeats + 1):
        api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
        print_current_state(hc_api, cycle, from_slot)
        api.move_to(MOUNT, from_slot_loc._replace(z=grip_height))

        api.grip(grip_force)
        print_current_state(hc_api, cycle, from_slot)
        api.delay(1)

        api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
        api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))
        api.move_to(MOUNT, to_slot_loc._replace(z=grip_height))
        print_current_state(hc_api, cycle, from_slot)

        api.ungrip()
        print_current_state(hc_api, cycle, from_slot)
        api.delay(1)

        # Return to safe height
        api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))
        print_current_state(hc_api, cycle, from_slot)

        if return_to_origin:

            api.move_to(MOUNT, to_slot_loc._replace(z=grip_height))

            api.grip(grip_force)
            print_current_state(hc_api, cycle, from_slot)
            api.delay(1.0)

            api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))
            api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
            api.move_to(MOUNT, from_slot_loc._replace(z=grip_height))
            print_current_state(hc_api, cycle, from_slot)

            api.ungrip()
            print_current_state(hc_api, cycle, from_slot)
            api.delay(1.0)

            # Return to safe height
            api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
            print_current_state(hc_api, cycle, from_slot)

    api.home()
