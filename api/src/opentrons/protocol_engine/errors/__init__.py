"""Protocol engine errors module."""

from .exceptions import (
    ProtocolEngineError,
    UnexpectedProtocolError,
    FailedToLoadPipetteError,
    PipetteNotAttachedError,
    CommandDoesNotExistError,
    LabwareNotLoadedError,
    LabwareDefinitionDoesNotExistError,
    LabwareOffsetDoesNotExistError,
    LabwareIsNotTipRackError,
    WellDoesNotExistError,
    PipetteNotLoadedError,
    PipetteTipInfoNotFoundError,
    ModuleNotLoadedError,
    SlotDoesNotExistError,
    FailedToPlanMoveError,
    MustHomeError,
    ProtocolEngineStoppedError,
    WellOriginNotAllowedError,
    ModuleNotAttachedError,
    ModuleAlreadyPresentError,
    WrongModuleTypeError,
    ThermocyclerNotOpenError,
    RobotDoorOpenError,
    EngageHeightOutOfRangeError,
    NoTargetTemperatureSetError,
    InvalidTargetSpeedError,
    InvalidTargetTemperatureError,
)

from .error_occurrence import ErrorOccurrence

__all__ = [
    # exceptions
    "ProtocolEngineError",
    "UnexpectedProtocolError",
    "FailedToLoadPipetteError",
    "PipetteNotAttachedError",
    "CommandDoesNotExistError",
    "LabwareNotLoadedError",
    "LabwareDefinitionDoesNotExistError",
    "LabwareOffsetDoesNotExistError",
    "LabwareIsNotTipRackError",
    "WellDoesNotExistError",
    "PipetteNotLoadedError",
    "PipetteTipInfoNotFoundError",
    "ModuleNotLoadedError",
    "SlotDoesNotExistError",
    "FailedToPlanMoveError",
    "MustHomeError",
    "ProtocolEngineStoppedError",
    "WellOriginNotAllowedError",
    "ModuleNotAttachedError",
    "ModuleAlreadyPresentError",
    "WrongModuleTypeError",
    "ThermocyclerNotOpenError",
    "RobotDoorOpenError",
    "EngageHeightOutOfRangeError",
    "NoTargetTemperatureSetError",
    "InvalidTargetTemperatureError",
    "InvalidTargetSpeedError",
    # error occurrence models
    "ErrorOccurrence",
]
