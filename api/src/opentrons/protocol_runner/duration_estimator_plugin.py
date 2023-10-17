"""Customize the ProtocolEngine to monitor and control legacy (APIv2) protocols."""
from __future__ import annotations
import logging
from typing import List, Dict, Callable
from dataclasses import dataclass

from opentrons_shared_data.robot.dev_types import RobotType
from opentrons.protocol_engine import (
    AbstractPlugin,
    actions as pe_actions,
    Command,
    StateView,
)
from opentrons.protocol_engine import commands
from opentrons.util.broker import ReadOnlyBroker

log = logging.getLogger(__name__)


@dataclass
class TimerEntry:
    command_id: str
    duration: float


class DurationEstimatorPlugin(AbstractPlugin):
    """A ProtocolEngine plugin to estimate the execution duration
    of a sequence of commands on a robot in nominal conditions in average conditions.
    """

    def __init__(self) -> None:
        """Initialize the plugin with its dependencies."""
        self._durations: List[TimerEntry] = []

    def setup(self) -> None:
        """Set up the plugin."""
        pass

    async def teardown(self) -> None:
        """Tear down the plugin, undoing the work done in `setup()`."""
        pass

    def handle_action(self, action: pe_actions.Action) -> None:
        """React to a ProtocolEngine action."""
        if action == pe_actions.UpdateCommandAction:
            try:
                duration = COMMAND_ESTIMATOR_MAP[action.command.commandType](action.command)
                self._durations.append(TimerEntry(command_id=action.command.id, duration=duration))
                print(f"durations appended to: {self._durations}")
                log.debug(
                    f"durations appended to: {self._durations}"
                )
            finally:
                log.debug(
                    f"duration estimate failed for commandType: {action.command.commandType}"
                )


def zero_duration(_command: Command, state: StateView, robot_type: RobotType) -> int:
    return 0


def estimate_aspirate(
    command: commands.Aspirate, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry position
    return 999


def estimate_aspirate_in_place(
    command: commands.AspirateInPlace, state: StateView, robot_type: RobotType
) -> int:
    # at most we will move the plunger from min to max, roughly estimating at 2 seconds
    return 2


def estimate_configure_for_volume(
    command: commands.ConfigureForVolume, state: StateView, robot_type: RobotType
) -> int:
    # at most we will move the plunger a bit, roughly estimating at 1 second
    return 1


def estimate_dispense(
    command: commands.Dispense, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry position
    return 999


def estimate_dispense_in_place(
    command: commands.DispenseInPlace, state: StateView, robot_type: RobotType
) -> int:
    # at most we will move the plunger from max to min, roughly estimating at 2 seconds
    return 2


def estimate_blow_out(
    command: commands.BlowOut, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry position
    return 999


def estimate_blow_out_in_place(
    command: commands.BlowOutInPlace, state: StateView, robot_type: RobotType
) -> int:
    # at most we will move the plunger from max to min, roughly estimating at 2 seconds
    return 2


def estimate_drop_tip(
    command: commands.DropTip, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry position
    return 999


def estimate_drop_tip_in_place(
    command: commands.DropTipInPlace, state: StateView, robot_type: RobotType
) -> int:
    # at most we will move the plunger from max to min, roughly estimating at 2 seconds
    return 2


def estimate_home(
    command: commands.Home, state: StateView, robot_type: RobotType
) -> int:
    if robot_type == "OT-2 Standard":
        return 5
    return 3


def estimate_retract_axis(
    command: commands.RetractAxis, state: StateView, robot_type: RobotType
) -> int:
    # at most we will move one axis it's full extent, roughly estimating at 2 seconds
    return 2


def estimate_move_labware(
    command: commands.MoveLabware, state: StateView, robot_type: RobotType
) -> int:
    if command.params.strategy == "usingGripper":
        # TODO: estimate with gantry position
        return 4
    return 0


def estimate_move_relative(
    command: commands.MoveRelative, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry speed
    # at most we will move one axis it's full extent, roughly estimating at 2 seconds
    return 2


def estimate_move_to_coordinates(
    command: commands.MoveToCoordinates, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry position
    return 4


def estimate_move_to_well(
    command: commands.MoveToWell, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry position
    return 4


def estimate_wait_for_duration(
    command: commands.WaitForDuration, state: StateView, robot_type: RobotType
) -> int:
    return command.params.seconds


def estimate_pick_up_tip(
    command: commands.PickUpTip, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry position
    return 4


def estimate_touch_tip(
    command: commands.TouchTip, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with gantry position
    return 4


def estimate_hs_wait_for_temperature(
    command: commands.heater_shaker.WaitForTemperature,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with module state
    return 4


def estimate_hs_set_and_wait_for_shake_speed(
    command: commands.heater_shaker.SetAndWaitForShakeSpeed,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with module state
    return 4


def estimate_hs_open_labware_latch(
    command: commands.heater_shaker.OpenLabwareLatch,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with module state
    return 3


def estimate_hs_close_labware_latch(
    command: commands.heater_shaker.CloseLabwareLatch,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with module state
    return 3


def estimate_mag_disengage(
    command: commands.magnetic_module.Disengage, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with module state
    return 3


def estimate_mag_engage(
    command: commands.magnetic_module.Engage, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with module state
    return 3


def estimate_temp_mod_wait_for_temperature(
    command: commands.temperature_module.WaitForTemperature,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with module state
    return 4


def estimate_tc_wait_for_block_temperature(
    command: commands.thermocycler.WaitForBlockTemperature,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with module state
    return 4


def estimate_tc_wait_for_lid_temperature(
    command: commands.thermocycler.WaitForLidTemperature,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with module state
    return 4


def estimate_tc_open_lid(
    command: commands.thermocycler.OpenLid, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with module state
    return 20


def estimate_tc_close_lid(
    command: commands.thermocycler.CloseLid, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with module state
    return 20


def estimate_tc_run_profile(
    command: commands.thermocycler.RunProfile, state: StateView, robot_type: RobotType
) -> int:
    # TODO: estimate with module state
    # 60 seconds per cycle ballpark
    return 60 * len(command.params.profile)


def estimate_calibrate_gripper(
    command: commands.calibration.CalibrateGripper,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with stop watch
    return 120


def estimate_calibrate_pipette(
    command: commands.calibration.CalibratePipette,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with stop watch
    return 120


def estimate_calibrate_module(
    command: commands.calibration.CalibrateModule,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with stop watch
    return 120


def estimate_move_to_maintenance_position(
    command: commands.calibration.MoveToMaintenancePosition,
    state: StateView,
    robot_type: RobotType,
) -> int:
    # TODO: estimate with stop watch
    return 4


COMMAND_ESTIMATOR_MAP: Dict[
    commands.CommandType, Callable[[Command, StateView, RobotType], int]
] = {
    commands.AspirateCommandType: estimate_aspirate,
    commands.AspirateInPlaceCommandType: estimate_aspirate_in_place,
    commands.CommentCommandType: zero_duration,
    commands.ConfigureForVolumeCommandType: estimate_configure_for_volume,
    commands.CustomCommandType: zero_duration,
    commands.DispenseCommandType: estimate_dispense,
    commands.DispenseInPlaceCommandType: estimate_dispense_in_place,
    commands.BlowOutCommandType: estimate_blow_out,
    commands.BlowOutInPlaceCommandType: estimate_blow_out_in_place,
    commands.DropTipCommandType: estimate_drop_tip,
    commands.DropTipInPlaceCommandType: estimate_drop_tip_in_place,
    commands.HomeCommandType: estimate_home,
    commands.RetractAxisCommandType: estimate_retract_axis,
    commands.LoadLabwareCommandType: zero_duration,
    commands.LoadLiquidCommandType: zero_duration,
    commands.LoadModuleCommandType: zero_duration,
    commands.LoadPipetteCommandType: zero_duration,
    commands.MoveLabwareCommandType: estimate_move_labware,
    commands.MoveRelativeCommandType: estimate_move_relative,
    commands.MoveToCoordinatesCommandType: estimate_move_to_coordinates,
    commands.MoveToWellCommandType: estimate_move_to_well,
    commands.WaitForResumeCommandType: zero_duration,
    commands.WaitForDurationCommandType: estimate_wait_for_duration,
    commands.PickUpTipCommandType: estimate_pick_up_tip,
    commands.SavePositionCommandType: zero_duration,
    commands.SetRailLightsCommandType: zero_duration,
    commands.TouchTipCommandType: estimate_touch_tip,
    commands.SetStatusBarCommandType: zero_duration,
    commands.heater_shaker.WaitForTemperatureCommandType: estimate_hs_wait_for_temperature,
    commands.heater_shaker.SetTargetTemperatureCommandType: zero_duration,
    commands.heater_shaker.DeactivateHeaterCommandType: zero_duration,
    commands.heater_shaker.SetAndWaitForShakeSpeedCommandType: estimate_hs_set_and_wait_for_shake_speed,
    commands.heater_shaker.DeactivateShakerCommandType: zero_duration,
    commands.heater_shaker.OpenLabwareLatchCommandType: estimate_hs_open_labware_latch,
    commands.heater_shaker.CloseLabwareLatchCommandType: estimate_hs_close_labware_latch,
    commands.magnetic_module.DisengageCommandType: estimate_mag_disengage,
    commands.magnetic_module.EngageCommandType: estimate_mag_engage,
    commands.temperature_module.SetTargetTemperatureCommandType: zero_duration,
    commands.temperature_module.WaitForTemperatureCommandType: estimate_temp_mod_wait_for_temperature,
    commands.temperature_module.DeactivateTemperatureCommandType: zero_duration,
    commands.thermocycler.SetTargetBlockTemperatureCommandType: zero_duration,
    commands.thermocycler.WaitForBlockTemperatureCommandType: estimate_tc_wait_for_block_temperature,
    commands.thermocycler.SetTargetLidTemperatureCommandType: zero_duration,
    commands.thermocycler.WaitForLidTemperatureCommandType: estimate_tc_wait_for_lid_temperature,
    commands.thermocycler.DeactivateBlockCommandType: zero_duration,
    commands.thermocycler.DeactivateLidCommandType: zero_duration,
    commands.thermocycler.OpenLidCommandType: estimate_tc_open_lid,
    commands.thermocycler.CloseLidCommandType: estimate_tc_close_lid,
    commands.thermocycler.RunProfileCommandType: estimate_tc_run_profile,
    commands.calibration.CalibrateGripperCommandType: estimate_calibrate_gripper,
    commands.calibration.CalibratePipetteCommandType: estimate_calibrate_pipette,
    commands.calibration.CalibrateModuleCommandType: estimate_calibrate_module,
    commands.calibration.MoveToMaintenancePositionCommandType: estimate_move_to_maintenance_position,
}
