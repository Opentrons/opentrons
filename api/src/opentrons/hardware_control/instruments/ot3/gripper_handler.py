from typing import Optional
import logging
import math

from opentrons.types import Point
from .instrument_calibration import (
    GripperCalibrationOffset,
    load_gripper_calibration_offset,
)
from opentrons.hardware_control.dev_types import GripperDict
from opentrons.hardware_control.types import (
    CriticalPoint,
    GripperJawState,
    GripperProbe,
)
from opentrons.hardware_control.errors import InvalidCriticalPoint
from opentrons_shared_data.errors.exceptions import (
    GripperNotPresentError,
    CommandPreconditionViolated,
)
from .gripper import Gripper


MOD_LOG = logging.getLogger(__name__)


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
            raise GripperNotPresentError(
                message="Cannot perform action without gripper attached"
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

    def reset_instrument_offset(self, to_default: bool) -> None:
        """
        Temporarily reset the gripper offsets to default values.
        """
        gripper = self.get_gripper()
        gripper.reset_offset(to_default)
        gripper.reset_jaw_width_calibration(to_default)

    def save_instrument_offset(self, delta: Point) -> GripperCalibrationOffset:
        """
        Save a new instrument offset.
        :param delta: The offset to set for the pipette.
        """
        gripper = self.get_gripper()
        self._log.info(f"Saving gripper {gripper.gripper_id} offset: {delta}")
        return gripper.save_offset(delta)

    def get_critical_point(self, cp_override: Optional[CriticalPoint] = None) -> Point:
        if not self._gripper:
            raise GripperNotPresentError()
        if cp_override == CriticalPoint.MOUNT:
            raise InvalidCriticalPoint(
                cp_override.name,
                "gripper",
                "The gripper mount may not be moved directly.",
            )
        return self._gripper.critical_point(cp_override)

    def get_gripper_dict(self) -> Optional[GripperDict]:
        if not self._gripper:
            # TODO (spp, 2023-04-19): Should this raise an error if fetching info of
            #  gripper that's not attached, like we do with pipettes?
            return None
        else:
            return self._gripper.as_dict()

    def get_attached_probe(self) -> Optional[GripperProbe]:
        return self.get_gripper().attached_probe

    def add_probe(self, probe: GripperProbe) -> None:
        """This is used for finding the critical point during calibration."""
        gripper = self.get_gripper()
        current_probe = self.get_attached_probe()
        if not current_probe:
            gripper.add_probe(probe)
        else:
            self._log.warning("add probe called with a probe already attached.")

    def remove_probe(self) -> None:
        gripper = self.get_gripper()
        current_probe = self.get_attached_probe()
        if current_probe:
            gripper.remove_probe()
        else:
            self._log.warning("remove probe called without a probe attached")

    def check_ready_for_calibration(self) -> None:
        """Raise an exception if a probe is not attached before calibration."""
        gripper = self.get_gripper()
        gripper.check_calibration_pin_location_is_accurate()

    def check_ready_for_jaw_move(self, command: str) -> None:
        """Raise an exception if it is not currently valid to move the jaw."""
        gripper = self.get_gripper()
        if gripper.state == GripperJawState.UNHOMED:
            raise CommandPreconditionViolated(
                message=f"Cannot {command} gripper jaw before homing",
                detail={
                    "command": command,
                    "jaw_state": str(gripper.state),
                },
            )

    def is_ready_for_idle(self) -> bool:
        """Gripper can idle when the jaw is not currently gripping."""
        gripper = self.get_gripper()
        if gripper.state == GripperJawState.UNHOMED:
            self._log.warning(
                "Gripper jaw is not homed and cannot move to idle position."
            )
            return False
        return gripper.state != GripperJawState.GRIPPING

    def is_ready_for_jaw_home(self) -> bool:
        """Raise an exception if it is not currently valid to home the jaw."""
        gripper = self.get_gripper()
        if gripper.state == GripperJawState.GRIPPING and not math.isclose(
            gripper.jaw_width, gripper.geometry.jaw_width["min"], abs_tol=5.0
        ):
            return False
        return True

    def set_jaw_state(self, state: GripperJawState) -> None:
        self.get_gripper().state = state

    def get_duty_cycle_by_grip_force(self, newton: float) -> float:
        gripper = self.get_gripper()
        return gripper.duty_cycle_by_force(newton)

    def set_jaw_displacement(self, mm: float) -> None:
        gripper = self.get_gripper()
        gripper.current_jaw_displacement = mm

    def is_valid_jaw_width(self, mm: float) -> bool:
        conf = self.get_gripper().geometry
        return conf.jaw_width["min"] <= mm <= conf.jaw_width["max"]
