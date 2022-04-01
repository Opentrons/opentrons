"""Union types of concrete command definitions."""

from typing import Union

from . import heater_shaker
from . import magnetic_module

from .set_rail_lights import (
    SetRailLights,
    SetRailLightsCommandType,
    SetRailLightsCreate,
    SetRailLightsParams,
    SetRailLightsResult,
)

from .aspirate import (
    Aspirate,
    AspirateParams,
    AspirateCreate,
    AspirateResult,
    AspirateCommandType,
)

from .custom import (
    Custom,
    CustomParams,
    CustomResult,
    CustomCommandType,
)

from .dispense import (
    Dispense,
    DispenseParams,
    DispenseCreate,
    DispenseResult,
    DispenseCommandType,
)

from .drop_tip import (
    DropTip,
    DropTipParams,
    DropTipCreate,
    DropTipResult,
    DropTipCommandType,
)

from .home import (
    Home,
    HomeParams,
    HomeCreate,
    HomeResult,
    HomeCommandType,
)

from .load_labware import (
    LoadLabware,
    LoadLabwareParams,
    LoadLabwareCreate,
    LoadLabwareResult,
    LoadLabwareCommandType,
)

from .load_module import (
    LoadModule,
    LoadModuleParams,
    LoadModuleCreate,
    LoadModuleResult,
    LoadModuleCommandType,
)

from .load_pipette import (
    LoadPipette,
    LoadPipetteParams,
    LoadPipetteCreate,
    LoadPipetteResult,
    LoadPipetteCommandType,
)

from .move_relative import (
    MoveRelative,
    MoveRelativeParams,
    MoveRelativeCreate,
    MoveRelativeResult,
    MoveRelativeCommandType,
)

from .move_to_well import (
    MoveToWell,
    MoveToWellParams,
    MoveToWellCreate,
    MoveToWellResult,
    MoveToWellCommandType,
)

from .pause import (
    Pause,
    PauseParams,
    PauseCreate,
    PauseResult,
    PauseCommandType,
)

from .pick_up_tip import (
    PickUpTip,
    PickUpTipParams,
    PickUpTipCreate,
    PickUpTipResult,
    PickUpTipCommandType,
)

from .save_position import (
    SavePosition,
    SavePositionParams,
    SavePositionCreate,
    SavePositionResult,
    SavePositionCommandType,
)

Command = Union[
    Aspirate,
    Custom,
    Dispense,
    DropTip,
    Home,
    LoadLabware,
    LoadModule,
    LoadPipette,
    MoveRelative,
    MoveToWell,
    Pause,
    PickUpTip,
    SavePosition,
    heater_shaker.AwaitTemperature,
    heater_shaker.StartSetTargetTemperature,
    heater_shaker.DeactivateHeater,
    heater_shaker.SetTargetShakeSpeed,
    heater_shaker.StopShake,
    heater_shaker.OpenLatch,
    heater_shaker.CloseLatch,
    magnetic_module.Disengage,
    magnetic_module.Engage,
    SetRailLights,
]

CommandParams = Union[
    AspirateParams,
    CustomParams,
    DispenseParams,
    DropTipParams,
    HomeParams,
    LoadLabwareParams,
    LoadModuleParams,
    LoadPipetteParams,
    MoveRelativeParams,
    MoveToWellParams,
    PauseParams,
    PickUpTipParams,
    SavePositionParams,
    heater_shaker.AwaitTemperatureParams,
    heater_shaker.StartSetTargetTemperatureParams,
    heater_shaker.DeactivateHeaterParams,
    heater_shaker.SetTargetShakeSpeedParams,
    heater_shaker.StopShakeParams,
    heater_shaker.OpenLatchParams,
    heater_shaker.CloseLatchParams,
    magnetic_module.DisengageParams,
    magnetic_module.EngageParams,
    SetRailLightsParams,
]

CommandType = Union[
    AspirateCommandType,
    CustomCommandType,
    DispenseCommandType,
    DropTipCommandType,
    HomeCommandType,
    LoadLabwareCommandType,
    LoadModuleCommandType,
    LoadPipetteCommandType,
    MoveRelativeCommandType,
    MoveToWellCommandType,
    PauseCommandType,
    PickUpTipCommandType,
    SavePositionCommandType,
    heater_shaker.AwaitTemperatureCommandType,
    heater_shaker.StartSetTargetTemperatureCommandType,
    heater_shaker.DeactivateHeaterCommandType,
    heater_shaker.SetTargetShakeSpeedCommandType,
    heater_shaker.StopShakeCommandType,
    heater_shaker.OpenLatchCommandType,
    heater_shaker.CloseLatchCommandType,
    magnetic_module.DisengageCommandType,
    magnetic_module.EngageCommandType,
    SetRailLightsCommandType,
]

CommandCreate = Union[
    AspirateCreate,
    DispenseCreate,
    DropTipCreate,
    HomeCreate,
    LoadLabwareCreate,
    LoadModuleCreate,
    LoadPipetteCreate,
    MoveRelativeCreate,
    MoveToWellCreate,
    PauseCreate,
    PickUpTipCreate,
    SavePositionCreate,
    heater_shaker.AwaitTemperatureCreate,
    heater_shaker.StartSetTargetTemperatureCreate,
    heater_shaker.DeactivateHeaterCreate,
    heater_shaker.SetTargetShakeSpeedCreate,
    heater_shaker.StopShakeCreate,
    heater_shaker.OpenLatchCreate,
    heater_shaker.CloseLatchCreate,
    magnetic_module.DisengageCreate,
    magnetic_module.EngageCreate,
    SetRailLightsCreate,
]

CommandResult = Union[
    AspirateResult,
    CustomResult,
    DispenseResult,
    DropTipResult,
    HomeResult,
    LoadLabwareResult,
    LoadModuleResult,
    LoadPipetteResult,
    MoveRelativeResult,
    MoveToWellResult,
    PauseResult,
    PickUpTipResult,
    SavePositionResult,
    heater_shaker.AwaitTemperatureResult,
    heater_shaker.StartSetTargetTemperatureResult,
    heater_shaker.DeactivateHeaterResult,
    heater_shaker.SetTargetShakeSpeedResult,
    heater_shaker.StopShakeResult,
    heater_shaker.OpenLatchResult,
    heater_shaker.CloseLatchResult,
    magnetic_module.DisengageResult,
    magnetic_module.EngageResult,
    SetRailLightsResult,
]
