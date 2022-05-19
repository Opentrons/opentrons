"""Union types of concrete command definitions."""

from typing import Union

from . import heater_shaker
from . import magnetic_module
from . import temperature_module
from . import thermocycler

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
    SetRailLights,
    heater_shaker.WaitForTemperature,
    heater_shaker.SetTargetTemperature,
    heater_shaker.DeactivateHeater,
    heater_shaker.SetAndWaitForShakeSpeed,
    heater_shaker.StopShake,
    heater_shaker.OpenLatch,
    heater_shaker.CloseLatch,
    magnetic_module.Disengage,
    magnetic_module.Engage,
    temperature_module.SetTargetTemperature,
    temperature_module.WaitForTemperature,
    temperature_module.DeactivateTemperature,
    thermocycler.SetTargetBlockTemperature,
    thermocycler.SetTargetLidTemperature,
    thermocycler.DeactivateBlock,
    thermocycler.DeactivateLid,
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
    SetRailLightsParams,
    heater_shaker.WaitForTemperatureParams,
    heater_shaker.SetTargetTemperatureParams,
    heater_shaker.DeactivateHeaterParams,
    heater_shaker.SetAndWaitForShakeSpeedParams,
    heater_shaker.StopShakeParams,
    heater_shaker.OpenLatchParams,
    heater_shaker.CloseLatchParams,
    magnetic_module.DisengageParams,
    magnetic_module.EngageParams,
    temperature_module.SetTargetTemperatureParams,
    temperature_module.WaitForTemperatureParams,
    temperature_module.DeactivateTemperatureParams,
    thermocycler.SetTargetBlockTemperatureParams,
    thermocycler.SetTargetLidTemperatureParams,
    thermocycler.DeactivateBlockParams,
    thermocycler.DeactivateLidParams,
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
    SetRailLightsCommandType,
    heater_shaker.WaitForTemperatureCommandType,
    heater_shaker.SetTargetTemperatureCommandType,
    heater_shaker.DeactivateHeaterCommandType,
    heater_shaker.SetAndWaitForShakeSpeedCommandType,
    heater_shaker.StopShakeCommandType,
    heater_shaker.OpenLatchCommandType,
    heater_shaker.CloseLatchCommandType,
    magnetic_module.DisengageCommandType,
    magnetic_module.EngageCommandType,
    temperature_module.SetTargetTemperatureCommandType,
    temperature_module.WaitForTemperatureCommandType,
    temperature_module.DeactivateTemperatureCommandType,
    thermocycler.SetTargetBlockTemperatureCommandType,
    thermocycler.SetTargetLidTemperatureCommandType,
    thermocycler.DeactivateBlockCommandType,
    thermocycler.DeactivateLidCommandType,
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
    SetRailLightsCreate,
    heater_shaker.WaitForTemperatureCreate,
    heater_shaker.SetTargetTemperatureCreate,
    heater_shaker.DeactivateHeaterCreate,
    heater_shaker.SetAndWaitForShakeSpeedCreate,
    heater_shaker.StopShakeCreate,
    heater_shaker.OpenLatchCreate,
    heater_shaker.CloseLatchCreate,
    magnetic_module.DisengageCreate,
    magnetic_module.EngageCreate,
    temperature_module.SetTargetTemperatureCreate,
    temperature_module.WaitForTemperatureCreate,
    temperature_module.DeactivateTemperatureCreate,
    thermocycler.SetTargetBlockTemperatureCreate,
    thermocycler.SetTargetLidTemperatureCreate,
    thermocycler.DeactivateBlockCreate,
    thermocycler.DeactivateLidCreate,
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
    SetRailLightsResult,
    heater_shaker.WaitForTemperatureResult,
    heater_shaker.SetTargetTemperatureResult,
    heater_shaker.DeactivateHeaterResult,
    heater_shaker.SetAndWaitForShakeSpeedResult,
    heater_shaker.StopShakeResult,
    heater_shaker.OpenLatchResult,
    heater_shaker.CloseLatchResult,
    magnetic_module.DisengageResult,
    magnetic_module.EngageResult,
    temperature_module.SetTargetTemperatureResult,
    temperature_module.WaitForTemperatureResult,
    temperature_module.DeactivateTemperatureResult,
    thermocycler.SetTargetBlockTemperatureResult,
    thermocycler.SetTargetLidTemperatureResult,
    thermocycler.DeactivateBlockResult,
    thermocycler.DeactivateLidResult,
]
