import sys

sys.path.append("/opt/opentrons-robot-server")

from opentrons.hardware_control.thread_manager import ThreadManager  # noqa: E402
from opentrons.hardware_control.ot3api import OT3API  # noqa: E402
from opentrons.hardware_control.types import OT3Axis, OT3Mount  # noqa: E402
from opentrons.hardware_control.protocols import HardwareControlAPI  # noqa: E402
from opentrons.types import Point  # noqa: E402
from opentrons_shared_data.deck import load as load_deck_def  # noqa: E402


VERSION = 0.0
MOUNT = OT3Mount.GRIPPER

deck_def = load_deck_def("ot3_standard", version=3)

# Origin slot
FROM_SLOT = 8
# Destination slot
TO_SLOT = 3

# Grip force in newton
GRIP_FORCE = 20

# Z height in mm from the deck for gripping and safe-traveling
GRIP_HEIGHT = 25.0
TRAVEL_HEIGHT = 70.0

# Offset of the center of the gripper jaw to the desired location
GRIPPER_OFFSET = Point(0.0, 2.65, 0.0)

# If set to true, gripper will move labware back to the origin slot
RETURN_TO_ORIGIN = False

# Number of times the entire flow is to be repeated
REPEAT = 0


def get_slot_center_in_deck_coord(index: int) -> Point:
    corner = Point(*deck_def["locations"]["orderedSlots"][index]["position"])
    return Point(corner.x + 128.0 / 2, corner.y + 86.0 / 2, corner.z)


def build_api() -> ThreadManager[HardwareControlAPI]:
    api = ThreadManager(OT3API.build_hardware_controller)
    api.managed_thread_ready_blocking()
    return api


if __name__ == "__main__":
    hc_api = build_api()
    api = hc_api.sync
    print("Homing...")
    api.home()
    homed_pos = api.gantry_position(MOUNT)

    from_slot_loc = get_slot_center_in_deck_coord(FROM_SLOT) + GRIPPER_OFFSET
    to_slot_loc = get_slot_center_in_deck_coord(TO_SLOT) + GRIPPER_OFFSET

    for i in range(REPEAT + 1):
        print(f"Round: {i} / {REPEAT}")
        print("=========================")
        api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
        api.move_to(MOUNT, from_slot_loc._replace(z=GRIP_HEIGHT))

        print("Gripping...")
        api.grip(GRIP_FORCE)

        api.home([OT3Axis.Z_G])
        api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))
        api.move_to(MOUNT, to_slot_loc._replace(z=GRIP_HEIGHT))

        print("Releasing...")
        api.ungrip()

        # Return to safe height
        api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))

        if RETURN_TO_ORIGIN:
            api.delay(0.5)
            api.move_to(MOUNT, to_slot_loc._replace(z=GRIP_HEIGHT))

            print("Gripping...")
            api.grip(GRIP_FORCE)

            api.home([OT3Axis.Z_G])
            api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
            api.move_to(MOUNT, from_slot_loc._replace(z=GRIP_HEIGHT))

            print("Releasing...")
            api.ungrip()

            # Return to safe height
            api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))

        api.home()
