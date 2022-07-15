from typing import Optional

from opentrons.types import Point
from opentrons.hardware_control.robot_calibration import load_gripper_calibration_offset
from opentrons.hardware_control.dev_types import GripperDict
from opentrons.hardware_control.types import (
    CriticalPoint,
    GripperJawState,
    InvalidMoveError,
    GripperNotAttachedError,
)
from .gripper import Gripper


class GripError(Exception):
    """An error raised if a gripper action is blocked"""

    pass


# TODO: verify value with HW and put this value in gripper config
DEFAULT_GRIP_FORCE_IN_NEWTON = 3.0


class GripperHandler:
    def __init__(self, gripper: Optional[Gripper] = None):
        self._gripper = gripper

    def has_gripper(self) -> bool:
        return bool(self._gripper)

    def get_gripper(self) -> Gripper:
        gripper = self._gripper
        if not gripper:
            raise GripperNotAttachedError(
                "Cannot perform action without gripper attached"
            )
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
            raise GripperNotAttachedError()
        if cp_override == CriticalPoint.MOUNT:
            raise InvalidMoveError("The gripper mount may not be moved directly.")
        return self._gripper.critical_point(cp_override)

    def get_gripper_dict(self) -> Optional[GripperDict]:
        if not self._gripper:
            return None
        else:
            return self._gripper.as_dict()

    def check_ready_for_grip(self) -> None:
        """Raise an exception if it is not currently valid to grip."""
        gripper = self.get_gripper()
        self.check_ready_for_jaw_move()
        if gripper.state == GripperJawState.GRIPPING:
            raise GripError("Gripper is already gripping")
        elif not gripper.state.ready_for_grip:
            raise GripError("Gripper cannot currently grip")

    def check_ready_for_jaw_move(self) -> None:
        """Raise an exception if it is not currently valid to move the jaw."""
        gripper = self.get_gripper()
        if gripper.state == GripperJawState.UNHOMED:
            raise GripError("Gripper jaw must be homed before moving")

    def set_jaw_state(self, state: GripperJawState) -> None:
        self.get_gripper().state = state

    def get_duty_cycle_by_grip_force(self, newton: Optional[float] = None) -> float:
        gripper = self.get_gripper()
        if not newton:
            newton = DEFAULT_GRIP_FORCE_IN_NEWTON
        return gripper.duty_cycle_by_force(newton)
