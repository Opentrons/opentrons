"""Basic well data state and store."""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
from opentrons.protocol_engine.actions.actions import (
    FailCommandAction,
    SucceedCommandAction,
)
from opentrons.protocol_engine.commands.liquid_probe import LiquidProbeResult
from opentrons.protocol_engine.commands.pipetting_common import LiquidNotFoundError
from opentrons.protocol_engine.types import LiquidHeightInfo, LiquidHeightSummary

from ._abstract_store import HasState, HandlesActions
from ..actions import Action
from ..commands import Command


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
            self._set_liquid_height(
                labware_id=command.params.labwareId,
                well_name=command.params.wellName,
                height=command.result.z_position,
                time=command.createdAt,
            )

    def _handle_failed_command(self, action: FailCommandAction) -> None:
        if isinstance(action.error, LiquidNotFoundError):
            self._set_liquid_height(
                labware_id=action.error.private.labware_id,
                well_name=action.error.private.well_name,
                height=None,
                time=action.failed_at,
            )

    def _set_liquid_height(
        self, labware_id: str, well_name: str, height: float, time: datetime
    ) -> None:
        """Set the liquid height of the well."""
        lhi = LiquidHeightInfo(height=height, last_measured=time)
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
