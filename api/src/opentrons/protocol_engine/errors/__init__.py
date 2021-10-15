"""Protocol engine errors module."""

from .error_occurrence import ErrorOccurrence

from .exceptions import (
    ProtocolEngineError,
    UnexpectedProtocolError,
    FailedToLoadPipetteError,
    PipetteNotAttachedError,
    CommandDoesNotExistError,
    LabwareDoesNotExistError,
    LabwareDefinitionDoesNotExistError,
    LabwareIsNotTipRackError,
    WellDoesNotExistError,
    PipetteDoesNotExistError,
    SlotDoesNotExistError,
    FailedToPlanMoveError,
    ProtocolEngineStoppedError,
)


__all__ = [
    # public models
    "ErrorOccurrence",
    # exceptions
    "ProtocolEngineError",
    "UnexpectedProtocolError",
    "FailedToLoadPipetteError",
    "PipetteNotAttachedError",
    "CommandDoesNotExistError",
    "LabwareDoesNotExistError",
    "LabwareDefinitionDoesNotExistError",
    "LabwareIsNotTipRackError",
    "WellDoesNotExistError",
    "PipetteDoesNotExistError",
    "SlotDoesNotExistError",
    "FailedToPlanMoveError",
    "ProtocolEngineStoppedError",
]
