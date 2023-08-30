"""Exception hierarchy for error codes."""
from typing import Dict, Any, Optional, List, Iterator, Union, Sequence
from logging import getLogger
from traceback import format_exception_only, format_tb
import inspect
import sys

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
        wrapping: Optional[Sequence["EnumeratedError"]] = None,
    ) -> None:
        """Build an EnumeratedError."""
        self.code = code
        self.message = message or ""
        self.detail = detail or {}
        self.wrapping = wrapping or []

    def __repr__(self) -> str:
        """Get a representative string for the exception."""
        return f"<{self.__class__.__name__}: code=<{self.code.value.code} {self.code.name}> message={self.message} detail={str(self.detail)}"

    def __str__(self) -> str:
        """Get a human-readable string."""
        _node = self.detail.get("node")
        return f'Error {self.code.value.code} {self.code.name} ({self.__class__.__name__}){f": {self.message}" if self.message else ""}{f" ({_node})" if _node else ""}'

    def __eq__(self, other: object) -> bool:
        """Compare if two enumerated errors match."""
        if not isinstance(other, EnumeratedError):
            return NotImplemented
        return (
            self.code == other.code
            and self.message == other.message
            and self.detail == other.detail
            and self.wrapping == other.wrapping
        )


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
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a CommunicationError."""
        if code and code not in code.of_category(
            ErrorCategories.HARDWARE_COMMUNICATION_ERROR
        ):
            log.error(
                f"Error {code.name} is inappropriate for a CommunicationError exception"
            )
        super().__init__(
            code or ErrorCodes.COMMUNICATION_ERROR, message, detail, wrapping
        )


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
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a RoboticsControlError."""
        if code and code not in code.of_category(
            ErrorCategories.ROBOTICS_CONTROL_ERROR
        ):
            log.error(
                f"Error {code.name} is inappropriate for a RoboticsControlError exception"
            )

        super().__init__(
            code or ErrorCodes.ROBOTICS_CONTROL_ERROR, message, detail, wrapping
        )


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
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a RoboticsInteractionError."""
        if code and code not in code.of_category(
            ErrorCategories.ROBOTICS_INTERACTION_ERROR
        ):
            log.error(
                f"Error {code.name} is inappropriate for a RoboticsInteractionError exception"
            )

        super().__init__(
            code or ErrorCodes.ROBOTICS_INTERACTION_ERROR, message, detail, wrapping
        )


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
        wrapping: Optional[Sequence[Union[EnumeratedError, BaseException]]] = None,
    ) -> None:
        """Build a GeneralError."""
        if code and code not in code.of_category(ErrorCategories.GENERAL_ERROR):
            log.error(
                f"Error {code.name} is inappropriate for a GeneralError exception"
            )

        def _wrapped_excs() -> Iterator[EnumeratedError]:
            if not wrapping:
                return
            for exc in wrapping:
                if isinstance(exc, EnumeratedError):
                    yield exc
                else:
                    yield PythonException(exc)

        super().__init__(
            code or ErrorCodes.GENERAL_ERROR, message, detail, list(_wrapped_excs())
        )


def _exc_harvest_predicate(v: Any) -> bool:
    if inspect.isroutine(v):
        return False
    if inspect.ismethoddescriptor(v):
        return False
    # on python 3.11 and up we can check if things are method wrappers, which basic builtin
    # dunders like __add__ are, but until then we can't and also don't know this is real
    if sys.version_info.minor >= 11 and inspect.ismethodwrapper(v):  # type: ignore[attr-defined]
        return False
    return True


class PythonException(GeneralError):
    """An exception wrapping a base exception but with a GeneralError code and storing details."""

    def __init__(self, exc: BaseException) -> None:
        """Build a PythonException."""

        def _descend_exc_ctx(exc: BaseException) -> List[PythonException]:
            descendants: List[PythonException] = []
            if exc.__context__:
                descendants.append(PythonException(exc.__context__))
            if exc.__cause__:
                descendants.append(PythonException(exc.__cause__))
            return descendants

        base_details = {
            k: str(v)
            for k, v in inspect.getmembers(exc, _exc_harvest_predicate)
            if not k.startswith("_")
        }
        try:
            tb = exc.__traceback__
        except AttributeError:
            tb = None

        if tb:
            base_details["traceback"] = "\n".join(format_tb(tb))
        base_details["class"] = type(exc).__name__

        super().__init__(
            message="\n".join(format_exception_only(type(exc), exc)).strip(),
            detail=base_details,
            wrapping=_descend_exc_ctx(exc),
        )


class RobotInUseError(CommunicationError):
    """An error indicating that an action cannot proceed because another is in progress."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a CanbusCommunicationError."""
        super().__init__(ErrorCodes.ROBOT_IN_USE, message, detail, wrapping)


class CanbusCommunicationError(CommunicationError):
    """An error indicating a problem with canbus communication."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a CanbusCommunicationError."""
        super().__init__(
            ErrorCodes.CANBUS_COMMUNICATION_ERROR, message, detail, wrapping
        )


class InternalUSBCommunicationError(CommunicationError):
    """An error indicating a problem with internal USB communication - e.g. with the rear panel."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an InternalUSBCommunicationError."""
        super().__init__(
            ErrorCodes.INTERNAL_USB_COMMUNICATION_ERROR, message, detail, wrapping
        )


class ModuleCommunicationError(CommunicationError):
    """An error indicating a problem with module communication."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a CanbusCommunicationError."""
        super().__init__(
            ErrorCodes.CANBUS_COMMUNICATION_ERROR, message, detail, wrapping
        )


class CommandTimedOutError(CommunicationError):
    """An error indicating that a command timed out."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a CommandTimedOutError."""
        super().__init__(ErrorCodes.COMMAND_TIMED_OUT, message, detail, wrapping)


class FirmwareUpdateFailedError(CommunicationError):
    """An error indicating that a firmware update failed."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a FirmwareUpdateFailedError."""
        super().__init__(ErrorCodes.FIRMWARE_UPDATE_FAILED, message, detail, wrapping)


class InternalMessageFormatError(CommunicationError):
    """An error indicating that an internal message was formatted incorrectly."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an InternalMesasgeFormatError."""
        super().__init__(
            ErrorCodes.INTERNAL_MESSAGE_FORMAT_ERROR, message, detail, wrapping
        )


class CANBusConfigurationError(CommunicationError):
    """An error indicating a misconfiguration of the CANbus."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a CANBus Configuration Error."""
        super().__init__(
            ErrorCodes.CANBUS_CONFIGURATION_ERROR, message, detail, wrapping
        )


class CANBusBusError(CommunicationError):
    """An error indicating a low-level bus error on the CANbus like an error frame."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a CANBus Bus Error."""
        super().__init__(ErrorCodes.CANBUS_BUS_ERROR, message, detail, wrapping)


class MotionFailedError(RoboticsControlError):
    """An error indicating that a motion failed."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a FirmwareUpdateFailedError."""
        super().__init__(ErrorCodes.MOTION_FAILED, message, detail, wrapping)


class HomingFailedError(RoboticsControlError):
    """An error indicating that a homing failed."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a FirmwareUpdateFailedError."""
        super().__init__(ErrorCodes.HOMING_FAILED, message, detail, wrapping)


class StallOrCollisionDetectedError(RoboticsControlError):
    """An error indicating that a stall or collision occurred."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a StallOrCollisionDetectedError."""
        super().__init__(
            ErrorCodes.STALL_OR_COLLISION_DETECTED, message, detail, wrapping
        )


class MotionPlanningFailureError(RoboticsControlError):
    """An error indicating that motion planning failed."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a MotionPlanningFailureError."""
        super().__init__(ErrorCodes.MOTION_PLANNING_FAILURE, message, detail, wrapping)


class PositionEstimationInvalidError(RoboticsControlError):
    """An error indicating that a command failed because position estimation was invalid."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a PositionEstimationFailedError."""
        super().__init__(
            ErrorCodes.POSITION_ESTIMATION_INVALID, message, detail, wrapping
        )


class MoveConditionNotMetError(RoboticsControlError):
    """An error indicating that a move completed without its condition being met."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a MoveConditionNotMetError."""
        super().__init__(
            ErrorCodes.MOVE_CONDITION_NOT_MET,
            message or "Move completed without its complete condition being met",
            detail,
            wrapping,
        )


class CalibrationStructureNotFoundError(RoboticsControlError):
    """An error indicating that a calibration square was not able to be found."""

    def __init__(
        self,
        structure_height: float,
        lower_limit: float,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a CalibrationStructureNotFoundError."""
        super().__init__(
            ErrorCodes.CALIBRATION_STRUCTURE_NOT_FOUND,
            f"Structure height at z={structure_height}mm beyond lower limit: {lower_limit}.",
            detail,
            wrapping,
        )


class EdgeNotFoundError(RoboticsControlError):
    """An error indicating that a calibration square edge was not able to be found."""

    def __init__(
        self,
        edge_name: str,
        stride: float,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a EdgeNotFoundError."""
        super().__init__(
            ErrorCodes.EDGE_NOT_FOUND,
            f"Edge {edge_name} could not be verified at {stride} mm resolution.",
            detail,
            wrapping,
        )


class EarlyCapacitiveSenseTrigger(RoboticsControlError):
    """An error indicating that a capacitive probe triggered too early."""

    def __init__(
        self,
        found: float,
        nominal: float,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a EarlyCapacitiveSenseTrigger."""
        super().__init__(
            ErrorCodes.EARLY_CAPACITIVE_SENSE_TRIGGER,
            f"Calibration triggered early at z={found}mm, expected {nominal}",
            detail,
            wrapping,
        )


class InaccurateNonContactSweepError(RoboticsControlError):
    """An error indicating that a capacitive sweep was inaccurate."""

    def __init__(
        self,
        found: float,
        nominal: float,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a InaccurateNonContactSweepError."""
        msg = (
            f"Calibration detected a slot width of {found:.3f}mm, "
            f"which is too far from the design width of {nominal:.3f}mm"
        )
        super().__init__(
            ErrorCodes.INACCURATE_NON_CONTACT_SWEEP,
            msg,
            detail,
            wrapping,
        )


class MisalignedGantryError(RoboticsControlError):
    """An error indicating that the robot's gantry and deck are misaligned."""

    def __init__(
        self,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a MisalignedGantryError."""
        msg = "This machine is misaligned and requires maintenance."
        if detail:
            msg += str(detail)
        super().__init__(
            ErrorCodes.MISALIGNED_GANTRY,
            msg,
            detail,
            wrapping,
        )


class LabwareDroppedError(RoboticsInteractionError):
    """An error indicating that the gripper dropped labware it was holding."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a LabwareDroppedError."""
        super().__init__(ErrorCodes.LABWARE_DROPPED, message, detail, wrapping)


class TipPickupFailedError(RoboticsInteractionError):
    """An error indicating that a pipette failed to pick up a tip."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a TipPickupFailedError."""
        super().__init__(ErrorCodes.TIP_PICKUP_FAILED, message, detail, wrapping)


class TipDropFailedError(RoboticsInteractionError):
    """An error indicating that a pipette failed to drop a tip."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a TipPickupFailedError."""
        super().__init__(ErrorCodes.TIP_DROP_FAILED, message, detail, wrapping)


class UnexpectedTipRemovalError(RoboticsInteractionError):
    """An error indicating that a pipette did not have a tip when it should (aka it fell off)."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an UnexpectedTipRemovalError."""
        super().__init__(ErrorCodes.UNEXPECTED_TIP_REMOVAL, message, detail, wrapping)


class UnexpectedTipAttachError(RoboticsInteractionError):
    """An error indicating that a pipette had a tip when it shouldn't."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an UnexpectedTipAttachError."""
        super().__init__(ErrorCodes.UNEXPECTED_TIP_ATTACH, message, detail, wrapping)


class FirmwareUpdateRequiredError(RoboticsInteractionError):
    """An error indicating that a firmware update is required."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a FirmwareUpdateRequiredError."""
        super().__init__(ErrorCodes.FIRMWARE_UPDATE_REQUIRED, message, detail, wrapping)


class PipetteOverpressureError(RoboticsInteractionError):
    """An error indicating that a pipette experienced an overpressure event, likely because of a clog."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an PipetteOverpressureError."""
        super().__init__(ErrorCodes.PIPETTE_OVERPRESSURE, message, detail, wrapping)


class EStopActivatedError(RoboticsInteractionError):
    """An error indicating that the E-stop was activated."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an EStopActivatedError."""
        super().__init__(ErrorCodes.E_STOP_ACTIVATED, message, detail, wrapping)


class EStopNotPresentError(RoboticsInteractionError):
    """An error indicating that the E-stop is not present."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an EStopNotPresentError."""
        super().__init__(ErrorCodes.E_STOP_NOT_PRESENT, message, detail, wrapping)


class PipetteNotPresentError(RoboticsInteractionError):
    """An error indicating that the specified pipette is not present."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an PipetteNotPresentError."""
        super().__init__(ErrorCodes.PIPETTE_NOT_PRESENT, message, detail, wrapping)


class GripperNotPresentError(RoboticsInteractionError):
    """An error indicating that the specified gripper is not present."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a GripperNotPresentError."""
        super().__init__(ErrorCodes.GRIPPER_NOT_PRESENT, message, detail, wrapping)


class InvalidActuator(RoboticsInteractionError):
    """An error indicating that a specified actuator is not valid."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an GripperNotPresentError."""
        super().__init__(ErrorCodes.INVALID_ACTUATOR, message, detail, wrapping)


class ModuleNotPresent(RoboticsInteractionError):
    """An error indicating that a specific module was not present."""

    def __init__(
        self,
        identifier: str,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a ModuleNotPresentError."""
        checked_detail: Dict[str, Any] = detail or {}
        checked_detail["identifier"] = identifier
        checked_message = message or f"Module {identifier} is not present"
        super().__init__(
            ErrorCodes.MODULE_NOT_PRESENT, checked_message, checked_detail, wrapping
        )


class InvalidInstrumentData(RoboticsInteractionError):
    """An error indicating that instrument data is invalid."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an GripperNotPresentError."""
        super().__init__(ErrorCodes.INVALID_INSTRUMENT_DATA, message, detail, wrapping)


class APIRemoved(GeneralError):
    """An error indicating that a specific API is no longer available."""

    def __init__(
        self,
        api_element: str,
        since_version: str,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an APIRemoved error."""
        checked_detail: Dict[str, Any] = detail or {}
        checked_detail["identifier"] = api_element
        checked_detail["since_version"] = since_version
        checked_message = (
            message
            or f"{api_element} is no longer available since version {since_version}."
        )
        super().__init__(
            ErrorCodes.API_REMOVED, checked_message, checked_detail, wrapping
        )
