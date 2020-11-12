"""Protocol engine errors module."""


class ProtocolEngineError(RuntimeError):
    """Base Protocol Engine error class."""

    pass


class UnexpectedProtocolError(ProtocolEngineError):
    """
    An error raised when an unexpected error occurs.

    This error is indicative of a software bug. If it happens, it means an
    exception was raised somewhere in the stack and it was not properly caught
    and wrapped.
    """

    def __init__(self, original_error: Exception) -> None:
        """Initialize an UnexpectedProtocolError with an original error."""
        super().__init__(str(original_error))
        self.original_error: Exception = original_error


class FailedToLoadPipetteError(ProtocolEngineError):
    """
    An error raised when executing a LoadPipetteRequest fails.

    This failure may be caused by:
    - An incorrect pipette already attached to the mount
    - A missing pipette on the requested mount
    """

    # TODO(mc, 2020-10-18): differentiate between pipette missing vs incorrect
    pass


class PipetteNotAttachedError(ProtocolEngineError):
    """An error raised when an operation's required pipette is not attached."""

    # TODO(mc, 2020-10-18): differentiate between pipette missing vs incorrect
    pass


class LabwareDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a labware that does not exist."""

    pass


class LabwareIsNotTipRackError(ProtocolEngineError):
    """An error raised when trying to use a regular labware as a tip rack."""

    pass


class WellDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a well that does not exist."""

    pass


class PipetteDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a pipette that does not exist."""

    pass


class SlotDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a deck slot that does not exist."""

    pass


# TODO(mc, 2020-11-06): flesh out with structured data to replicate
# existing LabwareHeightError
class FailedToPlanMoveError(ProtocolEngineError):
    """An error raised when a requested movement could not be planned."""

    pass
