"""Temperature Module protocol commands."""

from .deactivate import (
    DeactivateTemperature,
    DeactivateTemperatureCommandType,
    DeactivateTemperatureCreate,
    DeactivateTemperatureParams,
    DeactivateTemperatureResult,
)
from .set_target_temperature import (
    SetTargetTemperature,
    SetTargetTemperatureCommandType,
    SetTargetTemperatureCreate,
    SetTargetTemperatureParams,
    SetTargetTemperatureResult,
)
from .wait_for_temperature import (
    WaitForTemperature,
    WaitForTemperatureCommandType,
    WaitForTemperatureCreate,
    WaitForTemperatureParams,
    WaitForTemperatureResult,
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
