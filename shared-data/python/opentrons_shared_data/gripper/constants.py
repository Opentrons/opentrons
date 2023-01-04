"""Gripper constants and default values."""
from .dev_types import GripperOffset

LABWARE_GRIP_FORCE: float = 20  # Newtons
IDLE_STATE_GRIP_FORCE: float = 10  # Newtons
GRIPPER_DECK_DROP_OFFSET: GripperOffset = GripperOffset(-0.5, -0.5, -1.5)
GRIPPER_MODULE_DROP_OFFSET: GripperOffset = GripperOffset(0.0, 0.0, 1.5)
