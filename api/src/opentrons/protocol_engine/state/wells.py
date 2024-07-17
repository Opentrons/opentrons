"""Basic well data state and store."""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
from opentrons.protocol_engine.actions.actions import (
    FailCommandAction,
    SucceedCommandAction,
)
from opentrons.protocol_engine.commands.liquid_probe import LiquidProbe
from opentrons.protocol_engine.commands.pipetting_common import LiquidNotFoundError
from opentrons.protocol_engine.types import WellIdentifier, LiquidHeightInfo

from .abstract_store import HasState, HandlesActions
from ..actions import Action
from ..commands import Command


@dataclass
class WellState:
    """State of all wells."""

    measured_liquid_heights: Dict[WellIdentifier, LiquidHeightInfo]


class WellStore(HasState[WellState], HandlesActions):
    """Well state container."""

    _state: WellState

    def __init__(self) -> None:
        """Initialize a well store and its state."""
        self._state = WellState(measured_liquid_heights={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, SucceedCommandAction):
            self._handle_succeded_command(action.command)
        if isinstance(action, FailCommandAction):
            self._handle_failed_command(action)

    def _handle_succeded_command(self, command: Command) -> None:
        if isinstance(command, LiquidProbe):
            well = WellIdentifier(
                labware_id=command.params.labwareId, well_name=command.params.wellName
            )
            if command.result is None:
                self._set_liquid_height(well=well, height=None, time=None)
            else:
                self._set_liquid_height(
                    well=well,
                    height=command.result.z_position,
                    time=command.createdAt,
                )

    def _handle_failed_command(self, action: FailCommandAction) -> None:
        if isinstance(action.error, LiquidNotFoundError):
            self._set_liquid_height(0)

    def _set_liquid_height(
        self, well: WellIdentifier, height: Optional[float], time: Optional[datetime]
    ) -> None:
        """Set the liquid height of the well."""
        if height is None or time is None:
            del self._state.measured_liquid_heights[well]
        else:
            lhi = LiquidHeightInfo(height=height, last_measured=time)
            self._state.measured_liquid_heights[well] = lhi


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
        return list(self._state.measured_liquid_heights.values())

    def get_last_measured_liquid_height(self, well: WellIdentifier) -> Optional[float]:
        """Returns the height of the liquid according to the most recent liquid level probe to this well.

        Returns None if no liquid probe has been done.
        """
        try:
            height = self._state.measured_liquid_heights[well].height
            return height
        except KeyError:
            return None

    def has_measured_liquid_height(self, well: WellIdentifier) -> bool:
        """Returns True if the well has been liquid level probed previously."""
        try:
            height = self._state.measured_liquid_heights[well].height
            return height is not None
        except KeyError:
            return False
