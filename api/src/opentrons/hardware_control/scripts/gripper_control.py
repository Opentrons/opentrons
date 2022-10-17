import sys
import argparse
import datetime
import enum

sys.path.append("/opt/opentrons-robot-server")

from opentrons.hardware_control.thread_manager import ThreadManager  # noqa: E402
from opentrons.hardware_control.ot3api import OT3API  # noqa: E402
from opentrons.hardware_control.types import OT3Axis, OT3Mount  # noqa: E402
from opentrons.hardware_control.protocols import HardwareControlAPI  # noqa: E402
from opentrons.types import Point  # noqa: E402
from opentrons_shared_data.deck import load as load_deck_def  # noqa: E402


class InvalidInput(Exception):
    """Invalid input exception."""

    pass


VERSION = 2.0
MOUNT = OT3Mount.GRIPPER
deck_def = load_deck_def("ot3_standard", version=3)
# Offset of the center of the gripper jaw to the desired location
GRIPPER_OFFSET = Point(0.0, 1.0, 0.0)
AVAILABLE_SLOTS = [1, 3, 4, 9, 10, 12]


class GripperState(enum.Enum):
    UNGRIPPING = enum.auto()
    GRIPPING = enum.auto()
    Z_HOMED = enum.auto()
    Z_LOWERED = enum.auto()


VERSION = 2.0
MOUNT = OT3Mount.GRIPPER
deck_def = load_deck_def("ot3_standard", version=3)
# Offset of the center of the gripper jaw to the desired location
GRIPPER_OFFSET = Point(0.0, 1.0, 0.0)
AVAILABLE_SLOTS = [1, 3, 4, 9, 10, 12]


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
    jaw_state: GripperState,
) -> None:
    """
    1. timestamp
    2. current cycle
    3. current slot
    4. gripper position (X, Y, Z_G)
    5. gripper state: open/closed
    6. encoder positions (X, Y, G)
    """
    pos = api.sync.current_position_ot3(OT3Mount.GRIPPER)
    gripper_loc = (pos[OT3Axis.X], pos[OT3Axis.Y], pos[OT3Axis.Z_G])

    enc_pos = api.sync._encoder_current_position
    enc_loc = (enc_pos[OT3Axis.X], enc_pos[OT3Axis.Y], enc_pos[OT3Axis.G])
    print(
        f"{datetime.datetime.now()}, {cycle_index}, {slot}, "
        f"{gripper_loc}, {jaw_state}, {enc_loc}\n"
    )


def add_args(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    parser.add_argument(
        "--origin",
        type=int,
        required=False,
        default=1,
        help="select slot from 1, 3, 4, 9, 10, 12",
    )
    parser.add_argument(
        "--grip_force",
        type=float,
        required=False,
        default=20,
        help="grip force in Newton",
    )
    parser.add_argument(
        "--grip_height",
        type=float,
        required=False,
        default=25,
        help="grip height in mm",
    )
    parser.add_argument(
        "--repeats",
        type=int,
        required=False,
        default=0,
        help="how many times to repeat the test",
    )
    return parser


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gripper control script.")
    add_args(parser)
    args = parser.parse_args()

    hc_api = build_api()

    from_slot = args.origin
    grip_force = args.grip_force
    grip_height = args.grip_height
    repeats = args.repeats

    api = hc_api.sync
    api.home()
    homed_pos = api.gantry_position(MOUNT)

    from_slot_loc = get_slot_center_in_deck_coord(from_slot) + GRIPPER_OFFSET

    AVAILABLE_SLOTS.remove(from_slot)

    for cycle in range(repeats + 1):
        for slot_index, to_slot in enumerate(AVAILABLE_SLOTS):
            to_slot_loc = get_slot_center_in_deck_coord(to_slot) + GRIPPER_OFFSET
            if cycle == 0 and slot_index == 0:
                # move to pick up position at origin slot
                api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
                print_current_state(hc_api, cycle, from_slot, GripperState.Z_HOMED)
                api.move_to(MOUNT, from_slot_loc._replace(z=grip_height))
                print_current_state(hc_api, cycle, from_slot, GripperState.Z_LOWERED)

            api.grip(grip_force)
            api.delay(1)
            print_current_state(hc_api, cycle, from_slot, GripperState.GRIPPING)

            # move to drop off position at destination slot
            api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
            print_current_state(hc_api, cycle, from_slot, GripperState.Z_HOMED)
            api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))
            print_current_state(hc_api, cycle, to_slot, GripperState.Z_HOMED)
            api.move_to(MOUNT, to_slot_loc._replace(z=grip_height))
            print_current_state(hc_api, cycle, to_slot, GripperState.Z_LOWERED)

            api.ungrip()
            api.delay(1)
            print_current_state(hc_api, cycle, to_slot, GripperState.UNGRIPPING)

            api.grip(grip_force)
            api.delay(1.0)
            print_current_state(hc_api, cycle, to_slot, GripperState.GRIPPING)

            api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))
            print_current_state(hc_api, cycle, to_slot, GripperState.Z_HOMED)
            api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
            print_current_state(hc_api, cycle, from_slot, GripperState.Z_HOMED)
            api.move_to(MOUNT, from_slot_loc._replace(z=grip_height))
            print_current_state(hc_api, cycle, from_slot, GripperState.Z_LOWERED)

            api.ungrip()
            api.delay(1.0)
            print_current_state(hc_api, cycle, from_slot, GripperState.UNGRIPPING)

    api.home()
