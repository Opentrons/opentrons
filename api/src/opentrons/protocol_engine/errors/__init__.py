"""Protocol engine errors module."""
from typing import Union


class ProtocolEngineError(RuntimeError):
    """Base ProtocolEngine error class."""
    pass


class UnexpectedProtocolError(ProtocolEngineError):
    """
    An error that's raised when an unexpected error occurs.

    This error is indicitive of a software bug. If it happens, it means an
    exception was raised somewhere in the stack and it was not properly caught
    and wrapped.
    """
    original_error: Exception

    def __init__(self, original_error: Exception):
        super().__init__(str(original_error))
        self.original_error = original_error


class FailedToLoadPipetteError(ProtocolEngineError):
    # TODO(mc, 2020-10-18): differentiate between pipette missing vs incorrect
    """
    An error that's raised when a LoadPipette command fails.

    This failure may be caused by:
    - An incorrect pipette already attached to the mount
    - A missing pipette on the requested mount
    """
    pass


ProtocolEngineErrorType = Union[
    UnexpectedProtocolError,
    FailedToLoadPipetteError,
]
