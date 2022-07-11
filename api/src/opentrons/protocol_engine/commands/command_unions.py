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

from .move_to_coordinates import (
    MoveToCoordinates,
    MoveToCoordinatesParams,
    MoveToCoordinatesCreate,
    MoveToCoordinatesResult,
    MoveToCoordinatesCommandType,
)

from .move_to_well import (
    MoveToWell,
    MoveToWellParams,
    MoveToWellCreate,
    MoveToWellResult,
    MoveToWellCommandType,
)

from .wait_for_resume import (
    WaitForResume,
    WaitForResumeParams,
    WaitForResumeCreate,
    WaitForResumeResult,
    WaitForResumeCommandType,
)

from .wait_for_duration import (
    WaitForDuration,
    WaitForDurationParams,
    WaitForDurationCreate,
    WaitForDurationResult,
    WaitForDurationCommandType,
)

from .pick_up_tip import (
    PickUpTip,
    PickUpTipParams,
    PickUpTipCreate,
    PickUpTipResult,
    PickUpTipCommandType,
)

from .touch_tip import (
    TouchTip,
    TouchTipParams,
    TouchTipCreate,
    TouchTipResult,
    TouchTipCommandType,
)

from .save_position import (
    SavePosition,
    SavePositionParams,
    SavePositionCreate,
    SavePositionResult,
    SavePositionCommandType,
)

from .blow_out import (
    BlowOutParams,
    BlowOut,
    BlowOutCreate,
    BlowOutCommandType,
    BlowOutResult,
)

Command = Union[
    Aspirate,
    Custom,
    Dispense,
    BlowOut,
    DropTip,
    Home,
    LoadLabware,
    LoadModule,
    LoadPipette,
    MoveRelative,
    MoveToCoordinates,
    MoveToWell,
    WaitForResume,
    WaitForDuration,
    PickUpTip,
    SavePosition,
    SetRailLights,
    TouchTip,
    heater_shaker.WaitForTemperature,
    heater_shaker.SetTargetTemperature,
    heater_shaker.DeactivateHeater,
    heater_shaker.SetAndWaitForShakeSpeed,
    heater_shaker.DeactivateShaker,
    heater_shaker.OpenLabwareLatch,
    heater_shaker.CloseLabwareLatch,
    magnetic_module.Disengage,
    magnetic_module.Engage,
    temperature_module.SetTargetTemperature,
    temperature_module.WaitForTemperature,
    temperature_module.DeactivateTemperature,
    thermocycler.SetTargetBlockTemperature,
    thermocycler.WaitForBlockTemperature,
    thermocycler.SetTargetLidTemperature,
    thermocycler.WaitForLidTemperature,
    thermocycler.DeactivateBlock,
    thermocycler.DeactivateLid,
    thermocycler.OpenLid,
    thermocycler.CloseLid,
    thermocycler.RunProfile,
]

CommandParams = Union[
    AspirateParams,
    CustomParams,
    DispenseParams,
    BlowOutParams,
    DropTipParams,
    HomeParams,
    LoadLabwareParams,
    LoadModuleParams,
    LoadPipetteParams,
    MoveRelativeParams,
    MoveToCoordinatesParams,
    MoveToWellParams,
    WaitForResumeParams,
    WaitForDurationParams,
    PickUpTipParams,
    SavePositionParams,
    SetRailLightsParams,
    TouchTipParams,
    heater_shaker.WaitForTemperatureParams,
    heater_shaker.SetTargetTemperatureParams,
    heater_shaker.DeactivateHeaterParams,
    heater_shaker.SetAndWaitForShakeSpeedParams,
    heater_shaker.DeactivateShakerParams,
    heater_shaker.OpenLabwareLatchParams,
    heater_shaker.CloseLabwareLatchParams,
    magnetic_module.DisengageParams,
    magnetic_module.EngageParams,
    temperature_module.SetTargetTemperatureParams,
    temperature_module.WaitForTemperatureParams,
    temperature_module.DeactivateTemperatureParams,
    thermocycler.SetTargetBlockTemperatureParams,
    thermocycler.WaitForBlockTemperatureParams,
    thermocycler.SetTargetLidTemperatureParams,
    thermocycler.WaitForLidTemperatureParams,
    thermocycler.DeactivateBlockParams,
    thermocycler.DeactivateLidParams,
    thermocycler.OpenLidParams,
    thermocycler.CloseLidParams,
    thermocycler.RunProfileParams,
    thermocycler.RunProfileStepParams,
]

CommandType = Union[
    AspirateCommandType,
    CustomCommandType,
    DispenseCommandType,
    BlowOutCommandType,
    DropTipCommandType,
    HomeCommandType,
    LoadLabwareCommandType,
    LoadModuleCommandType,
    LoadPipetteCommandType,
    MoveRelativeCommandType,
    MoveToCoordinatesCommandType,
    MoveToWellCommandType,
    WaitForResumeCommandType,
    WaitForDurationCommandType,
    PickUpTipCommandType,
    SavePositionCommandType,
    SetRailLightsCommandType,
    TouchTipCommandType,
    heater_shaker.WaitForTemperatureCommandType,
    heater_shaker.SetTargetTemperatureCommandType,
    heater_shaker.DeactivateHeaterCommandType,
    heater_shaker.SetAndWaitForShakeSpeedCommandType,
    heater_shaker.DeactivateShakerCommandType,
    heater_shaker.OpenLabwareLatchCommandType,
    heater_shaker.CloseLabwareLatchCommandType,
    magnetic_module.DisengageCommandType,
    magnetic_module.EngageCommandType,
    temperature_module.SetTargetTemperatureCommandType,
    temperature_module.WaitForTemperatureCommandType,
    temperature_module.DeactivateTemperatureCommandType,
    thermocycler.SetTargetBlockTemperatureCommandType,
    thermocycler.WaitForBlockTemperatureCommandType,
    thermocycler.SetTargetLidTemperatureCommandType,
    thermocycler.WaitForLidTemperatureCommandType,
    thermocycler.DeactivateBlockCommandType,
    thermocycler.DeactivateLidCommandType,
    thermocycler.OpenLidCommandType,
    thermocycler.CloseLidCommandType,
    thermocycler.RunProfileCommandType,
]

CommandCreate = Union[
    AspirateCreate,
    DispenseCreate,
    BlowOutCreate,
    DropTipCreate,
    HomeCreate,
    LoadLabwareCreate,
    LoadModuleCreate,
    LoadPipetteCreate,
    MoveRelativeCreate,
    MoveToCoordinatesCreate,
    MoveToWellCreate,
    WaitForResumeCreate,
    WaitForDurationCreate,
    PickUpTipCreate,
    SavePositionCreate,
    SetRailLightsCreate,
    TouchTipCreate,
    heater_shaker.WaitForTemperatureCreate,
    heater_shaker.SetTargetTemperatureCreate,
    heater_shaker.DeactivateHeaterCreate,
    heater_shaker.SetAndWaitForShakeSpeedCreate,
    heater_shaker.DeactivateShakerCreate,
    heater_shaker.OpenLabwareLatchCreate,
    heater_shaker.CloseLabwareLatchCreate,
    magnetic_module.DisengageCreate,
    magnetic_module.EngageCreate,
    temperature_module.SetTargetTemperatureCreate,
    temperature_module.WaitForTemperatureCreate,
    temperature_module.DeactivateTemperatureCreate,
    thermocycler.SetTargetBlockTemperatureCreate,
    thermocycler.WaitForBlockTemperatureCreate,
    thermocycler.SetTargetLidTemperatureCreate,
    thermocycler.WaitForLidTemperatureCreate,
    thermocycler.DeactivateBlockCreate,
    thermocycler.DeactivateLidCreate,
    thermocycler.OpenLidCreate,
    thermocycler.CloseLidCreate,
    thermocycler.RunProfileCreate,
]

CommandResult = Union[
    AspirateResult,
    CustomResult,
    DispenseResult,
    BlowOutResult,
    DropTipResult,
    HomeResult,
    LoadLabwareResult,
    LoadModuleResult,
    LoadPipetteResult,
    MoveRelativeResult,
    MoveToCoordinatesResult,
    MoveToWellResult,
    WaitForResumeResult,
    WaitForDurationResult,
    PickUpTipResult,
    SavePositionResult,
    SetRailLightsResult,
    TouchTipResult,
    heater_shaker.WaitForTemperatureResult,
    heater_shaker.SetTargetTemperatureResult,
    heater_shaker.DeactivateHeaterResult,
    heater_shaker.SetAndWaitForShakeSpeedResult,
    heater_shaker.DeactivateShakerResult,
    heater_shaker.OpenLabwareLatchResult,
    heater_shaker.CloseLabwareLatchResult,
    magnetic_module.DisengageResult,
    magnetic_module.EngageResult,
    temperature_module.SetTargetTemperatureResult,
    temperature_module.WaitForTemperatureResult,
    temperature_module.DeactivateTemperatureResult,
    thermocycler.SetTargetBlockTemperatureResult,
    thermocycler.WaitForBlockTemperatureResult,
    thermocycler.SetTargetLidTemperatureResult,
    thermocycler.WaitForLidTemperatureResult,
    thermocycler.DeactivateBlockResult,
    thermocycler.DeactivateLidResult,
    thermocycler.OpenLidResult,
    thermocycler.CloseLidResult,
    thermocycler.RunProfileResult,
]
