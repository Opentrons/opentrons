"""Basic well data state and store."""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
from opentrons.protocol_engine.actions.actions import (
    FailCommandAction,
    SucceedCommandAction,
)
from opentrons.protocol_engine.commands.liquid_probe import LiquidProbeResult
from opentrons.protocol_engine.commands.load_liquid import LoadLiquidResult
from opentrons.protocol_engine.commands.aspirate import AspirateResult
from opentrons.protocol_engine.commands.dispense import DispenseResult
from opentrons.protocol_engine.commands.pipetting_common import LiquidNotFoundError
from opentrons.protocol_engine.types import LiquidHeightInfo, LiquidHeightSummary

from ._abstract_store import HasState, HandlesActions
from ..actions import Action
from ..commands import Command
from .geometry import get_well_height_at_volume, get_well_height_after_volume


@dataclass
class WellState:
    """State of all wells."""

    measured_liquid_heights: Dict[str, Dict[str, LiquidHeightInfo]]


class WellStore(HasState[WellState], HandlesActions):
    """Well state container."""

    _state: WellState

    def __init__(self) -> None:
        """Initialize a well store and its state."""
        self._state = WellState(measured_liquid_heights={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, SucceedCommandAction):
            self._handle_succeeded_command(action.command)
        if isinstance(action, FailCommandAction):
            self._handle_failed_command(action)

    def _handle_succeeded_command(self, command: Command) -> None:
        if isinstance(command.result, LiquidProbeResult):
            self._set_liquid_height_after_probe(
                labware_id=command.params.labwareId,
                well_name=command.params.wellName,
                height=command.result.z_position,
                time=command.completedAt
                if command.completedAt is not None
                else command.createdAt,
            )
        if isinstance(command.result, LoadLiquidResult):
            self._set_liquid_height_after_load(
                labware_id=command.params.labwareId,
                well_name=next(iter(command.params.volumeByWell)),
                volume=next(iter(command.params.volumeByWell.values())),
                time=command.completedAt
                if command.completedAt is not None
                else command.createdAt,
            )
        if isinstance(command.result, AspirateResult):
            self._update_liquid_height_after_operation(
                labware_id=command.params.labwareId,
                well_name=command.params.wellName,
                volume=-command.result.volume,
            )
        if isinstance(command.result, DispenseResult):
            self._update_liquid_height_after_operation(
                labware_id=command.params.labwareId,
                well_name=command.params.wellName,
                volume=command.result.volume,
            )

    def _handle_failed_command(self, action: FailCommandAction) -> None:
        if isinstance(action.error, LiquidNotFoundError):
            self._set_liquid_height_after_probe(
                labware_id=action.error.private.labware_id,
                well_name=action.error.private.well_name,
                height=None,
                time=action.failed_at,
            )

    def _set_liquid_height_after_probe(
        self, labware_id: str, well_name: str, height: float, time: datetime
    ) -> None:
        """Set the liquid height of the well from a LiquidProbe command."""
        lhi = LiquidHeightInfo(
            height=height, last_measured=time, operations_since_measurement=0
        )
        if labware_id not in self._state.measured_liquid_heights:
            self._state.measured_liquid_heights[labware_id] = {}
        self._state.measured_liquid_heights[labware_id][well_name] = lhi

    def _set_liquid_height_after_load(
        self, labware_id: str, well_name: str, volume: float, time: datetime
    ) -> None:
        """Set the liquid height of the well from a LoadLiquid command."""
        height = get_well_height_at_volume(
            labware_id=labware_id, well_name=well_name, volume=volume
        )
        lhi = LiquidHeightInfo(
            height=height, last_measured=time, operations_since_measurement=0
        )
        if labware_id not in self._state.measured_liquid_heights:
            self._state.measured_liquid_heights[labware_id] = {}
        self._state.measured_liquid_heights[labware_id][well_name] = lhi

    def _update_liquid_height_after_operation(
        self, labware_id: str, well_name: str, volume: float
    ) -> None:
        """Update the liquid height of the well after an Aspirate or Dispense command."""
        time = self._state.measured_liquid_heights[labware_id][well_name].last_measured
        operations_since_measurement = (
            self._state.measured_liquid_heights[labware_id][
                well_name
            ].operations_since_measurement
            + 1
        )
        initial_height = self._state.measured_liquid_heights[labware_id][
            well_name
        ].height
        height = get_well_height_after_volume(
            labware_id=labware_id,
            well_name=well_name,
            initial_height=initial_height,
            volume=volume,
        )
        lhi = LiquidHeightInfo(
            height=height,
            last_measured=time,
            operations_since_measurement=operations_since_measurement,
        )
        if labware_id not in self._state.measured_liquid_heights:
            self._state.measured_liquid_heights[labware_id] = {}
        self._state.measured_liquid_heights[labware_id][well_name] = lhi


class WellView(HasState[WellState]):
    """Read-only well state view."""

    _state: WellState

    def __init__(self, state: WellState) -> None:
        """Initialize the computed view of well state.

        Arguments:
            state: Well state dataclass used for all calculations.
        """
        self._state = state

    def get_all(self) -> List[LiquidHeightSummary]:
        """Get all well liquid heights."""
        all_heights: List[LiquidHeightSummary] = []
        for labware, wells in self._state.measured_liquid_heights.items():
            for well, lhi in wells.items():
                lhs = LiquidHeightSummary(
                    labware_id=labware,
                    well_name=well,
                    height=lhi.height,
                    last_measured=lhi.last_measured,
                )
            all_heights.append(lhs)
        return all_heights

    def get_all_in_labware(self, labware_id: str) -> List[LiquidHeightSummary]:
        """Get all well liquid heights for a particular labware."""
        all_heights: List[LiquidHeightSummary] = []
        for well, lhi in self._state.measured_liquid_heights[labware_id].items():
            lhs = LiquidHeightSummary(
                labware_id=labware_id,
                well_name=well,
                height=lhi.height,
                last_measured=lhi.last_measured,
            )
            all_heights.append(lhs)
        return all_heights

    def get_last_measured_liquid_height(
        self, labware_id: str, well_name: str
    ) -> Optional[float]:
        """Returns the height of the liquid according to the most recent liquid level probe to this well.

        Returns None if no liquid probe has been done.
        """
        try:
            height = self._state.measured_liquid_heights[labware_id][well_name].height
            return height
        except KeyError:
            return None

    def has_measured_liquid_height(self, labware_id: str, well_name: str) -> bool:
        """Returns True if the well has been liquid level probed previously."""
        try:
            return bool(
                self._state.measured_liquid_heights[labware_id][well_name].height
            )
        except KeyError:
            return False
