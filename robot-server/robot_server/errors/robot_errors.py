"""Error types related to many robot interactions."""

from typing_extensions import Literal
from .error_responses import ErrorDetails


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
