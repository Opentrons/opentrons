"""Protocol engine errors module."""


class ProtocolEngineError(RuntimeError):
    """Base Protocol Engine error class."""
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
    """
    An error that's raised when executing a LoadPipetteRequest fails.

    This failure may be caused by:
    - An incorrect pipette already attached to the mount
    - A missing pipette on the requested mount
    """
    # TODO(mc, 2020-10-18): differentiate between pipette missing vs incorrect
    pass
