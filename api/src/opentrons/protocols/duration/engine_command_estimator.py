import logging
from typing import List, Dict, Callable

from opentrons_shared_data.robot.dev_types import RobotType

import functools

from dataclasses import dataclass

from opentrons.commands import types
from opentrons.protocols.api_support.deck_type import (
    for_simulation as get_deck_type,
)
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocols.duration.errors import DurationEstimatorException
from opentrons.protocol_api.core.legacy.deck import Deck
from opentrons.protocol_engine.commands import (
  Command,
  CommandType,
  magnetic_module,
  temperature_module,
  heater_shaker,
  thermocycler,
  calibration,
  AspirateCommandType,
  AspirateInPlaceCommandType,
  CommentCommandType,
  ConfigureForVolumeCommandType,
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
  Aspirate,
  AspirateInPlace,
  ConfigureForVolume,
  Dispense,
  DispenseInPlace,
  BlowOut,
  BlowOutInPlace,
  DropTip,
  DropTipInPlace,
  Home,
  RetractAxis,
  MoveLabware,
  MoveRelative,
  MoveToCoordinates,
  MoveToWell,
  WaitForDuration,
  PickUpTip,
  TouchTip,
)
from opentrons.types import Location

logger = logging.getLogger(__name__)

def zero_duration(_command: Command, robot_type: RobotType) -> int:
  return 0

def estimate_aspirate(command: Aspirate, robot_type: RobotType) -> int:
  # TODO: estimate with gantry position
  return 999

def estimate_aspirate_in_place(command: AspirateInPlace, robot_type: RobotType) -> int:
  # at most we will move the plunger from min to max, roughly estimating at 2 seconds
  return 2 

def estimate_configure_for_volume(command: ConfigureForVolume, robot_type: RobotType) -> int:
  # at most we will move the plunger a bit, roughly estimating at 1 second
  return 1 

def estimate_dispense(command: Dispense, robot_type: RobotType) -> int:
  # TODO: estimate with gantry position
  return 999

def estimate_dispense_in_place(command: DispenseInPlace, robot_type: RobotType) -> int:
  # at most we will move the plunger from max to min, roughly estimating at 2 seconds
  return 2 

def estimate_blow_out(command: BlowOut, robot_type: RobotType) -> int:
  # TODO: estimate with gantry position
  return 999

def estimate_blow_out_in_place(command: BlowOutInPlace, robot_type: RobotType) -> int:
  # at most we will move the plunger from max to min, roughly estimating at 2 seconds
  return 2 

def estimate_drop_tip(command: DropTip, robot_type: RobotType) -> int:
  # TODO: estimate with gantry position
  return 999

def estimate_drop_tip_in_place(command: DropTipInPlace, robot_type: RobotType) -> int:
  # at most we will move the plunger from max to min, roughly estimating at 2 seconds
  return 2 

def estimate_home(command: Home, robot_type: RobotType) -> int:
  if robot_type == 'OT-2 Standard':
    return 5
  return 3

def estimate_retract_axis(command: RetractAxis, robot_type: RobotType) -> int:
  # at most we will move one axis it's full extent, roughly estimating at 2 seconds
  return 2

def estimate_move_labware(command: MoveLabware, robot_type: RobotType) -> int:
  if command.params.strategy == 'usingGripper':
    # TODO: estimate with gantry position
    return 4
  return 0 

def estimate_move_relative(command: MoveRelative, robot_type: RobotType) -> int:
  # TODO: estimate with gantry speed
  # at most we will move one axis it's full extent, roughly estimating at 2 seconds
  return 2

def estimate_move_to_coordinates(command: MoveToCoordinates, robot_type: RobotType) -> int:
  # TODO: estimate with gantry position
  return 4 

def estimate_move_to_well(command: MoveToWell, robot_type: RobotType) -> int:
  # TODO: estimate with gantry position
  return 4 

def estimate_wait_for_duration(command: WaitForDuration, robot_type: RobotType) -> int:
  return command.params.seconds

def estimate_pick_up_tip(command: PickUpTip, robot_type: RobotType) -> int:
  # TODO: estimate with gantry position
  return 4

def estimate_touch_tip(command: TouchTip, robot_type: RobotType) -> int:
  # TODO: estimate with gantry position
  return 4

def estimate_hs_wait_for_temperature(command: heater_shaker.WaitForTemperature, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 4

def estimate_hs_set_and_wait_for_shake_speed(command: heater_shaker.SetAndWaitForShakeSpeed, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 4

def estimate_hs_open_labware_latch(command: heater_shaker.OpenLabwareLatch, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 3

def estimate_hs_close_labware_latch(command: heater_shaker.CloseLabwareLatch, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 3

def estimate_mag_disengage(command: magnetic_module.Disengage, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 3

def estimate_mag_engage(command: magnetic_module.Engage, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 3

def estimate_temp_mod_wait_for_temperature(command: temperature_module.WaitForTemperature, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 4

def estimate_tc_wait_for_block_temperature(command: thermocycler.WaitForBlockTemperature, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 4

def estimate_tc_wait_for_lid_temperature(command: thermocycler.WaitForLidTemperature, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 4

def estimate_tc_open_lid(command: thermocycler.OpenLid, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 20

def estimate_tc_close_lid(command: thermocycler.CloseLid, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  return 20

def estimate_tc_run_profile(command: thermocycler.RunProfile, robot_type: RobotType) -> int:
  # TODO: estimate with module state
  # 60 seconds per cycle ballpark
  return 60 * len(command.params.profile)

def estimate_calibrate_gripper(command: calibration.CalibrateGripper, robot_type: RobotType) -> int:
  # TODO: estimate with stop watch
  return 120 

def estimate_calibrate_pipette(command: calibration.CalibratePipette, robot_type: RobotType) -> int:
  # TODO: estimate with stop watch
  return 120 

def estimate_calibrate_module(command: calibration.CalibrateModule, robot_type: RobotType) -> int:
  # TODO: estimate with stop watch
  return 120 

def estimate_move_to_maintenance_position(command: calibration.MoveToMaintenancePosition, robot_type: RobotType) -> int:
  # TODO: estimate with stop watch
  return 4 


COMMAND_ESTIMATOR_MAP: Dict[CommandType, Callable[[Command, RobotType], int]] = {
  AspirateCommandType: estimate_aspirate,
  AspirateInPlaceCommandType: estimate_aspirate_in_place,
  CommentCommandType: zero_duration,
  ConfigureForVolumeCommandType: estimate_configure_for_volume,
  CustomCommandType: zero_duration,
  DispenseCommandType: estimate_dispense,
  DispenseInPlaceCommandType: estimate_dispense_in_place,
  BlowOutCommandType: estimate_blow_out,
  BlowOutInPlaceCommandType: estimate_blow_out_in_place,
  DropTipCommandType: estimate_drop_tip,
  DropTipInPlaceCommandType: estimate_drop_tip_in_place,
  HomeCommandType: estimate_home,
  RetractAxisCommandType: estimate_retract_axis,
  LoadLabwareCommandType: zero_duration,
  LoadLiquidCommandType: zero_duration,
  LoadModuleCommandType: zero_duration,
  LoadPipetteCommandType: zero_duration,
  MoveLabwareCommandType: estimate_move_labware,
  MoveRelativeCommandType: estimate_move_relative,
  MoveToCoordinatesCommandType: estimate_move_to_coordinates,
  MoveToWellCommandType: estimate_move_to_well,
  WaitForResumeCommandType: zero_duration,
  WaitForDurationCommandType: estimate_wait_for_duration,
  PickUpTipCommandType: estimate_pick_up_tip,
  SavePositionCommandType: zero_duration,
  SetRailLightsCommandType: zero_duration,
  TouchTipCommandType: estimate_touch_tip,
  SetStatusBarCommandType: zero_duration, 
  heater_shaker.WaitForTemperatureType: estimate_hs_wait_for_temperature,
  heater_shaker.SetTargetTemperatureType: zero_duration,
  heater_shaker.DeactivateHeaterType: zero_duration,
  heater_shaker.SetAndWaitForShakeSpeedType: estimate_hs_set_and_wait_for_shake_speed,
  heater_shaker.DeactivateShakerType: zero_duration,
  heater_shaker.OpenLabwareLatchType: estimate_hs_open_labware_latch,
  heater_shaker.CloseLabwareLatchType: estimate_hs_close_labware_latch,
  magnetic_module.DisengageType: estimate_mag_disengage,
  magnetic_module.EngageType: estimate_mag_engage,
  temperature_module.SetTargetTemperatureType: zero_duration,
  temperature_module.WaitForTemperatureType: estimate_temp_mod_wait_for_temperature,
  temperature_module.DeactivateTemperatureType: zero_duration,
  thermocycler.SetTargetBlockTemperatureType: zero_duration,
  thermocycler.WaitForBlockTemperatureType: estimate_tc_wait_for_block_temperature,
  thermocycler.SetTargetLidTemperatureType: zero_duration,
  thermocycler.WaitForLidTemperatureType: estimate_tc_wait_for_lid_temperature,
  thermocycler.DeactivateBlockType: zero_duration,
  thermocycler.DeactivateLidType: zero_duration,
  thermocycler.OpenLidType: estimate_tc_open_lid,
  thermocycler.CloseLidType: estimate_tc_close_lid,
  thermocycler.RunProfileType: estimate_tc_run_profile,
  calibration.CalibrateGripperType: estimate_calibrate_gripper,
  calibration.CalibratePipetteType: estimate_calibrate_pipette,
  calibration.CalibrateModuleType: estimate_calibrate_module,
  calibration.MoveToMaintenancePositionType: estimate_move_to_maintenance_position,
}


@dataclass
class TimerEntry:
    command: types.CommandMessage
    duration: float


class DurationEstimator:
    """
    Utility class that estimates the duration of a sequence of protocol engine commands on a target robot.
    """

    def __init__(self, robot_type: RobotType, commands: List[Command]):
        self._commands = commands
        self._robot_type: RobotType = RobotType
        self._deck = Deck(deck_type=get_deck_type(robot_type))
        # Per step time estimate.
        self._increments: List[TimerEntry] = []

    def get_total_duration(self) -> float:
        """Return the total duration"""
        return functools.reduce(
            lambda acc, val: acc + val.duration, self._increments, 0.0
        )

    def _estimate_command_duration(self, command: types.CommandMessage) -> None:

        try:
            duration = COMMAND_ESTIMATOR_MAP[command.commandType](command, self._robot_type)
        except Exception as e:
            raise DurationEstimatorException(str(e))

        self._increments.append(
            TimerEntry(
                command=message,
                duration=duration,
            )
        )
