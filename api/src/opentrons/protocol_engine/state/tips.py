"""Tip state tracking."""

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Set

from ..actions import Action, get_state_updates
from ._abstract_store import HandlesActions, HasState
from ._well_math import (
    wells_covered_by_physical_pipette,
    wells_covered_by_pipette_configuration,
    wells_covered_dense,
)
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.types import TipRackWellState
from opentrons.types import NozzleConfigurationType, NozzleMapInterface

_TipRackStateByWellName = Dict[str, TipRackWellState]


@dataclass
class TipState:
    """State of all tips."""

    tips_by_labware_id: Dict[str, _TipRackStateByWellName]
    columns_by_labware_id: Dict[str, List[List[str]]]


class TipStore(HasState[TipState], HandlesActions):
    """Tip state container."""

    _state: TipState

    def __init__(self) -> None:
        """Initialize a liquid store and its state."""
        self._state = TipState(
            tips_by_labware_id={},
            columns_by_labware_id={},
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        for state_update in get_state_updates(action):
            self._handle_state_update(state_update)

    def _handle_state_update(self, state_update: update_types.StateUpdate) -> None:
        if state_update.tips_state != update_types.NO_CHANGE:
            self._set_tip_state(
                labware_id=state_update.tips_state.labware_id,
                well_names=state_update.tips_state.well_names,
                tip_state=state_update.tips_state.tip_state,
            )

        if state_update.loaded_labware != update_types.NO_CHANGE:
            labware_id = state_update.loaded_labware.labware_id
            definition = state_update.loaded_labware.definition
            if definition.parameters.isTiprack:
                self._state.tips_by_labware_id[labware_id] = {
                    well_name: TipRackWellState.CLEAN
                    for column in definition.ordering
                    for well_name in column
                }
                self._state.columns_by_labware_id[labware_id] = [
                    column for column in definition.ordering
                ]
        if state_update.batch_loaded_labware != update_types.NO_CHANGE:
            for labware_id in state_update.batch_loaded_labware.new_locations_by_id:
                definition = state_update.batch_loaded_labware.definitions_by_id[
                    labware_id
                ]
                if definition.parameters.isTiprack:
                    self._state.tips_by_labware_id[labware_id] = {
                        well_name: TipRackWellState.CLEAN
                        for column in definition.ordering
                        for well_name in column
                    }
                    self._state.columns_by_labware_id[labware_id] = [
                        column for column in definition.ordering
                    ]

    def _set_tip_state(
        self, labware_id: str, well_names: Iterable[str], tip_state: TipRackWellState
    ) -> None:
        well_states = self._state.tips_by_labware_id.get(labware_id, {})
        for well_name in well_names:
            well_states[well_name] = tip_state


class TipView:
    """Read-only tip state view."""

    _state: TipState

    def __init__(self, state: TipState) -> None:
        """Initialize the computed view of liquid state.

        Arguments:
            state: Liquid state dataclass used for all calculations.
        """
        self._state = state

    def get_next_tip(  # noqa: C901
        self,
        labware_id: str,
        num_tips: int,
        starting_tip_name: Optional[str],
        nozzle_map: Optional[NozzleMapInterface],
    ) -> Optional[str]:
        """Gets the next available clean tip.

        Does not support use of a starting tip if the pipette used is in a partial configuration.
        """
        if starting_tip_name is None and nozzle_map is not None:
            return self._get_next_tip_with_nozzle_map(labware_id, nozzle_map)
        else:
            wells = self._state.tips_by_labware_id.get(labware_id, {})
            columns = self._state.columns_by_labware_id.get(labware_id, [])
            if columns and num_tips == len(columns[0]):  # Get next tips for 8-channel
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
                    if all(wells[well] == TipRackWellState.CLEAN for well in column):
                        return column[0]

            elif num_tips == len(wells.keys()):  # Get next tips for 96 channel
                if starting_tip_name and starting_tip_name != columns[0][0]:
                    return None

                if all(
                    tip_state == TipRackWellState.CLEAN for tip_state in wells.values()
                ):
                    return next(iter(wells))

            else:  # Get next tips for single channel
                if starting_tip_name is not None:
                    wells = _drop_wells_before_starting_tip(wells, starting_tip_name)

                for well_name, tip_state in wells.items():
                    if tip_state == TipRackWellState.CLEAN:
                        return well_name
        return None

    def _get_next_tip_with_nozzle_map(
        self,
        labware_id: str,
        nozzle_map: NozzleMapInterface,
    ) -> Optional[str]:
        """Get the next available clean tip for given nozzle configuration if one can be found."""
        tip_well_states = self._state.tips_by_labware_id.get(labware_id, {})
        wells_by_columns = self._state.columns_by_labware_id.get(labware_id, [])

        def _validate_wells(well_list: Set[str], target_well: str) -> bool:
            # If we are not picking up the correct number of tips it's not valid
            if len(well_list) != nozzle_map.tip_count:
                return False
            # If not all the tips we'll be picking up are clean it's not valid
            target_well_states = [tip_well_states[well_name] for well_name in well_list]
            if not all(state == TipRackWellState.CLEAN for state in target_well_states):
                return False
            # Since we know a full configuration will always produce zero non-active overlapping wells
            # we can skip the following checks if it is a full configuration.
            if nozzle_map.configuration != NozzleConfigurationType.FULL:
                # If we have a partial configuration we need to ensure that any wells in the way are NOT present
                wells_covered_physically = set(
                    wells_covered_by_physical_pipette(
                        nozzle_map=nozzle_map,  # type: ignore[arg-type]
                        target_well=target_well,
                        labware_wells_by_column=wells_by_columns,
                    )
                )
                wells_in_way_well_state = [
                    tip_well_states[well_name]
                    for well_name in wells_covered_physically.difference(well_list)
                ]
                # If any of the wells in the way are NOT empty, this is not a valid configuration
                if not all(
                    well_state == TipRackWellState.EMPTY
                    for well_state in wells_in_way_well_state
                ):
                    return False

            return True

        # Get an ordered list of wells to most efficiently search, depending on pipette configuration
        target_well_list = _resolve_well_order(wells_by_columns, nozzle_map)

        for well in target_well_list:
            # If the target well/tip isn't clean, skip to the next one. This will be checked
            # again in _validate_wells, but we can short circuit the following checks if this is False
            if tip_well_states[well] != TipRackWellState.CLEAN:
                continue
            # Get list of all wells (i.e. tips) that would be covered by the active nozzles
            targeted_wells = set(
                wells_covered_by_pipette_configuration(
                    nozzle_map=nozzle_map,  # type: ignore[arg-type]
                    target_well=well,
                    labware_wells_by_column=wells_by_columns,
                )
            )
            # If we are picking up the correct number of tips, return that target well
            if _validate_wells(targeted_wells, target_well=well):
                return well

        return None

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

    def compute_tips_to_mark_as_used_or_empty(
        self, labware_id: str, well_name: str, nozzle_map: NozzleMap
    ) -> list[str]:
        """Compute which tips a hypothetical tip pickup/drop should mark as "used" or "empty".

        Params:
            labware_id: The labware ID of the tip rack.
            well_name: The single target well of the tip pickup.
            nozzle_map: The nozzle configuration that the pipette will use for the pickup.

        Returns:
            The well names of all the tips that the operation will use.
        """
        columns = self._state.columns_by_labware_id.get(labware_id, [])
        return list(
            wells_covered_dense(
                nozzle_map.columns,
                nozzle_map.rows,
                nozzle_map.starting_nozzle,
                well_name,
                columns,
            )
        )


def _drop_wells_before_starting_tip(
    wells: _TipRackStateByWellName, starting_tip_name: str
) -> _TipRackStateByWellName:
    """Drop any wells that come before the starting tip and return the remaining ones after."""
    seen_starting_well = False
    remaining_wells: dict[str, TipRackWellState] = {}
    for well_name, tip_state in wells.items():
        if well_name == starting_tip_name:
            seen_starting_well = True
        if seen_starting_well:
            remaining_wells[well_name] = tip_state
    return remaining_wells


def _resolve_well_order(  # noqa: C901
    well_list: List[List[str]], nozzle_map: NozzleMapInterface
) -> List[str]:
    """Given a list of ordered columns and pipette information, returns a flat list of wells ordered for tip pick up.

    Wells can be ordered in four different ways:
        - Top to bottom, left to right (A1, B1, ... A2, B2, ... G12, H12)
        - Top to bottom, right to left (A12, B12, ... A11, B11, ... G1, H1)
        - Bottom to top, left to right (H1, G1, ... H2, G2, ... B12, A12)
        - Bottom to top, right to left (A12, B12, ... A11, B11, ... G1, H1)

    - Full configurations (which will always cover a single channel) will go top to bottom, left to right.
    - A partial 8-channel pipette configuration will always search left to right, starting at either top to bottom for
        starting nozzle H1 or bottom to top for starting nozzle A1
    - A partial 96-channel pipette configuration will always begin in the opposite corner of the starting nozzle
    """
    if nozzle_map.configuration == NozzleConfigurationType.FULL:
        return _get_top_to_bottom_left_to_right(well_list)
    elif nozzle_map.physical_nozzle_count == 8:
        if nozzle_map.starting_nozzle == "A1":
            return _get_bottom_to_top_left_to_right(well_list)
        elif nozzle_map.starting_nozzle == "H1":
            return _get_top_to_bottom_left_to_right(well_list)
        else:
            raise ValueError(
                f"Nozzle {nozzle_map.starting_nozzle} is an invalid starting tip for"
                " 8-channel pipette automatic tip pickup."
            )
    elif nozzle_map.physical_nozzle_count == 96:
        if nozzle_map.starting_nozzle == "A1":
            return _get_bottom_to_top_right_to_left(well_list)
        elif nozzle_map.starting_nozzle == "A12":
            return _get_bottom_to_top_left_to_right(well_list)
        elif nozzle_map.starting_nozzle == "H1":
            return _get_top_to_bottom_right_to_left(well_list)
        elif nozzle_map.starting_nozzle == "H12":
            return _get_top_to_bottom_left_to_right(well_list)
        else:
            raise ValueError(
                f"Nozzle {nozzle_map.starting_nozzle} is an invalid starting tip for 96-channel automatic tip pickup."
            )
    else:
        raise ValueError(
            f"Automatic tip pickup does not support {nozzle_map.physical_nozzle_count}-channel pipettes"
        )


def _get_top_to_bottom_left_to_right(well_list: List[List[str]]) -> List[str]:
    return [well for column in well_list for well in column]


def _get_bottom_to_top_left_to_right(well_list: List[List[str]]) -> List[str]:
    reverse_column_ordering = [list(reversed(column)) for column in well_list]
    return [well for column in reverse_column_ordering for well in column]


def _get_top_to_bottom_right_to_left(well_list: List[List[str]]) -> List[str]:
    reverse_row_ordering = list(reversed(well_list))
    return [well for column in reverse_row_ordering for well in column]


def _get_bottom_to_top_right_to_left(well_list: List[List[str]]) -> List[str]:
    reverse_row_column_ordering = [
        list(reversed(column)) for column in reversed(well_list)
    ]
    return [well for column in reverse_row_column_ordering for well in column]
