from typing import Optional
import logging

from opentrons.types import Point
from .instrument_calibration import load_gripper_calibration_offset
from opentrons.hardware_control.dev_types import GripperDict
from opentrons.hardware_control.types import (
    CriticalPoint,
    GripperJawState,
    GripperProbe,
    InvalidMoveError,
    GripperNotAttachedError,
)
from .gripper import Gripper


MOD_LOG = logging.getLogger(__name__)


class GripError(Exception):
    """An error raised if a gripper action is blocked"""

    pass


class CalibrationError(Exception):
    """An error raised if a gripper calibration is blocked"""

    pass


# TODO: verify value with HW and put this value in gripper config
DEFAULT_GRIP_FORCE_IN_NEWTON = 3.0


class GripperHandler:
    GH_LOG = MOD_LOG.getChild("GripperHandler")

    def __init__(self, gripper: Optional[Gripper] = None):
        self._gripper = gripper
        self._log = self.GH_LOG.getChild(str(id(self)))

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

    def get_attached_probe(self) -> Optional[GripperProbe]:
        return self.get_gripper().attached_probe

    async def add_probe(self, probe: GripperProbe) -> None:
        """This is used for finding the critical point during calibration."""
        gripper = self.get_gripper()
        current_probe = self.get_attached_probe()
        if not current_probe:
            gripper.add_probe(probe)
        else:
            self._log.warning("add probe called with a probe already attached.")

    async def remove_probe(self) -> None:
        gripper = self.get_gripper()
        current_probe = self.get_attached_probe()
        if current_probe:
            gripper.remove_probe()
        else:
            self._log.warning("remove probe called without a probe attached")

    def check_ready_for_calibration(self) -> None:
        """Raise an exception if a probe is not attached before calibration."""
        gripper = self.get_gripper()
        if not gripper._attached_probe:
            raise CalibrationError("Must attach a probe before starting calibration.")

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

    def set_jaw_displacement(self, mm: float) -> None:
        gripper = self.get_gripper()
        gripper.current_jaw_displacement = mm
