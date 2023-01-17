"""Gripper constants and default values."""
from .gripper_definition import Offset

LABWARE_GRIP_FORCE: float = 15.0  # Newtons
IDLE_STATE_GRIP_FORCE: float = 10.0  # Newtons
GRIPPER_DECK_DROP_OFFSET: Offset = Offset(-0.5, -0.5, -1.5)
GRIPPER_MODULE_DROP_OFFSET: Offset = Offset(0.0, 0.0, 1.5)
