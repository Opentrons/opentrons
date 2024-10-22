"""Basic well data state and store."""
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from opentrons.protocol_engine.types import (
    ProbedHeightInfo,
    ProbedVolumeInfo,
    LoadedVolumeInfo,
    LiquidHeightSummary,
)

from . import update_types
from ._abstract_store import HasState, HandlesActions
from ..actions import Action, get_state_update


@dataclass
class WellState:
    """State of all wells."""

    loaded_volumes: Dict[str, Dict[str, LoadedVolumeInfo]]
    probed_heights: Dict[str, Dict[str, ProbedHeightInfo]]
    probed_volumes: Dict[str, Dict[str, ProbedVolumeInfo]]


class WellStore(HasState[WellState], HandlesActions):
    """Well state container."""

    _state: WellState

    def __init__(self) -> None:
        """Initialize a well store and its state."""
        self._state = WellState(loaded_volumes={}, probed_heights={}, probed_volumes={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        state_update = get_state_update(action)
        if state_update is not None:
            self._handle_loaded_liquid_update(state_update)
            self._handle_probed_liquid_update(state_update)
            self._handle_operated_liquid_update(state_update)

    def _handle_loaded_liquid_update(
        self, state_update: update_types.StateUpdate
    ) -> None:
        if state_update.loaded_liquid != update_types.NO_CHANGE:
            labware_id = state_update.loaded_liquid.labware_id
            for (well, volume) in state_update.loaded_liquid.volumes.items():
                self._state.loaded_volumes[labware_id][well] = LoadedVolumeInfo(
                    volume=volume,
                    last_loaded=state_update.loaded_liquid.last_loaded,
                    operations_since_load=0,
                )

    def _handle_probed_liquid_update(
        self, state_update: update_types.StateUpdate
    ) -> None:
        if state_update.probed_liquid != update_types.NO_CHANGE:
            labware_id = state_update.probed_liquid.labware_id
            well_name = state_update.probed_liquid.well_name
            self._state.probed_heights[labware_id][well_name] = ProbedHeightInfo(
                height=state_update.probed_liquid.height,
                last_probed=state_update.probed_liquid.last_probed,
            )
            self._state.probed_volumes[labware_id][well_name] = ProbedVolumeInfo(
                volume=state_update.probed_liquid.volume,
                last_probed=state_update.probed_liquid.last_probed,
                operations_since_probe=0,
            )

    def _handle_operated_liquid_update(
        self, state_update: update_types.StateUpdate
    ) -> None:
        if state_update.operated_liquid != update_types.NO_CHANGE:
            labware_id = state_update.operated_liquid.labware_id
            well_name = state_update.operated_liquid.well_name
            del self._state.probed_heights[labware_id][well_name]
            prev_loaded_vol_info = self._state.loaded_volumes[labware_id][well_name]
            if prev_loaded_vol_info.volume:
                self._state.loaded_volumes[labware_id][well_name] = LoadedVolumeInfo(
                    volume=prev_loaded_vol_info.volume
                    + state_update.operated_liquid.volume,
                    last_loaded=prev_loaded_vol_info.last_loaded,
                    operations_since_load=prev_loaded_vol_info.operations_since_load
                    + 1,
                )
            prev_probed_vol_info = self._state.probed_volumes[labware_id][well_name]
            if prev_probed_vol_info.volume:
                self._state.probed_volumes[labware_id][well_name] = ProbedVolumeInfo(
                    volume=prev_probed_vol_info.volume
                    + state_update.operated_liquid.volume,
                    last_probed=prev_probed_vol_info.last_probed,
                    operations_since_probe=prev_probed_vol_info.operations_since_probe
                    + 1,
                )


class WellView(HasState[WellState]):
    """Read-only well state view."""

    _state: WellState

    def __init__(self, state: WellState) -> None:
        """Initialize the computed view of well state.

        Arguments:
            state: Well state dataclass used for all calculations.
        """
        self._state = state

    # if volume requested, loaded_volumes or probed_volumes
    # if height requested, probed_heights or loaded_vols_to_height or probed_vols_to_height
    # to get height, call GeometryView.get_well_height, which does conversion if needed

    # update this
    def get_all(self) -> List[LiquidHeightSummary]:
        """Get all well liquid heights."""
        all_heights: List[LiquidHeightSummary] = []
        for labware, wells in self._state.probed_heights.items():
            for well, lhi in wells.items():
                lhs = LiquidHeightSummary(
                    labware_id=labware,
                    well_name=well,
                    height=lhi.height,
                    last_measured=lhi.last_probed,
                )
            all_heights.append(lhs)
        return all_heights

    # update this
    def get_all_in_labware(self, labware_id: str) -> List[LiquidHeightSummary]:
        """Get all well liquid heights for a particular labware."""
        all_heights: List[LiquidHeightSummary] = []
        for well, lhi in self._state.probed_heights[labware_id].items():
            lhs = LiquidHeightSummary(
                labware_id=labware_id,
                well_name=well,
                height=lhi.height,
                last_measured=lhi.last_probed,
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
            height = self._state.probed_heights[labware_id][well_name].height
            return height
        except KeyError:
            return None

    def has_measured_liquid_height(self, labware_id: str, well_name: str) -> bool:
        """Returns True if the well has been liquid level probed previously."""
        try:
            return bool(self._state.probed_heights[labware_id][well_name].height)
        except KeyError:
            return False

    def get_well_liquid_info(
        self, labware_id: str, well_name: str
    ) -> Tuple[
        Optional[LoadedVolumeInfo],
        Optional[ProbedHeightInfo],
        Optional[ProbedVolumeInfo],
    ]:
        """Return all the liquid info for a well."""
        loaded_volume_info = self._state.loaded_volumes[labware_id][well_name]
        probed_height_info = self._state.probed_heights[labware_id][well_name]
        probed_volume_info = self._state.probed_volumes[labware_id][well_name]
        return loaded_volume_info, probed_height_info, probed_volume_info
