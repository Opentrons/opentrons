"""Protocol engine errors module."""

from .exceptions import (
    ProtocolEngineError,
    UnexpectedProtocolError,
    FailedToLoadPipetteError,
    PipetteNotAttachedError,
    CommandDoesNotExistError,
    LabwareDoesNotExistError,
    LabwareDefinitionDoesNotExistError,
    LabwareOffsetDoesNotExistError,
    LabwareIsNotTipRackError,
    WellDoesNotExistError,
    PipetteDoesNotExistError,
    ModuleDoesNotExistError,
    SlotDoesNotExistError,
    FailedToPlanMoveError,
    MustHomeError,
    ProtocolEngineStoppedError,
    WellOriginNotAllowedError,
    ModuleNotAttachedError,
    ModuleDefinitionDoesNotExistError,
    ModuleIsNotThermocyclerError,
    ThermocyclerNotOpenError,
)

from .error_occurrence import ErrorOccurrence

__all__ = [
    # exceptions
    "ProtocolEngineError",
    "UnexpectedProtocolError",
    "FailedToLoadPipetteError",
    "PipetteNotAttachedError",
    "CommandDoesNotExistError",
    "LabwareDoesNotExistError",
    "LabwareDefinitionDoesNotExistError",
    "LabwareOffsetDoesNotExistError",
    "LabwareIsNotTipRackError",
    "WellDoesNotExistError",
    "PipetteDoesNotExistError",
    "ModuleDoesNotExistError",
    "SlotDoesNotExistError",
    "FailedToPlanMoveError",
    "MustHomeError",
    "ProtocolEngineStoppedError",
    "WellOriginNotAllowedError",
    "ModuleNotAttachedError",
    "ModuleDefinitionDoesNotExistError",
    "ModuleIsNotThermocyclerError",
    "ThermocyclerNotOpenError",
    # error occurrence models
    "ErrorOccurrence",
]
