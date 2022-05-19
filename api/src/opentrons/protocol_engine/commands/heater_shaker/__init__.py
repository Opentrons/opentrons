"""Heater-Shaker Module protocol commands."""

from .wait_for_temperature import (
    WaitForTemperature,
    WaitForTemperatureCreate,
    WaitForTemperatureParams,
    WaitForTemperatureResult,
    WaitForTemperatureCommandType,
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

from .set_and_wait_for_shake_speed import (
    SetAndWaitForShakeSpeed,
    SetAndWaitForShakeSpeedCreate,
    SetAndWaitForShakeSpeedParams,
    SetAndWaitForShakeSpeedResult,
    SetAndWaitForShakeSpeedCommandType,
)

from .stop_shake import (
    DeactivateShaker,
    DeactivateShakerCreate,
    DeactivateShakerParams,
    DeactivateShakerResult,
    DeactivateShakerCommandType,
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
    # heaterShakerModule/waitForTemperature
    "WaitForTemperature",
    "WaitForTemperatureCreate",
    "WaitForTemperatureParams",
    "WaitForTemperatureResult",
    "WaitForTemperatureCommandType",
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
    # heaterShakerModule/deactivateShaker
    "DeactivateShaker",
    "DeactivateShakerCreate",
    "DeactivateShakerParams",
    "DeactivateShakerResult",
    "DeactivateShakerCommandType",
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
