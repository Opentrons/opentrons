"""Protocol engine errors module."""

from .exceptions import (
    ProtocolEngineError,
    UnexpectedProtocolError,
    FailedToLoadPipetteError,
    PipetteNotAttachedError,
    CommandDoesNotExistError,
    LabwareNotLoadedError,
    LabwareNotLoadedOnModuleError,
    LabwareNotOnDeckError,
    LiquidDoesNotExistError,
    LabwareDefinitionDoesNotExistError,
    LabwareOffsetDoesNotExistError,
    LabwareIsNotTipRackError,
    LabwareIsTipRackError,
    TouchTipDisabledError,
    WellDoesNotExistError,
    PipetteNotLoadedError,
    PipetteTipInfoNotFoundError,
    ModuleNotLoadedError,
    ModuleNotOnDeckError,
    SlotDoesNotExistError,
    FailedToPlanMoveError,
    MustHomeError,
    RunStoppedError,
    SetupCommandNotAllowedError,
    WellOriginNotAllowedError,
    ModuleNotAttachedError,
    ModuleAlreadyPresentError,
    WrongModuleTypeError,
    ThermocyclerNotOpenError,
    RobotDoorOpenError,
    PipetteMovementRestrictedByHeaterShakerError,
    HeaterShakerLabwareLatchNotOpenError,
    EngageHeightOutOfRangeError,
    NoTargetTemperatureSetError,
    InvalidTargetSpeedError,
    InvalidTargetTemperatureError,
    InvalidBlockVolumeError,
    CannotPerformModuleAction,
    PauseNotAllowedError,
    ProtocolCommandFailedError,
    GripperNotAttachedError,
    HardwareNotSupportedError,
    LabwareMovementNotAllowedError,
    LocationIsOccupiedError,
    AmbiguousLoadLabwareParamsError,
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
    "LabwareNotLoadedOnModuleError",
    "LabwareNotOnDeckError",
    "LiquidDoesNotExistError",
    "LabwareDefinitionDoesNotExistError",
    "LabwareOffsetDoesNotExistError",
    "LabwareIsNotTipRackError",
    "LabwareIsTipRackError",
    "TouchTipDisabledError",
    "WellDoesNotExistError",
    "PipetteNotLoadedError",
    "PipetteTipInfoNotFoundError",
    "ModuleNotLoadedError",
    "ModuleNotOnDeckError",
    "SlotDoesNotExistError",
    "FailedToPlanMoveError",
    "MustHomeError",
    "RunStoppedError",
    "SetupCommandNotAllowedError",
    "WellOriginNotAllowedError",
    "ModuleNotAttachedError",
    "ModuleAlreadyPresentError",
    "WrongModuleTypeError",
    "ThermocyclerNotOpenError",
    "RobotDoorOpenError",
    "PipetteMovementRestrictedByHeaterShakerError",
    "HeaterShakerLabwareLatchNotOpenError",
    "EngageHeightOutOfRangeError",
    "NoTargetTemperatureSetError",
    "InvalidTargetTemperatureError",
    "InvalidTargetSpeedError",
    "InvalidBlockVolumeError",
    "CannotPerformModuleAction",
    "PauseNotAllowedError",
    "ProtocolCommandFailedError",
    "GripperNotAttachedError",
    "HardwareNotSupportedError",
    "LabwareMovementNotAllowedError",
    "LocationIsOccupiedError",
    "AmbiguousLoadLabwareParamsError",
    # error occurrence models
    "ErrorOccurrence",
]
