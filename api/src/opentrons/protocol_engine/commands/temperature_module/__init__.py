"""Temperature Module protocol commands."""

from .set_target_temperature import (
    SetTargetTemperature,
    SetTargetTemperatureCreate,
    SetTargetTemperatureParams,
    SetTargetTemperatureResult,
    SetTargetTemperatureCommandType,
)

from .wait_for_temperature import (
    WaitForTemperature,
    WaitForTemperatureCreate,
    WaitForTemperatureParams,
    WaitForTemperatureResult,
    WaitForTemperatureCommandType,
)

from .deactivate import (
    DeactivateTemperature,
    DeactivateTemperatureCreate,
    DeactivateTemperatureParams,
    DeactivateTemperatureResult,
    DeactivateTemperatureCommandType,
)

__all__ = [
    # temperatureModule/setTargetTemperature
    "SetTargetTemperature",
    "SetTargetTemperatureCreate",
    "SetTargetTemperatureParams",
    "SetTargetTemperatureResult",
    "SetTargetTemperatureCommandType",
    # temperatureModule/waitForTemperature
    "WaitForTemperature",
    "WaitForTemperatureCreate",
    "WaitForTemperatureParams",
    "WaitForTemperatureResult",
    "WaitForTemperatureCommandType",
    # temperatureModule/deactivateTemperature
    "DeactivateTemperature",
    "DeactivateTemperatureCreate",
    "DeactivateTemperatureParams",
    "DeactivateTemperatureResult",
    "DeactivateTemperatureCommandType",
]
