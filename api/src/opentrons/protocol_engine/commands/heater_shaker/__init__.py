"""Heater-Shaker Module protocol commands."""

from .await_temperature import (
    AwaitTemperature,
    AwaitTemperatureCreate,
    AwaitTemperatureParams,
    AwaitTemperatureResult,
    AwaitTemperatureCommandType,
)

from .set_target_temperature import (
    SetTargetTemperature,
    SetTargetTemperatureCreate,
    SetTargetTemperatureParams,
    SetTargetTemperatureResult,
    SetTargetTemperatureCommandType,
)

from .deactivate_heater import (
    DeactivateHeater,
    DeactivateHeaterCreate,
    DeactivateHeaterParams,
    DeactivateHeaterResult,
    DeactivateHeaterCommandType,
)

from .set_target_shake_speed import (
    SetAndWaitForShakeSpeed,
    SetAndWaitForShakeSpeedCreate,
    SetAndWaitForShakeSpeedParams,
    SetAndWaitForShakeSpeedResult,
    SetAndWaitForShakeSpeedCommandType,
)

from .stop_shake import (
    StopShake,
    StopShakeCreate,
    StopShakeParams,
    StopShakeResult,
    StopShakeCommandType,
)

from .open_latch import (
    OpenLatch,
    OpenLatchCreate,
    OpenLatchParams,
    OpenLatchResult,
    OpenLatchCommandType,
)

from .close_latch import (
    CloseLatch,
    CloseLatchCreate,
    CloseLatchParams,
    CloseLatchResult,
    CloseLatchCommandType,
)

__all__ = [
    # heaterShakerModule/awaitTemperature
    "AwaitTemperature",
    "AwaitTemperatureCreate",
    "AwaitTemperatureParams",
    "AwaitTemperatureResult",
    "AwaitTemperatureCommandType",
    # heaterShakerModule/setTargetTemperature
    "SetTargetTemperature",
    "SetTargetTemperatureCreate",
    "SetTargetTemperatureParams",
    "SetTargetTemperatureResult",
    "SetTargetTemperatureCommandType",
    # heaterShakerModule/deactivateHeater
    "DeactivateHeater",
    "DeactivateHeaterCreate",
    "DeactivateHeaterParams",
    "DeactivateHeaterResult",
    "DeactivateHeaterCommandType",
    # heaterShakerModule/setAndWaitForShakeSpeed
    "SetAndWaitForShakeSpeed",
    "SetAndWaitForShakeSpeedCreate",
    "SetAndWaitForShakeSpeedParams",
    "SetAndWaitForShakeSpeedResult",
    "SetAndWaitForShakeSpeedCommandType",
    # heaterShakerModule/stopShake
    "StopShake",
    "StopShakeCreate",
    "StopShakeParams",
    "StopShakeResult",
    "StopShakeCommandType",
    # heaterShakerModule/openLatch
    "OpenLatch",
    "OpenLatchCreate",
    "OpenLatchParams",
    "OpenLatchResult",
    "OpenLatchCommandType",
    # heaterShakerModule/closeLatch
    "CloseLatch",
    "CloseLatchCreate",
    "CloseLatchParams",
    "CloseLatchResult",
    "CloseLatchCommandType",
]
