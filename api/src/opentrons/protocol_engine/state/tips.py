"""Tip state tracking."""
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, List

from .abstract_store import HasState, HandlesActions
from ..actions import (
    Action,
    UpdateCommandAction,
    ResetTipsAction,
)
from ..commands import (
    Command,
    LoadLabwareResult,
    PickUpTipResult,
    DropTipResult,
    DropTipInPlaceResult,
)
from ..commands.configuring_common import (
    PipetteConfigUpdateResultMixin,
    PipetteNozzleLayoutResultMixin,
)

from opentrons.hardware_control.nozzle_manager import NozzleMap


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
    length_by_pipette_id: Dict[str, float]
    active_channels_by_pipette_id: Dict[str, int]


class TipStore(HasState[TipState], HandlesActions):
    """Tip state container."""

    _state: TipState

    def __init__(self) -> None:
        """Initialize a liquid store and its state."""
        self._state = TipState(
            tips_by_labware_id={},
            column_by_labware_id={},
            channels_by_pipette_id={},
            length_by_pipette_id={},
            active_channels_by_pipette_id={},
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            if isinstance(action.private_result, PipetteConfigUpdateResultMixin):
                pipette_id = action.private_result.pipette_id
                config = action.private_result.config
                self._state.channels_by_pipette_id[pipette_id] = config.channels
                self._state.active_channels_by_pipette_id[pipette_id] = config.channels
            self._handle_command(action.command)

            if isinstance(action.private_result, PipetteNozzleLayoutResultMixin):
                pipette_id = action.private_result.pipette_id
                nozzle_map = action.private_result.nozzle_map
                if nozzle_map:
                    self._state.active_channels_by_pipette_id[
                        pipette_id
                    ] = nozzle_map.tip_count
                else:
                    self._state.active_channels_by_pipette_id[
                        pipette_id
                    ] = self._state.channels_by_pipette_id[pipette_id]

        elif isinstance(action, ResetTipsAction):
            labware_id = action.labware_id

            for well_name in self._state.tips_by_labware_id[labware_id].keys():
                self._state.tips_by_labware_id[labware_id][
                    well_name
                ] = TipRackWellState.CLEAN

    def _handle_command(self, command: Command) -> None:
        if (
            isinstance(command.result, LoadLabwareResult)
            and command.result.definition.parameters.isTiprack
        ):
            labware_id = command.result.labwareId
            definition = command.result.definition
            self._state.tips_by_labware_id[labware_id] = {
                well_name: TipRackWellState.CLEAN
                for column in definition.ordering
                for well_name in column
            }
            self._state.column_by_labware_id[labware_id] = [
                column for column in definition.ordering
            ]

        elif isinstance(command.result, PickUpTipResult):
            labware_id = command.params.labwareId
            well_name = command.params.wellName
            pipette_id = command.params.pipetteId
            length = command.result.tipLength
            self._set_used_tips(
                pipette_id=pipette_id, well_name=well_name, labware_id=labware_id
            )
            self._state.length_by_pipette_id[pipette_id] = length

        elif isinstance(command.result, (DropTipResult, DropTipInPlaceResult)):
            pipette_id = command.params.pipetteId
            self._state.length_by_pipette_id.pop(pipette_id, None)

    def _set_used_tips(self, pipette_id: str, well_name: str, labware_id: str) -> None:
        pipette_channels = self._state.active_channels_by_pipette_id.get(pipette_id)
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

    # TODO (spp, 2023-12-05): update this logic once we support partial nozzle configurations
    #  that require the tip tracking to move right to left or front to back;
    #  for example when using leftmost column config of 96-channel
    #  or backmost single nozzle configuration of an 8-channel.
    def get_next_tip(  # noqa: C901
        self, nozzle_map: NozzleMap, labware_id: str, num_tips: int, starting_tip_name: Optional[str]
    ) -> Optional[str]:
        """Get the next available clean tip."""
        wells = self._state.tips_by_labware_id.get(labware_id, {})
        columns = self._state.column_by_labware_id.get(labware_id, [])

        # right now we handle 3 cases: column, full 96 pickup, or single tip pickup
        # this needs to change (possibly altogether) to utilize all-quadrant pickup
        # if we can, I'd like to remove all three checks
        # instead we will take the number of tips needed, the primary tip, the back left tip and the front right tip
        
        #expect 4 types of layout
        #in single channel config we can expect all 3 to be the same
        #in column the back left and starting nozzle will be the same
        #in row the back left and starting nozzle will be the same
        #in quadrant all three could be different or the same

        #we should not care if they are the same or different
        #utilize their layout to identify which wells to scan

        ###########
        # start making use of the nozzle map here
        ##########

        #starting nozzle will determine the side of the tiprack we begin our scan from

        #number of rows between back left and front right is how far down to scan
        #number of cols between back left and front right is how far to scan to the side
        #we always scan down the rows and right across the columns
        #we will always begin on the leftmost possible column of our tip cluster selection

        #we are looking for a critical tip within each cluster
        num_nozzle_cols = len(nozzle_map.columns)
        num_nozzle_rows = len(nozzle_map.rows)
        def _inspect_tip_cluster(critical_column: int, critical_row: int) -> Optional[str]:
            # The critical tip is always the back left well of a selected cluster on the tiprack
            # Begin scanning from the critical tip down each row of a column, then over each column of a cluster
            for i in range(num_nozzle_cols):
                column = columns[critical_column + i]
                for j in range(num_nozzle_rows):
                    well = column[critical_row + j]
                    if wells[well] == TipRackWellState.USED:
                        return None
            return columns[critical_column][critical_row]
        
        if nozzle_map.starting_nozzle == "A1":

            #enter the tiprack from the corner of H12
            #identify the critical tip from here
            
            #since we know we're starting from H12, we know our column = columns[len(columns)-num_nozzle_cols]

            #then our critical tip is column[len(column) - num_nozzle_rows]
            
            #change this logic to be a cirtical column pos and critical row pos
            #those two criticals can be passed into a function that is doing this "searching"
            #when that function returns a str, we have our critical well
            #when that function returns none, we need to run again with a NEW critical col and critical row
            # we will need a unique one of these for each of the four corner (they must each carve inward form a different starting pos)

            
                
            
            #Define the critical well by the position of the well relative to Tip Rack entry point H12
            col_attempts = 0
            row_attempts = 0
            critical_column = len(columns) - num_nozzle_cols - col_attempts
            critical_row = len(columns[critical_column]) - num_nozzle_rows - row_attempts

            #if a well is found to be empty, we will need to break and start again at the next logical cluster

            ###THE FOLLOW IS NOT CORRECT FOR ALL WELLS BUT THE IDEA IS GOING IN THE RIGHT DIRECTION
            #when A1 is the starting nozzle, I'll need to go UP rows and move BACK columns when selecting the next slice
            #DEFINING THE NEXT LOGICAL CLUSTER
            #the next logical cluster begins one row below the last empty well
            #if the amount of rows remaining is less than the number of nozzle rows then:
            #shift over a column -1 if the current critical tip column held no empty tip slots within the first N rows (n begin the number of nozzle rows)

            #begin scanning again from the next critical tip
            #rinse and repeat until we pass with no used wells! the tip that succeeds is the critical tip to utilize

        elif nozzle_map.starting_nozzle == "A12":
            #begin scanning from A1 + the column width

        elif nozzle_map.starting_nozzle == "H1":
            #begin scanning from A12 + the row height

        elif nozzle_map.starting_nozzle == "H12":
            #begin scanning from H12 - the column width + the row height
        
        else:
            #raise - forbidden!


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
                if not any(wells[well] == TipRackWellState.USED for well in column):
                    return column[0]

        elif num_tips == len(wells.keys()):  # Get next tips for 96 channel
            if starting_tip_name and starting_tip_name != columns[0][0]:
                return None

            if not any(
                tip_state == TipRackWellState.USED for tip_state in wells.values()
            ):
                return next(iter(wells))

        else:  # Get next tips for single channel
            if starting_tip_name is not None:
                wells = _drop_wells_before_starting_tip(wells, starting_tip_name)

            for well_name, tip_state in wells.items():
                if tip_state == TipRackWellState.CLEAN:
                    return well_name

        return None

    def get_pipette_channels(self, pipette_id: str) -> int:
        """Return the given pipette's number of channels."""
        return self._state.channels_by_pipette_id[pipette_id]

    def get_pipette_active_channels(self, pipette_id: str) -> int:
        """Get the number of channels being used in the given pipette's configuration."""
        return self._state.active_channels_by_pipette_id[pipette_id]

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

    def get_tip_length(self, pipette_id: str) -> float:
        """Return the given pipette's tip length."""
        return self._state.length_by_pipette_id.get(pipette_id, 0)


def _drop_wells_before_starting_tip(
    wells: TipRackStateByWellName, starting_tip_name: str
) -> TipRackStateByWellName:
    """Drop any wells that come before the starting tip and return the remaining ones after."""
    seen_starting_well = False
    remaining_wells = {}
    for well_name, tip_state in wells.items():
        if well_name == starting_tip_name:
            seen_starting_well = True
        if seen_starting_well:
            remaining_wells[well_name] = tip_state
    return remaining_wells
