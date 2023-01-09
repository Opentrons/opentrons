"""Tip state tracking."""
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, List

from .abstract_store import HasState, HandlesActions
from ..actions import (
    Action,
    UpdateCommandAction,
    ResetTipsAction,
    AddPipetteConfigAction,
)
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
    column_by_labware_id: Dict[str, List[List[str]]]
    channels_by_pipette_id: Dict[str, int]


class TipStore(HasState[TipState], HandlesActions):
    """Tip state container."""

    _state: TipState

    def __init__(self) -> None:
        """Initialize a liquid store and its state."""
        self._state = TipState(
            tips_by_labware_id={},
            column_by_labware_id={},
            channels_by_pipette_id={},
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if (
            isinstance(action, UpdateCommandAction)
            and isinstance(action.command.result, LoadLabwareResult)
            and action.command.result.definition.parameters.isTiprack
        ):
            labware_id = action.command.result.labwareId
            definition = action.command.result.definition
            self._state.tips_by_labware_id[labware_id] = {
                well_name: TipRackWellState.CLEAN
                for column in definition.ordering
                for well_name in column
            }
            self._state.column_by_labware_id[labware_id] = [
                column for column in definition.ordering
            ]

        elif isinstance(action, UpdateCommandAction) and isinstance(
            action.command.result, PickUpTipResult
        ):
            labware_id = action.command.params.labwareId
            well_name = action.command.params.wellName
            pipette_id = action.command.params.pipetteId
            self._set_used_tips(
                pipette_id=pipette_id, well_name=well_name, labware_id=labware_id
            )

        elif isinstance(action, ResetTipsAction):
            labware_id = action.labware_id

            for well_name in self._state.tips_by_labware_id[labware_id].keys():
                self._state.tips_by_labware_id[labware_id][
                    well_name
                ] = TipRackWellState.CLEAN

        elif isinstance(action, AddPipetteConfigAction):
            self._state.channels_by_pipette_id[action.pipette_id] = action.channels

    def _set_used_tips(self, pipette_id: str, well_name: str, labware_id: str) -> None:
        pipette_channels = self._state.channels_by_pipette_id.get(pipette_id)
        columns = self._state.column_by_labware_id.get(labware_id, [])
        wells = self._state.tips_by_labware_id.get(labware_id, {})

        if pipette_channels == len(wells):
            for well_name in wells.keys():
                wells[well_name] = TipRackWellState.USED

        elif columns and pipette_channels == len(columns[0]):
            for column in columns:
                if well_name in column:
                    for well in column:
                        wells[well] = TipRackWellState.USED
                    break

        else:
            wells[well_name] = TipRackWellState.USED


class TipView(HasState[TipState]):
    """Read-only tip state view."""

    _state: TipState

    def __init__(self, state: TipState) -> None:
        """Initialize the computed view of liquid state.

        Arguments:
            state: Liquid state dataclass used for all calculations.
        """
        self._state = state

    def get_next_tip(  # noqa: C901
        self, labware_id: str, num_tips: int, starting_tip_name: Optional[str]
    ) -> Optional[str]:
        """Get the next available clean tip."""
        wells = self._state.tips_by_labware_id.get(labware_id, {})
        columns = self._state.column_by_labware_id.get(labware_id, [])

        if columns and num_tips == len(columns[0]):
            column_head = [column[0] for column in columns]
            starting_column_index = 0

            if starting_tip_name:
                for idx, column in enumerate(columns):
                    if starting_tip_name in column:
                        if starting_tip_name not in column_head:
                            starting_column_index = idx + 1
                        else:
                            starting_column_index = idx

            for column in columns[starting_column_index:]:
                if not any(wells[well] == TipRackWellState.USED for well in column):
                    return column[0]

        elif num_tips == len(wells.keys()):
            if starting_tip_name and starting_tip_name != columns[0][0]:
                return None

            if not any(
                tip_state == TipRackWellState.USED for tip_state in wells.values()
            ):
                return next(iter(wells))

        else:
            for well_name, tip_state in wells.items():
                seen_start = (
                    starting_tip_name is None
                    or well_name == starting_tip_name
                    or wells[starting_tip_name] == TipRackWellState.USED
                )

                if seen_start and tip_state == TipRackWellState.CLEAN:
                    return well_name

        return None

    def get_pipette_channels(self, pipette_id: str) -> int:
        """Return the given pipette's number of channels."""
        return self._state.channels_by_pipette_id[pipette_id]

    def has_clean_tip(self, labware_id: str, well_name: str) -> bool:
        """Get whether a well in a labware has a clean tip.

        Args:
            labware_id: The labware ID to check.
            well_name: The well name to check.

        Returns:
            True if the labware is a tip rack and the well has a clean tip,
            otherwise False.
        """
        tip_rack = self._state.tips_by_labware_id.get(labware_id)
        well_state = tip_rack.get(well_name) if tip_rack else None

        return well_state == TipRackWellState.CLEAN
