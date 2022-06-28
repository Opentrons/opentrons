from typing import Optional

from opentrons.hardware_control.robot_calibration import load_gripper_calibration_offset
from .gripper import Gripper


class GripperNotAttachedError:
    """An error raised if a gripper is accessed that is not attached"""

    pass


class GripperHandler:
    def __init__(self, gripper: Optional[Gripper] = None):
        self._gripper = gripper

    def reset_gripper(self) -> None:
        """Reset the internal state of the gripper."""
        og_gripper = self._gripper
        if not og_gripper:
            return
        new_gripper = Gripper(
            og_gripper.config,
            load_gripper_calibration_offset(og_gripper.gripper_id),
            og_gripper.gripper_id,
        )
        self._gripper = new_gripper

    def reset(self) -> None:
        self._gripper = None

    @property
    def gripper(self) -> Optional[Gripper]:
        return self._gripper
