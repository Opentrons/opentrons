import sys
sys.path.append('/opt/opentrons-robot-server')

#Opentrons Libraries
from opentrons.hardware_control.thread_manager import ThreadManager
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Axis, OT3Mount, OT3AxisKind, CriticalPoint, Axis
from opentrons.types import Mount, Point
from opentrons_shared_data.deck import load as load_deck_def

MOUNT = OT3Mount.GRIPPER
deck_def = load_deck_def("ot3_standard")
FROM_SLOT = 8
TO_SLOT = 3
GRIP_HEIGHT = 25

GRIPPER_OFFSET = Point(0.0, 2.65, 0.0)


def get_slot_center_in_deck_coord(index: int):
    corner = Point(*deck_def['locations']['orderedSlots'][index]['position'])
    return Point(corner.x + 128.0/2, corner.y + 86.0/2, corner.z)   


def build_api():
    api = ThreadManager(OT3API.build_hardware_controller)
    api.managed_thread_ready_blocking()
    return api.sync


if __name__ == "__main__":
    api = build_api()
    api.home()
    homed_pos = api.gantry_position(MOUNT)

    from_slot_loc = get_slot_center_in_deck_coord(FROM_SLOT) + GRIPPER_OFFSET
    print("from:")
    print(from_slot_loc)
    to_slot_loc = get_slot_center_in_deck_coord(TO_SLOT) + GRIPPER_OFFSET
    print("to:")
    print(to_slot_loc)

    api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
    api.move_to(MOUNT, from_slot_loc._replace(z=GRIP_HEIGHT))

    api.grip(20)
    api.move_to(MOUNT, from_slot_loc._replace(z=homed_pos.z))
    api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))
    api.move_to(MOUNT, to_slot_loc._replace(z=GRIP_HEIGHT))

    api.ungrip()
    api.move_to(MOUNT, to_slot_loc._replace(z=homed_pos.z))
    api.home()
    