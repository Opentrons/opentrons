"""Protocol engine errors module."""

from .error_occurance import ErrorOccurance

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
    "ErrorOccurance",
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
