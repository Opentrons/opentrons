"""Opentrons helper methods."""

import asyncio
from typing import List, Dict, Optional, Tuple, Union
from statistics import stdev

from hardware_testing.data import ui
from opentrons import protocol_api
from opentrons.protocols.api_support.deck_type import (
    guess_from_global_config as guess_deck_type_from_global_config,
)
from opentrons.protocols.types import APIVersion
from opentrons.hardware_control.thread_manager import ThreadManager
from opentrons.hardware_control.types import OT3Mount, HardwareFeatureFlags
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.instruments.ot3.pipette import Pipette

from opentrons import execute, simulate
from opentrons.types import Mount
from opentrons.config.types import OT3Config, RobotConfig
from opentrons_shared_data.labware.types import LabwareDefinition

from hardware_testing.opentrons_api import helpers_ot3
from opentrons.protocol_api import InstrumentContext

import opentrons.protocol_engine.execution.pipetting as PE_pipetting
from opentrons.protocol_engine.notes import CommandNoteAdder

from opentrons.protocol_engine import StateView


def get_api_context(
    api_level: str,
    is_simulating: bool = False,
    pipette_left: Optional[str] = None,
    pipette_right: Optional[str] = None,
    gripper: Optional[str] = None,
    extra_labware: Optional[Dict[str, LabwareDefinition]] = None,
    deck_version: str = guess_deck_type_from_global_config(),
    stall_detection_enable: Optional[bool] = None,
) -> protocol_api.ProtocolContext:
    """Get api context."""

    async def _thread_manager_build_hw_api(
        attached_instruments: Optional[
            Dict[Union[Mount, OT3Mount], Dict[str, Optional[str]]]
        ] = None,
        attached_modules: Optional[List[str]] = None,
        config: Union[OT3Config, RobotConfig, None] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        strict_attached_instruments: bool = True,
        use_usb_bus: bool = False,
        update_firmware: bool = True,
        status_bar_enabled: bool = True,
        feature_flags: Optional[HardwareFeatureFlags] = None,
    ) -> OT3API:
        return await helpers_ot3.build_async_ot3_hardware_api(
            is_simulating=is_simulating,
            pipette_left=pipette_left,
            pipette_right=pipette_right,
            gripper=gripper,
            loop=loop,
            stall_detection_enable=stall_detection_enable,
        )

    papi: protocol_api.ProtocolContext
    if is_simulating:
        papi = simulate.get_protocol_api(
            version=APIVersion.from_string(api_level),
            extra_labware=extra_labware,
            hardware_simulator=ThreadManager(_thread_manager_build_hw_api),
            robot_type="Flex",
            # use_virtual_hardware=False makes this simulation work unlike
            # opentrons_simulate, app-side analysis, and server-side analysis.
            # We need to do this because some of our hardware testing scripts still
            # interact directly with the OT3API and there is no way to tell Protocol
            # Engine's hardware virtualization about those updates.
            use_virtual_hardware=False,
        )
    else:
        papi = execute.get_protocol_api(
            version=APIVersion.from_string(api_level), extra_labware=extra_labware
        )

    return papi


def get_pipette_unique_name(pipette: protocol_api.InstrumentContext) -> str:
    """Get a pipette's unique name."""
    return str(pipette.hw_pipette["pipette_id"])


def _calculate_average(volume_list: List[float]) -> float:
    return sum(volume_list) / len(volume_list)


def _override_set_current_volume(self, new_volume: float) -> None:  # noqa: ANN001
    assert new_volume >= 0
    # assert new_volume <= self.working_volume
    self._current_volume = new_volume


def _override_add_current_volume(self, volume_incr: float) -> None:  # noqa: ANN001
    self._current_volume += volume_incr


def _override_ok_to_add_volume(self, volume_incr: float) -> bool:  # noqa: ANN001
    return True


def _override_validate_asp_vol(
    state_view: StateView,
    pipette_id: str,
    aspirate_volume: float,
    command_note_adder: CommandNoteAdder,
) -> float:
    return aspirate_volume


def _override_check_safe_for_pipette_movement(
    engine_state: StateView,
    pipette_id: str,
    labware_id: str,
    well_name: str,
    well_location: object,
    version: APIVersion,
) -> None:
    pass


def _override_software_supports_high_volumes() -> None:
    # yea so ok this is pretty ugly but this is super helpful for us
    # with this we don't need to apply patches, and can run the testing scripts
    # without pushing modified code to the robot

    Pipette.set_current_volume = _override_set_current_volume  # type: ignore[assignment]
    Pipette.ok_to_add_volume = _override_ok_to_add_volume  # type: ignore[assignment]
    Pipette.add_current_volume = _override_add_current_volume  # type: ignore[assignment]
    PE_pipetting._validate_aspirate_volume = _override_validate_asp_vol  # type: ignore[assignment]


def _calculate_stats(
    volume_list: List[float], total_volume: float
) -> Tuple[float, float, float]:
    average = _calculate_average(volume_list)
    if len(volume_list) <= 1:
        ui.print_info("skipping CV, only 1x trial per volume")
        cv = -0.01  # negative number is impossible
    else:
        cv = stdev(volume_list) / average
    d = (average - total_volume) / total_volume
    return average, cv, d


def _get_tag_from_pipette(
    pipette: InstrumentContext, increment: bool, user_volumes: bool
) -> str:
    pipette_tag = get_pipette_unique_name(pipette)
    ui.print_info(f'found pipette "{pipette_tag}"')
    if increment:
        pipette_tag += "-increment"
    elif user_volumes:
        pipette_tag += "-user-volume"
    else:
        pipette_tag += "-qc"
    return pipette_tag
