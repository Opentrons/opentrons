"""Error types related to many robot interactions."""

from typing_extensions import Literal
from .error_responses import ErrorDetails
from opentrons_shared_data.errors.codes import ErrorCodes


class InstrumentNotFound(ErrorDetails):
    """An error returned when a request specifies a missing instrument."""

    id: Literal["InstrumentNotFound"] = "InstrumentNotFound"
    title: str = "Instrument Not Found"


class NotSupportedOnOT2(ErrorDetails):
    """An error returned when an operation is not supported on an OT2."""

    id: Literal["NotSupportedOnOT2"] = "NotSupportedOnOT2"
    title: str = "Not Supported On OT-2"


class NotSupportedOnFlex(ErrorDetails):
    """An error returned when an operation is not supported on a Flex."""

    id: Literal["NotSupportedOnFlex"] = "NotSupportedOnFlex"
    title: str = "Not Supported On Flex"


class HardwareNotYetInitialized(ErrorDetails):
    """An error when accessing the hardware API before it's initialized."""

    id: Literal["HardwareNotYetInitialized"] = "HardwareNotYetInitialized"
    title: str = "Hardware Not Yet Initialized"
    detail: str = "The device's hardware has not finished initializing."


class HardwareFailedToInitialize(ErrorDetails):
    """An error if the hardware API fails to initialize."""

    id: Literal["HardwareFailedToInitialize"] = "HardwareFailedToInitialize"
    title: str = "Hardware Failed to Initialize"


class EstopNotAttached(ErrorDetails):
    """An error if there is no Estop present."""

    id: Literal["EstopNotAttached"] = "EstopNotAttached"
    title: str = "There is no Estop attached"
    errorCode: str = ErrorCodes.E_STOP_NOT_PRESENT.value.code


class EstopEngaged(ErrorDetails):
    """An error if there is an Estop engaged."""

    id: Literal["EstopEngaged"] = "EstopEngaged"
    title: str = "An Estop is physically engaged"
    errorCode: str = ErrorCodes.E_STOP_ACTIVATED.value.code


class EstopNotAcknowledged(ErrorDetails):
    """An error if a client needs to acknowledge an estop engage event."""

    id: Literal["EstopNotAcknowledged"] = "EstopNotAcknowledged"
    title: str = "Estop event must be acknowledged"
    errorCode: str = ErrorCodes.E_STOP_ACTIVATED.value.code
