"""Union types of concrete command definitions."""

from typing import Union

from . import heater_shaker
from . import magnetic_module
from . import temperature_module
from . import thermocycler

from . import calibration

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

from .aspirate_in_place import (
    AspirateInPlace,
    AspirateInPlaceParams,
    AspirateInPlaceCreate,
    AspirateInPlaceResult,
    AspirateInPlaceCommandType,
)

from .comment import (
    Comment,
    CommentParams,
    CommentCreate,
    CommentResult,
    CommentCommandType,
)

from .custom import (
    Custom,
    CustomParams,
    CustomCreate,
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

from .dispense_in_place import (
    DispenseInPlace,
    DispenseInPlaceParams,
    DispenseInPlaceCreate,
    DispenseInPlaceResult,
    DispenseInPlaceCommandType,
)

from .drop_tip import (
    DropTip,
    DropTipParams,
    DropTipCreate,
    DropTipResult,
    DropTipCommandType,
)

from .drop_tip_in_place import (
    DropTipInPlace,
    DropTipInPlaceParams,
    DropTipInPlaceCreate,
    DropTipInPlaceResult,
    DropTipInPlaceCommandType,
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

from .load_liquid import (
    LoadLiquid,
    LoadLiquidParams,
    LoadLiquidCreate,
    LoadLiquidResult,
    LoadLiquidCommandType,
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

from .move_labware import (
    MoveLabware,
    MoveLabwareParams,
    MoveLabwareCreate,
    MoveLabwareResult,
    MoveLabwareCommandType,
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

from .blow_out_in_place import (
    BlowOutInPlaceParams,
    BlowOutInPlace,
    BlowOutInPlaceCreate,
    BlowOutInPlaceCommandType,
    BlowOutInPlaceResult,
)

from .set_status_bar import (
    SetStatusBar,
    SetStatusBarParams,
    SetStatusBarCreate,
    SetStatusBarResult,
    SetStatusBarCommandType,
)

from .retract_axis import (
    RetractAxis,
    RetractAxisParams,
    RetractAxisCreate,
    RetractAxisResult,
    RetractAxisCommandType,
)

Command = Union[
    Aspirate,
    AspirateInPlace,
    Comment,
    Custom,
    Dispense,
    DispenseInPlace,
    BlowOut,
    BlowOutInPlace,
    DropTip,
    DropTipInPlace,
    Home,
    RetractAxis,
    LoadLabware,
    LoadLiquid,
    LoadModule,
    LoadPipette,
    MoveLabware,
    MoveRelative,
    MoveToCoordinates,
    MoveToWell,
    WaitForResume,
    WaitForDuration,
    PickUpTip,
    SavePosition,
    SetRailLights,
    TouchTip,
    SetStatusBar,
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
    calibration.CalibrateGripper,
    calibration.CalibratePipette,
    calibration.CalibrateModule,
    calibration.MoveToMaintenancePosition,
]

CommandParams = Union[
    AspirateParams,
    AspirateInPlaceParams,
    CommentParams,
    CustomParams,
    DispenseParams,
    DispenseInPlaceParams,
    BlowOutParams,
    BlowOutInPlaceParams,
    DropTipParams,
    DropTipInPlaceParams,
    HomeParams,
    RetractAxisParams,
    LoadLabwareParams,
    LoadLiquidParams,
    LoadModuleParams,
    LoadPipetteParams,
    MoveLabwareParams,
    MoveRelativeParams,
    MoveToCoordinatesParams,
    MoveToWellParams,
    WaitForResumeParams,
    WaitForDurationParams,
    PickUpTipParams,
    SavePositionParams,
    SetRailLightsParams,
    TouchTipParams,
    SetStatusBarParams,
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
    calibration.CalibrateGripperParams,
    calibration.CalibratePipetteParams,
    calibration.CalibrateModuleParams,
    calibration.MoveToMaintenancePositionParams,
]

CommandType = Union[
    AspirateCommandType,
    AspirateInPlaceCommandType,
    CommentCommandType,
    CustomCommandType,
    DispenseCommandType,
    DispenseInPlaceCommandType,
    BlowOutCommandType,
    BlowOutInPlaceCommandType,
    DropTipCommandType,
    DropTipInPlaceCommandType,
    HomeCommandType,
    RetractAxisCommandType,
    LoadLabwareCommandType,
    LoadLiquidCommandType,
    LoadModuleCommandType,
    LoadPipetteCommandType,
    MoveLabwareCommandType,
    MoveRelativeCommandType,
    MoveToCoordinatesCommandType,
    MoveToWellCommandType,
    WaitForResumeCommandType,
    WaitForDurationCommandType,
    PickUpTipCommandType,
    SavePositionCommandType,
    SetRailLightsCommandType,
    TouchTipCommandType,
    SetStatusBarCommandType,
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
    calibration.CalibrateGripperCommandType,
    calibration.CalibratePipetteCommandType,
    calibration.CalibrateModuleCommandType,
    calibration.MoveToMaintenancePositionCommandType,
]

CommandCreate = Union[
    AspirateCreate,
    AspirateInPlaceCreate,
    CommentCreate,
    CustomCreate,
    DispenseCreate,
    DispenseInPlaceCreate,
    BlowOutCreate,
    BlowOutInPlaceCreate,
    DropTipCreate,
    DropTipInPlaceCreate,
    HomeCreate,
    RetractAxisCreate,
    LoadLabwareCreate,
    LoadLiquidCreate,
    LoadModuleCreate,
    LoadPipetteCreate,
    MoveLabwareCreate,
    MoveRelativeCreate,
    MoveToCoordinatesCreate,
    MoveToWellCreate,
    WaitForResumeCreate,
    WaitForDurationCreate,
    PickUpTipCreate,
    SavePositionCreate,
    SetRailLightsCreate,
    TouchTipCreate,
    SetStatusBarCreate,
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
    calibration.CalibrateGripperCreate,
    calibration.CalibratePipetteCreate,
    calibration.CalibrateModuleCreate,
    calibration.MoveToMaintenancePositionCreate,
]

CommandResult = Union[
    AspirateResult,
    AspirateInPlaceResult,
    CommentResult,
    CustomResult,
    DispenseResult,
    DispenseInPlaceResult,
    BlowOutResult,
    BlowOutInPlaceResult,
    DropTipResult,
    DropTipInPlaceResult,
    HomeResult,
    RetractAxisResult,
    LoadLabwareResult,
    LoadLiquidResult,
    LoadModuleResult,
    LoadPipetteResult,
    MoveLabwareResult,
    MoveRelativeResult,
    MoveToCoordinatesResult,
    MoveToWellResult,
    WaitForResumeResult,
    WaitForDurationResult,
    PickUpTipResult,
    SavePositionResult,
    SetRailLightsResult,
    TouchTipResult,
    SetStatusBarResult,
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
    calibration.CalibrateGripperResult,
    calibration.CalibratePipetteResult,
    calibration.CalibrateModuleResult,
    calibration.MoveToMaintenancePositionResult,
]
