"""Temperature Module protocol commands."""

from .set_target_temperature import (
    SetTargetTemperature,
    SetTargetTemperatureCreate,
    SetTargetTemperatureParams,
    SetTargetTemperatureResult,
    SetTargetTemperatureCommandType
)

from .await_temperature import (
    AwaitTemperature,
    AwaitTemperatureCreate,
    AwaitTemperatureParams,
    AwaitTemperatureResult,
    AwaitTemperatureCommandType
)

__all__ = [
    # temperatureModule/setTargetTemperature
    "SetTargetTemperature",
    "SetTargetTemperatureCreate",
    "SetTargetTemperatureParams",
    "SetTargetTemperatureResult",
    "SetTargetTemperatureCommandType",
    # temperatureModule/awaitTemperature
    "AwaitTemperature",
    "AwaitTemperatureCreate",
    "AwaitTemperatureParams",
    "AwaitTemperatureResult",
    "AwaitTemperatureCommandType",
]
