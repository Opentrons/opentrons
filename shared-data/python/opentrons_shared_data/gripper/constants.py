"""Gripper constants and default values."""
from .gripper_definition import Offset

LABWARE_GRIP_FORCE: float = 15.0  # Newtons
IDLE_STATE_GRIP_FORCE: float = 10.0  # Newtons
GRIPPER_DECK_DROP_OFFSET: Offset = Offset(x=-0.5, y=-0.5, z=-1.5)
GRIPPER_MODULE_DROP_OFFSET: Offset = Offset(x=0.0, y=0.0, z=1.5)
