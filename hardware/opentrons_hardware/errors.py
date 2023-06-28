"""Module to convert message errors to exceptions."""
from typing import Dict, Optional, Tuple
import logging

from opentrons_shared_data.errors.exceptions import (
    InternalMessageFormatError,
    RoboticsControlError,
    RoboticsInteractionError,
    CommandTimedOutError,
    EStopActivatedError,
    StallOrCollisionDetectedError,
    PipetteOverpressureError,
    LabwareDroppedError,
    PythonException,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ErrorMessage,
)
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.constants import (
    ErrorSeverity,
    ErrorCode,
    NodeId,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId


log = logging.getLogger(__name__)


def nice_name_for_error(code: ErrorCode) -> str:
    """Build a quick nice name for an error code instance."""
    return code.name.replace("_", " ")


def _safe_details_from_message(
    message: ErrorMessage, arbitration_id: Optional[ArbitrationId]
) -> Tuple[Optional[NodeId], ErrorCode, ErrorSeverity]:

    detail_dict = {
        "hardware-error": str(message.payload.error_code.value),
        "hardware-severity": str(message.payload.severity.value),
    }
    if arbitration_id:
        detail_dict["hardware-node"] = str(arbitration_id.parts.originating_node_id)
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
        except BaseException as e:
            raise InternalMessageFormatError(
                message="Invalid or unknown message sender",
                detail=detail_dict,
                wrapping=[PythonException(e)],
            )
        node: Optional[NodeId] = originator
    else:
        node = None
    try:
        error_code = ErrorCode(message.payload.error_code.value)
    except BaseException as e:
        raise InternalMessageFormatError(
            message="Invalid or unknown error code",
            detail=detail_dict,
            wrapping=[PythonException(e)],
        )
    try:
        error_severity = ErrorSeverity(message.payload.severity.value)
    except BaseException as e:
        raise InternalMessageFormatError(
            message="Invalid or unknown error severity",
            detail=detail_dict,
            wrapping=[PythonException(e)],
        )
    return node, error_code, error_severity


def raise_from_error_message(  # noqa: C901
    message: ErrorMessage,
    arbitration_id: Optional[ArbitrationId] = None,
    *,
    detail: Optional[Dict[str, str]] = None,
    ignore_severity: bool = False,
) -> ErrorMessage:
    """Raise a proper enumerated error based on an error message if required, or return."""
    detail_dict = detail or {}
    maybe_node, error_code, error_severity = _safe_details_from_message(
        message, arbitration_id
    )
    if error_severity == ErrorSeverity.warning and not ignore_severity:
        return message
    if error_code == ErrorCode.ok and not ignore_severity:
        log.warning(f"Error message with ok error code: {message}")
        return message

    detail_dict["error-code"] = error_code.name
    detail_dict["error-severity"] = error_severity.name
    if maybe_node:
        detail_dict["node"] = maybe_node.name

    if error_code in (
        ErrorCode.invalid_size,
        ErrorCode.bad_checksum,
        ErrorCode.invalid_input,
    ):
        raise InternalMessageFormatError(
            message=f"Message format error: {nice_name_for_error(error_code)}",
            detail=detail_dict,
        )

    if error_code in (ErrorCode.motor_busy,):
        raise RoboticsInteractionError(
            message="Motor busy when operation requested", detail=detail_dict
        )

    if error_code in (ErrorCode.timeout,):
        raise CommandTimedOutError(
            message="Command timeout from hardware", detail=detail_dict
        )

    if error_code in (ErrorCode.estop_detected,):
        raise EStopActivatedError(detail=detail_dict)

    if error_code in (ErrorCode.collision_detected,):
        raise StallOrCollisionDetectedError(detail=detail_dict)

    if error_code in (ErrorCode.over_pressure,):
        raise PipetteOverpressureError(detail=detail_dict)

    if error_code in (ErrorCode.labware_dropped,):
        raise LabwareDroppedError(detail=detail_dict)

    if error_code in (ErrorCode.stop_requested, ErrorCode.estop_released):
        raise RoboticsControlError(
            message="Unexpected robotics error", detail=detail_dict
        )

    raise RoboticsControlError(message="Hardware error", detail=detail_dict)


def message_or_raise(
    message: MessageDefinition,
    arbitration_id: Optional[ArbitrationId] = None,
    *,
    detail: Optional[Dict[str, str]] = None,
) -> MessageDefinition:
    """Raise an error for an error message or return a non-error message."""
    if isinstance(message, ErrorMessage):
        return raise_from_error_message(message, arbitration_id, detail=detail)
    return message
