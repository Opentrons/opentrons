"""Exception hierarchy for error codes."""
from typing import Dict, Any, Optional
from logging import getLogger

from .codes import ErrorCodes
from .categories import ErrorCategories


log = getLogger(__name__)


class EnumeratedError(Exception):
    """The root class of error-code-bearing exceptions."""

    def __init__(
        self,
        code: ErrorCodes,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Build an EnumeratedError."""
        self.code = code
        self.message = message or ""
        self.detail = detail or {}

    def __repr__(self) -> str:
        """Get a representative string for the exception."""
        return f"<{self.__class__.__name__}: code=<{self.code.value.code} {self.code.name}> message={self.message} detail={str(self.detail)}"


class CommunicationError(EnumeratedError):
    """An exception indicating an unknown communications error.

    This can either be used directly (by not specifying an error code, in which case
    it will get the base communication error code) or as an intermediate parent in which
    case you should specify the code with a super call.
    """

    def __init__(
        self,
        code: Optional[ErrorCodes] = None,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Build a CommunicationError."""
        if code and code not in code.of_category(
            ErrorCategories.HARDWARE_COMMUNICATION_ERROR
        ):
            log.error(
                f"Error {code.name} is inappropriate for a CommunicationError exception"
            )
        super().__init__(code or ErrorCodes.COMMUNICATION_ERROR, message, detail)


class RoboticsControlError(EnumeratedError):
    """An exception indicating an unknown robotics control error.

    This can either be used directly (by not specifying an error code, in which case
    it will get the base robotics control error code) or as an intermediate parent in which
    case you should specify the code with a super call.
    """

    def __init__(
        self,
        code: Optional[ErrorCodes] = None,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Build a RoboticsControlError."""
        if code and code not in code.of_category(
            ErrorCategories.ROBOTICS_CONTROL_ERROR
        ):
            log.error(
                f"Error {code.name} is inappropriate for a RoboticsControlError exception"
            )

        super().__init__(code or ErrorCodes.ROBOTICS_CONTROL_ERROR, message, detail)


class RoboticsInteractionError(EnumeratedError):
    """An exception indicating an unknown robotics interacion error.

    This can either be used directly (by not specifying an error code, in which case
    it will get the base robotics interaction error code) or as an intermediate parent in which
    case you should specify the code with a super call.
    """

    def __init__(
        self,
        code: Optional[ErrorCodes] = None,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Build a RoboticsInteractionError."""
        if code and code not in code.of_category(
            ErrorCategories.ROBOTICS_INTERACTION_ERROR
        ):
            log.error(
                f"Error {code.name} is inappropriate for a RoboticsInteractionError exception"
            )

        super().__init__(code or ErrorCodes.ROBOTICS_INTERACTION_ERROR, message, detail)


class GeneralError(EnumeratedError):
    """An exception indicating an unknown general error.

    This can either be used directly (by not specifying an error code, in which case
    it will get the base general error code) or as an intermediate parent in which
    case you should specify the code with a super call.
    """

    def __init__(
        self,
        code: Optional[ErrorCodes] = None,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Build a GeneralError."""
        if code and code not in code.of_category(ErrorCategories.GENERAL_ERROR):
            log.error(
                f"Error {code.name} is inappropriate for a GeneralError exception"
            )
        super().__init__(code or ErrorCodes.GENERAL_ERROR, message, detail)


class CanbusCommunicationError(CommunicationError):
    """An error indicating a problem with canbus communication."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a CanbusCommunicationError."""
        super().__init__(ErrorCodes.CANBUS_COMMUNICATION_ERROR, message, detail)


class InternalUSBCommunicationError(CommunicationError):
    """An error indicating a problem with internal USB communication - e.g. with the rear panel."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build an InternalUSBCommunicationError."""
        super().__init__(ErrorCodes.INTERNAL_USB_COMMUNICATION_ERROR, message, detail)


class ModuleCommunicationError(CommunicationError):
    """An error indicating a problem with module communication."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build an ModuleCommunicationError."""
        super().__init__(ErrorCodes.MODULE_COMMUNICATION_ERROR, message, detail)


class CommandTimedOutError(CommunicationError):
    """An error indicating that a command timed out."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a CommandTimedOutError."""
        super().__init__(ErrorCodes.COMMAND_TIMED_OUT, message, detail)


class FirmwareUpdateFailedError(CommunicationError):
    """An error indicating that a firmware update failed."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a FirmwareUpdateFailedError."""
        super().__init__(ErrorCodes.FIRMWARE_UPDATE_FAILED, message, detail)


class MotionFailedError(RoboticsControlError):
    """An error indicating that a motion failed."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a FirmwareUpdateFailedError."""
        super().__init__(ErrorCodes.MOTION_FAILED, message, detail)


class HomingFailedError(RoboticsControlError):
    """An error indicating that a homing failed."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a FirmwareUpdateFailedError."""
        super().__init__(ErrorCodes.HOMING_FAILED, message, detail)


class StallOrCollisionDetectedError(RoboticsControlError):
    """An error indicating that a stall or collision occurred."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a StallOrCollisionDetectedError."""
        super().__init__(ErrorCodes.STALL_OR_COLLISION_DETECTED, message, detail)


class MotionPlanningFailureError(RoboticsControlError):
    """An error indicating that motion planning failed."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a MotionPlanningFailureError."""
        super().__init__(ErrorCodes.MOTION_PLANNING_FAILURE, message, detail)


class LabwareDroppedError(RoboticsInteractionError):
    """An error indicating that the gripper dropped labware it was holding."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a LabwareDroppedError."""
        super().__init__(ErrorCodes.LABWARE_DROPPED, message, detail)


class TipPickupFailedError(RoboticsInteractionError):
    """An error indicating that a pipette failed to pick up a tip."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a TipPickupFailedError."""
        super().__init__(ErrorCodes.TIP_PICKUP_FAILED, message, detail)


class TipDropFailedError(RoboticsInteractionError):
    """An error indicating that a pipette failed to drop a tip."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build a TipPickupFailedError."""
        super().__init__(ErrorCodes.TIP_DROP_FAILED, message, detail)


class UnexpectedTipRemovalError(RoboticsInteractionError):
    """An error indicating that a pipette did not have a tip when it should (aka it fell off)."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build an UnexpectedTipRemovalError."""
        super().__init__(ErrorCodes.UNEXPECTED_TIP_REMOVAL, message, detail)


class PipetteOverpressureError(RoboticsInteractionError):
    """An error indicating that a pipette experienced an overpressure event, likely because of a clog."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build an PipetteOverpressureError."""
        super().__init__(ErrorCodes.PIPETTE_OVERPRESSURE, message, detail)


class EStopActivatedError(RoboticsInteractionError):
    """An error indicating that the E-stop was activated."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build an EStopActivatedError."""
        super().__init__(ErrorCodes.E_STOP_ACTIVATED, message, detail)


class EStopNotPresentError(RoboticsInteractionError):
    """An error indicating that the E-stop is not present."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build an EStopNotPresentError."""
        super().__init__(ErrorCodes.E_STOP_NOT_PRESENT, message, detail)


class PipetteNotPresentError(RoboticsInteractionError):
    """An error indicating that the specified pipette is not present."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build an PipetteNotPresentError."""
        super().__init__(ErrorCodes.PIPETTE_NOT_PRESENT, message, detail)


class GripperNotPresentError(RoboticsInteractionError):
    """An error indicating that the specified gripper is not present."""

    def __init__(
        self, message: Optional[str] = None, detail: Optional[Dict[str, Any]] = None
    ) -> None:
        """Build an GripperNotPresentError."""
        super().__init__(ErrorCodes.GRIPPER_NOT_PRESENT, message, detail)
