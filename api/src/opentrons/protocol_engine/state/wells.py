"""Basic well data state and store."""
import pdb
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
from opentrons.protocol_engine.actions.actions import (
    FailCommandAction,
    SucceedCommandAction,
)
from opentrons.protocol_engine.commands.liquid_probe import LiquidProbeResult
from opentrons.protocol_engine.commands.pipetting_common import LiquidNotFoundError
from opentrons.protocol_engine.types import LiquidHeightInfo

from .abstract_store import HasState, HandlesActions
from ..actions import Action
from ..commands import Command


@dataclass
class WellState:
    """State of all wells."""

    #                       Dict[Labware: Dict[Wellname: [Height,TimeRecorded]]]
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
                height=0,
                time=action.failed_at,
            )

    def _set_liquid_height(
        self, labware_id: str, well_name: str, height: float, time: datetime
    ) -> None:
        """Set the liquid height of the well."""
        lhi = LiquidHeightInfo(height=height, last_measured=time)
        try:
            self._state.measured_liquid_heights[labware_id]
        except KeyError:
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

    def get_all(self) -> List[LiquidHeightInfo]:
        """Get all well liquid heights."""
        allHeights = []  # type: List[LiquidHeightInfo]
        for val in self._state.measured_liquid_heights.values():
            allHeights.extend(a for a in val.values())
        return allHeights

    def get_wells_in_labware(self, labware_id: str) -> List[LiquidHeightInfo]:
        """Get all well liquid heights for a particular labware."""
        return list(self._state.measured_liquid_heights[labware_id].values())

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
            self._state.measured_liquid_heights[labware_id][well_name].height
            return True
        except KeyError:
            return False
