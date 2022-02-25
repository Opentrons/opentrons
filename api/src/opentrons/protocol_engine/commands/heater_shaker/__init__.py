"""Heater-Shaker Module protocol commands."""

from .await_temperature import (
    AwaitTemperature,
    AwaitTemperatureCreate,
    AwaitTemperatureParams,
    AwaitTemperatureResult,
    AwaitTemperatureCommandType,
)

from .start_set_target_temperature import (
    StartSetTargetTemperature,
    StartSetTargetTemperatureCreate,
    StartSetTargetTemperatureParams,
    StartSetTargetTemperatureResult,
    StartSetTargetTemperatureCommandType,
)

from .deactivate_heater import (
    DeactivateHeater,
    DeactivateHeaterCreate,
    DeactivateHeaterParams,
    DeactivateHeaterResult,
    DeactivateHeaterCommandType,
)

from .set_target_shake_speed import (
    SetTargetShakeSpeed,
    SetTargetShakeSpeedCreate,
    SetTargetShakeSpeedParams,
    SetTargetShakeSpeedResult,
    SetTargetShakeSpeedCommandType,
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
    # heaterShakerModule/startSetTargetTemperature
    "StartSetTargetTemperature",
    "StartSetTargetTemperatureCreate",
    "StartSetTargetTemperatureParams",
    "StartSetTargetTemperatureResult",
    "StartSetTargetTemperatureCommandType",
    # heaterShakerModule/deactivateHeater
    "DeactivateHeater",
    "DeactivateHeaterCreate",
    "DeactivateHeaterParams",
    "DeactivateHeaterResult",
    "DeactivateHeaterCommandType",
    # heaterShakerModule/setTargetShakeSpeed
    "SetTargetShakeSpeed",
    "SetTargetShakeSpeedCreate",
    "SetTargetShakeSpeedParams",
    "SetTargetShakeSpeedResult",
    "SetTargetShakeSpeedCommandType",
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
