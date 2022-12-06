"""Tip state tracking."""
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Set, Optional

from .abstract_store import HasState, HandlesActions
from ..actions import Action, UpdateCommandAction, ResetTipsAction
from ..commands import LoadLabwareResult, PickUpTipResult


class TipRackWellState(Enum):
    """The state of a single tip in a tip rack's well."""

    CLEAN = "clean"
    USED = "used"


TipRackStateByWellName = Dict[str, TipRackWellState]


@dataclass
class TipState:
    """State of all tips."""

    tips_by_labware_id: Dict[str, TipRackStateByWellName]
    column_heads_by_labware_id: Dict[str, Set[str]]


class TipStore(HasState[TipState], HandlesActions):
    """Tip state container."""

    _state: TipState

    def __init__(self) -> None:
        """Initialize a liquid store and its state."""
        self._state = TipState(tips_by_labware_id={}, column_heads_by_labware_id={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        # TODO(mc, 2022-11-09): check if tip rack
        if isinstance(action, UpdateCommandAction) and isinstance(
            action.command.result, LoadLabwareResult
        ):
            labware_id = action.command.result.labwareId
            definition = action.command.result.definition
            self._state.tips_by_labware_id[labware_id] = {
                well_name: TipRackWellState.CLEAN
                for column in definition.ordering
                for well_name in column
            }
            self._state.column_heads_by_labware_id[labware_id] = set(
                column[0] for column in definition.ordering
            )

        elif isinstance(action, UpdateCommandAction) and isinstance(
            action.command.result, PickUpTipResult
        ):
            labware_id = action.command.params.labwareId
            well_name = action.command.params.wellName

            # TODO(mc, 2022-11-09): take channels into account
            # for 96 channel pipette support and
            # non-96 well tip racks (if that's even a thing)
            self._state.tips_by_labware_id[labware_id][
                well_name
            ] = TipRackWellState.USED

        elif isinstance(action, ResetTipsAction):
            labware_id = action.labware_id

            for well_name in self._state.tips_by_labware_id[labware_id].keys():
                self._state.tips_by_labware_id[labware_id][
                    well_name
                ] = TipRackWellState.CLEAN


class TipView(HasState[TipState]):
    """Read-only tip state view."""

    _state: TipState

    def __init__(self, state: TipState) -> None:
        """Initialize the computed view of liquid state.

        Arguments:
            state: Liquid state dataclass used for all calculations.
        """
        self._state = state

    def get_next_tip(
        self, labware_id: str, use_column: bool, starting_tip_name: Optional[str]
    ) -> Optional[str]:
        """Get the next available clean tip."""
        seen_start = starting_tip_name is None
        wells = self._state.tips_by_labware_id[labware_id]
        column_heads = self._state.column_heads_by_labware_id[labware_id]

        for well_name, tip_state in wells.items():
            seen_start = seen_start or well_name == starting_tip_name

            if (
                seen_start
                and tip_state == TipRackWellState.CLEAN
                and (use_column is False or well_name in column_heads)
            ):
                return well_name

        return None
