"""Protocol engine exceptions."""


class ProtocolEngineError(RuntimeError):
    """Base Protocol Engine error class."""


class UnexpectedProtocolError(ProtocolEngineError):
    """An error raised when an unexpected error occurs.

    This error is indicative of a software bug. If it happens, it means an
    exception was raised somewhere in the stack and it was not properly caught
    and wrapped.
    """

    def __init__(self, original_error: Exception) -> None:
        """Initialize an UnexpectedProtocolError with an original error."""
        super().__init__(str(original_error))
        self.original_error: Exception = original_error


# TODO(mc, 2020-10-18): differentiate between pipette missing vs incorrect
class FailedToLoadPipetteError(ProtocolEngineError):
    """An error raised when executing a LoadPipette command fails.

    This failure may be caused by:
    - An incorrect pipette already attached to the mount
    - A missing pipette on the requested mount
    """


# TODO(mc, 2020-10-18): differentiate between pipette missing vs incorrect
class PipetteNotAttachedError(ProtocolEngineError):
    """An error raised when an operation's required pipette is not attached."""


class CommandDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a command that does not exist."""


class PipetteTipInfoNotFoundError(ProtocolEngineError):
    """An error raised when fetching information (like tiprack id) of attached tip."""


class LabwareDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a labware that does not exist."""


class LabwareDefinitionDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a labware definition that does not exist."""


class LabwareOffsetDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a labware offset that does not exist."""


class LabwareIsNotTipRackError(ProtocolEngineError):
    """An error raised when trying to use a regular labware as a tip rack."""


class WellDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a well that does not exist."""


class PipetteDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a pipette that does not exist."""


class ModuleDoesNotExistError(ProtocolEngineError):
    """And error raised when referencing a module that does not exist."""


class SlotDoesNotExistError(ProtocolEngineError):
    """An error raised when referencing a deck slot that does not exist."""


# TODO(mc, 2020-11-06): flesh out with structured data to replicate
# existing LabwareHeightError
class FailedToPlanMoveError(ProtocolEngineError):
    """An error raised when a requested movement could not be planned."""


class MustHomeError(ProtocolEngineError):
    """An error raised when motors must be homed due to unknown current position."""


class ProtocolEngineStoppedError(ProtocolEngineError):
    """An error raised when attempting an invalid action with a stopped engine."""


class WellOriginNotAllowedError(ProtocolEngineError):
    """An error raised when using a disallowed origin in a relative well location."""


class ModuleNotAttachedError(ProtocolEngineError):
    """An error raised when a requested module is not attached."""


class ModuleAlreadyPresentError(ProtocolEngineError):
    """An error raised when a module is already present in a requested location."""


class ModuleIsNotThermocyclerError(ProtocolEngineError):
    """An error raised when performing thermocycler actions with a non-thermocycler."""


class ThermocyclerNotOpenError(ProtocolEngineError):
    """An error raised when trying to move to labware that's covered inside a TC."""


class RobotDoorOpenError(ProtocolEngineError):
    """An error raised when executing a protocol command when a robot door is open."""
