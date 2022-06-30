from typing import Optional

from opentrons.types import Point
from opentrons.hardware_control.robot_calibration import load_gripper_calibration_offset
from opentrons.hardware_control.dev_types import GripperDict
from opentrons.hardware_control.types import CriticalPoint
from .gripper import Gripper


class GripperNotAttachedError(Exception):
    """An error raised if a gripper is accessed that is not attached"""

    pass


class GripError(Exception):
    """An error raised if a gripper is accessed that is not attached"""

    pass


# TODO: verify value with HW and put this value in gripper config
DEFAULT_GRIP_FORCE_IN_NEWTON = 3


class GripperHandler:
    def __init__(self, gripper: Optional[Gripper] = None):
        self._gripper = gripper

    def _verify_gripper(self) -> Gripper:
        gripper = self._gripper
        if not gripper:
            raise GripperNotAttachedError
        return gripper

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

    async def reset(self) -> None:
        self._gripper = None

    @property
    def gripper(self) -> Optional[Gripper]:
        return self._gripper

    @gripper.setter
    def gripper(self, gripper: Optional[Gripper] = None) -> None:
        self._gripper = gripper

    def get_critical_point(self, cp_override: Optional[CriticalPoint] = None) -> Point:
        if not self._gripper:
            return Point(0, 0, 0)
        else:
            return self._gripper.critical_point(cp_override)

    def get_gripper_dict(self) -> Optional[GripperDict]:
        if not self._gripper:
            return None
        else:
            return self._gripper.as_dict()

    def ready_for_grip(self) -> None:
        gripper = self._verify_gripper()
        if gripper._has_gripped:
            raise GripError("Gripper is already gripping")

    def set_ready_to_grip(self, val: bool) -> None:
        gripper = self._verify_gripper()
        gripper._ready_to_grip = val

    def get_duty_cycle_by_grip_force(self, newton: Optional[float] = 0) -> float:
        gripper = self._verify_gripper()
        if not newton:
            newton = DEFAULT_GRIP_FORCE_IN_NEWTON
        duty_cycle = newton / gripper.force_per_duty_cycle(newton)
        return duty_cycle

