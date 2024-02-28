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
    nozzle_map_by_pipette_id: Dict[str, NozzleMap]


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
            nozzle_map_by_pipette_id={},
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            if isinstance(action.private_result, PipetteConfigUpdateResultMixin):
                pipette_id = action.private_result.pipette_id
                config = action.private_result.config
                self._state.channels_by_pipette_id[pipette_id] = config.channels
                self._state.active_channels_by_pipette_id[pipette_id] = config.channels
                self._state.nozzle_map_by_pipette_id[pipette_id] = config.nozzle_map
            self._handle_command(action.command)

            if isinstance(action.private_result, PipetteNozzleLayoutResultMixin):
                pipette_id = action.private_result.pipette_id
                nozzle_map = action.private_result.nozzle_map
                if nozzle_map:
                    self._state.active_channels_by_pipette_id[
                        pipette_id
                    ] = nozzle_map.tip_count
                    self._state.nozzle_map_by_pipette_id[pipette_id] = nozzle_map
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

    def _set_used_tips(
        self, pipette_id: str, well_name: str, labware_id: str
    ) -> None:  # noqa: C901
        columns = self._state.column_by_labware_id.get(labware_id, [])
        wells = self._state.tips_by_labware_id.get(labware_id, {})
        nozzle_map = self._state.nozzle_map_by_pipette_id[pipette_id]

        # fix this None logic?
        # replace this with the whole nozzle map mask instead of the active nozzles?
        if nozzle_map is not None:
            num_nozzle_cols = len(nozzle_map.columns)
            num_nozzle_rows = len(nozzle_map.rows)

            critical_column = 0
            critical_row = 0
            for column in columns:
                if well_name in column:
                    critical_row = column.index(well_name)
                    critical_column = columns.index(column)

            for i in range(num_nozzle_cols):
                for j in range(num_nozzle_rows):
                    if nozzle_map.starting_nozzle == "A1":
                        well = columns[critical_column + i][critical_row + j]
                        wells[well] = TipRackWellState.USED
                    elif nozzle_map.starting_nozzle == "A12":
                        well = columns[critical_column + i][critical_row - j]
                        wells[well] = TipRackWellState.USED
                    elif nozzle_map.starting_nozzle == "H1":
                        well = columns[critical_column - i][critical_row + j]
                        wells[well] = TipRackWellState.USED
                    elif nozzle_map.starting_nozzle == "H12":
                        well = columns[critical_column - i][critical_row - j]
                        wells[well] = TipRackWellState.USED
        else:
            raise RuntimeError(f"No Nozzle Map found for Pipette-ID: {pipette_id}.")


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
        self,
        pipette_id: str,
        labware_id: str,
        num_tips: int,
        starting_tip_name: Optional[str],
    ) -> Optional[str]:
        """Get the next available clean tip."""
        wells = self._state.tips_by_labware_id.get(labware_id, {})
        columns = self._state.column_by_labware_id.get(labware_id, [])
        nozzle_map = self._state.nozzle_map_by_pipette_id[pipette_id]

        num_nozzle_cols = len(nozzle_map.columns)
        num_nozzle_rows = len(nozzle_map.rows)

        def _identify_tip_cluster(critical_column: int, critical_row: int) -> List[str]:
            tip_cluster = []
            for i in range(num_nozzle_cols):
                column = columns[critical_column + i]
                for j in range(num_nozzle_rows):
                    well = column[critical_row + j]
                    tip_cluster.append(well)
            # Return the list of tips to be analyzed
            return tip_cluster

        def _validate_tip_cluster(tip_cluster: List[str]) -> Optional[str]:
            if not any(wells[well] == TipRackWellState.USED for well in tip_cluster):
                return tip_cluster[0]
            elif all(wells[well] == TipRackWellState.USED for well in tip_cluster):
                return None
            else:
                # The tip cluster list is ordered: Each row from a column in order by columns
                tip_cluster_final_column = []
                for i in range(num_nozzle_rows):
                    tip_cluster_final_column.append(
                        tip_cluster[((num_nozzle_cols * num_nozzle_rows) - 1) - i]
                    )
                tip_cluster_final_row = []
                for i in range(num_nozzle_cols):
                    tip_cluster_final_row.append(
                        tip_cluster[(num_nozzle_rows - 1) + (i * num_nozzle_rows)]
                    )
                if all(
                    wells[well] == TipRackWellState.USED
                    for well in tip_cluster_final_column
                ):
                    return None
                elif all(
                    wells[well] == TipRackWellState.USED
                    for well in tip_cluster_final_row
                ):
                    return None
                else:
                    raise KeyError(
                        f"Tiprack {labware_id} has no valid tip selection for current Nozzle Configuration."
                    )

        # three things need to happen here:
        # firstly we need to remove this nozzle map none stuff
        # second, if there is a starting tip do the old logic that I've removed (somehow)
        # next inside the "new logic section" we need to split the logic with three new cases:
        #  --if single channel, start from A1 corner
        #  -- if 8 channel and primary nozzle A1, start from H1
        #  -- if 8 channel and primary nozzle H1, start from A1
        #  -- else if 96ch: do current new logic
        if starting_tip_name is None:
            if self.get_pipette_channels(pipette_id) == 1:
                # for a single channel pipette, always begin at A1 on the tiprack
                critical_column = num_nozzle_cols - 1
                critical_row = num_nozzle_rows - 1

                while critical_column <= len(columns):
                    tip_cluster = _identify_tip_cluster(critical_column, critical_row)
                    result = _validate_tip_cluster(tip_cluster)
                    if isinstance(result, str):
                        # The result is the critical tip to target
                        return result
                    elif result is None:
                        if critical_row + num_nozzle_rows < len(columns[0]):
                            critical_row = critical_row + num_nozzle_rows
                        else:
                            critical_column = critical_column + 1
                            critical_row = num_nozzle_rows - 1
                return None
            elif self.get_pipette_channels(pipette_id) == 8:
                # perform 8 channel logic beginning from either H1 or A1 of the tiprack
                if nozzle_map.starting_nozzle == "A1":
                    # Define the critical well by the position of the well relative to Tip Rack entry point H1
                    critical_column = num_nozzle_cols - 1
                    critical_row = len(columns[critical_column]) - num_nozzle_rows

                    while critical_column <= len(
                        columns
                    ):  # change to max size of labware
                        tip_cluster = _identify_tip_cluster(
                            critical_column, critical_row
                        )
                        result = _validate_tip_cluster(tip_cluster)
                        if isinstance(result, str):
                            # The result is the critical tip to target
                            return result
                        elif result is None:
                            if critical_row - num_nozzle_rows > 0:
                                critical_row = critical_row - num_nozzle_rows
                            else:
                                critical_column = critical_column + 1
                                critical_row = (
                                    len(columns[critical_column]) - num_nozzle_rows
                                )
                    return None
                elif nozzle_map.starting_nozzle == "H1":
                    # Define the critical well by the position of the well relative to Tip Rack entry point A1
                    critical_column = num_nozzle_cols - 1
                    critical_row = num_nozzle_rows - 1

                    while critical_column <= len(columns):
                        tip_cluster = _identify_tip_cluster(
                            critical_column, critical_row
                        )
                        result = _validate_tip_cluster(tip_cluster)
                        if isinstance(result, str):
                            # The result is the critical tip to target
                            return result
                        elif result is None:
                            if critical_row + num_nozzle_rows < len(columns[0]):
                                critical_row = critical_row + num_nozzle_rows
                            else:
                                critical_column = critical_column + 1
                                critical_row = num_nozzle_rows - 1
                    return None
            elif self.get_pipette_channels(pipette_id) == 96:
                if nozzle_map.starting_nozzle == "A1":
                    # Define the critical well by the position of the well relative to Tip Rack entry point H12
                    critical_column = len(columns) - num_nozzle_cols
                    critical_row = len(columns[critical_column]) - num_nozzle_rows

                    while critical_column >= 0:
                        tip_cluster = _identify_tip_cluster(
                            critical_column, critical_row
                        )
                        result = _validate_tip_cluster(tip_cluster)
                        if isinstance(result, str):
                            # The result is the critical tip to target
                            return result
                        elif result is None:
                            # Move on to the row above or column to the left
                            if critical_row - num_nozzle_rows > 0:
                                critical_row = critical_row - num_nozzle_rows
                            else:
                                critical_column = critical_column - 1
                                critical_row = (
                                    len(columns[critical_column]) - num_nozzle_rows
                                )
                    return None

                elif nozzle_map.starting_nozzle == "A12":
                    # Define the critical well by the position of the well relative to Tip Rack entry point H1
                    critical_column = num_nozzle_cols - 1
                    critical_row = len(columns[critical_column]) - num_nozzle_rows

                    while critical_column <= len(
                        columns
                    ):  # change to max size of labware
                        tip_cluster = _identify_tip_cluster(
                            critical_column, critical_row
                        )
                        result = _validate_tip_cluster(tip_cluster)
                        if isinstance(result, str):
                            # The result is the critical tip to target
                            return result
                        elif result is None:
                            if critical_row - num_nozzle_rows > 0:
                                critical_row = critical_row - num_nozzle_rows
                            else:
                                critical_column = critical_column + 1
                                critical_row = (
                                    len(columns[critical_column]) - num_nozzle_rows
                                )
                    return None

                elif nozzle_map.starting_nozzle == "H1":
                    # Define the critical well by the position of the well relative to Tip Rack entry point A12
                    critical_column = len(columns) - num_nozzle_cols
                    critical_row = num_nozzle_rows - 1

                    while critical_column >= 0:
                        tip_cluster = _identify_tip_cluster(
                            critical_column, critical_row
                        )
                        result = _validate_tip_cluster(tip_cluster)
                        if isinstance(result, str):
                            # The result is the critical tip to target
                            return result
                        elif result is None:
                            if critical_row + num_nozzle_rows < len(columns[0]):
                                critical_row = critical_row + num_nozzle_rows
                            else:
                                critical_column = critical_column - 1
                                critical_row = num_nozzle_rows - 1
                    return None

                elif nozzle_map.starting_nozzle == "H12":
                    # Define the critical well by the position of the well relative to Tip Rack entry point A1
                    critical_column = num_nozzle_cols - 1
                    critical_row = num_nozzle_rows - 1

                    while critical_column <= len(columns):
                        tip_cluster = _identify_tip_cluster(
                            critical_column, critical_row
                        )
                        result = _validate_tip_cluster(tip_cluster)
                        if isinstance(result, str):
                            # The result is the critical tip to target
                            return result
                        elif result is None:
                            if critical_row + num_nozzle_rows < len(columns[0]):
                                critical_row = critical_row + num_nozzle_rows
                            else:
                                critical_column = critical_column + 1
                                critical_row = num_nozzle_rows - 1
                    return None

                else:
                    raise ValueError(
                        f"Nozzle {nozzle_map.starting_nozzle} is an invalid starting tip for automatic tip pickup."
                    )
            else:
                raise RuntimeError(
                    f"Ivnalid Pipette-ID: {pipette_id} during automatic tip tracking."
                )
        else:
            # If we have a starting tip, perform the old logic for now
            # TODO (cb, 2-28-2024): The starting tip handler logic should instead be consolidated into the new automatic tip tracking code above
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
