"""Basic well data state and store."""
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union

from opentrons.protocol_engine.types import (
    ProbedHeightInfo,
    ProbedVolumeInfo,
    LoadedVolumeInfo,
    ProbedHeightSummary,
    ProbedVolumeSummary,
    LoadedVolumeSummary,
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
            self._handle_liquid_loaded_update(state_update)
            self._handle_liquid_probed_update(state_update)
            self._handle_liquid_operated_update(state_update)

    def _handle_liquid_loaded_update(
        self, state_update: update_types.StateUpdate
    ) -> None:
        if state_update.liquid_loaded != update_types.NO_CHANGE:
            labware_id = state_update.liquid_loaded.labware_id
            if labware_id not in self._state.loaded_volumes:
                self._state.loaded_volumes[labware_id] = {}
            for (well, volume) in state_update.liquid_loaded.volumes.items():
                self._state.loaded_volumes[labware_id][well] = LoadedVolumeInfo(
                    volume=volume,
                    last_loaded=state_update.liquid_loaded.last_loaded,
                    operations_since_load=0,
                )

    def _handle_liquid_probed_update(
        self, state_update: update_types.StateUpdate
    ) -> None:
        if state_update.liquid_probed != update_types.NO_CHANGE:
            labware_id = state_update.liquid_probed.labware_id
            well_name = state_update.liquid_probed.well_name
            if labware_id not in self._state.probed_heights:
                self._state.probed_heights[labware_id] = {}
            if labware_id not in self._state.probed_volumes:
                self._state.probed_volumes[labware_id] = {}
            self._state.probed_heights[labware_id][well_name] = ProbedHeightInfo(
                height=state_update.liquid_probed.height,
                last_probed=state_update.liquid_probed.last_probed,
            )
            self._state.probed_volumes[labware_id][well_name] = ProbedVolumeInfo(
                volume=state_update.liquid_probed.volume,
                last_probed=state_update.liquid_probed.last_probed,
                operations_since_probe=0,
            )

    def _handle_liquid_operated_update(
        self, state_update: update_types.StateUpdate
    ) -> None:
        if state_update.liquid_operated != update_types.NO_CHANGE:
            labware_id = state_update.liquid_operated.labware_id
            well_name = state_update.liquid_operated.well_name
            if (
                labware_id in self._state.loaded_volumes
                and well_name in self._state.loaded_volumes[labware_id]
            ):
                prev_loaded_vol_info = self._state.loaded_volumes[labware_id][well_name]
                assert prev_loaded_vol_info.volume is not None
                self._state.loaded_volumes[labware_id][well_name] = LoadedVolumeInfo(
                    volume=prev_loaded_vol_info.volume
                    + state_update.liquid_operated.volume,
                    last_loaded=prev_loaded_vol_info.last_loaded,
                    operations_since_load=prev_loaded_vol_info.operations_since_load
                    + 1,
                )
            if (
                labware_id in self._state.probed_heights
                and well_name in self._state.probed_heights[labware_id]
            ):
                del self._state.probed_heights[labware_id][well_name]
            if (
                labware_id in self._state.probed_volumes
                and well_name in self._state.probed_volumes[labware_id]
            ):
                prev_probed_vol_info = self._state.probed_volumes[labware_id][well_name]
                assert prev_probed_vol_info.volume is not None
                self._state.probed_volumes[labware_id][well_name] = ProbedVolumeInfo(
                    volume=prev_probed_vol_info.volume
                    + state_update.liquid_operated.volume,
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

    def get_all(
        self,
    ) -> List[Union[ProbedHeightSummary, ProbedVolumeSummary, LoadedVolumeSummary]]:
        """Get all well liquid info summaries."""
        all_summaries: List[
            Union[ProbedHeightSummary, ProbedVolumeSummary, LoadedVolumeSummary]
        ] = []
        for lv_labware, lv_wells in self._state.loaded_volumes.items():
            for lv_well, lvi in lv_wells.items():
                lvs = LoadedVolumeSummary(
                    labware_id=lv_labware,
                    well_name=lv_well,
                    volume=lvi.volume,
                    last_loaded=lvi.last_loaded,
                    operations_since_load=lvi.operations_since_load,
                )
                all_summaries.append(lvs)
        for ph_labware, ph_wells in self._state.probed_heights.items():
            for ph_well, phi in ph_wells.items():
                phs = ProbedHeightSummary(
                    labware_id=ph_labware,
                    well_name=ph_well,
                    height=phi.height,
                    last_probed=phi.last_probed,
                )
                all_summaries.append(phs)
        for pv_labware, pv_wells in self._state.probed_volumes.items():
            for pv_well, pvi in pv_wells.items():
                pvs = ProbedVolumeSummary(
                    labware_id=pv_labware,
                    well_name=pv_well,
                    volume=pvi.volume,
                    last_probed=pvi.last_probed,
                    operations_since_probe=pvi.operations_since_probe,
                )
                all_summaries.append(pvs)
        return all_summaries

    def get_well_liquid_info(
        self, labware_id: str, well_name: str
    ) -> Tuple[
        Optional[LoadedVolumeInfo],
        Optional[ProbedHeightInfo],
        Optional[ProbedVolumeInfo],
    ]:
        """Return all the liquid info for a well."""
        if (
            labware_id not in self._state.loaded_volumes
            or well_name not in self._state.loaded_volumes[labware_id]
        ):
            loaded_volume_info = None
        else:
            loaded_volume_info = self._state.loaded_volumes[labware_id][well_name]
        if (
            labware_id not in self._state.probed_heights
            or well_name not in self._state.probed_heights[labware_id]
        ):
            probed_height_info = None
        else:
            probed_height_info = self._state.probed_heights[labware_id][well_name]
        if (
            labware_id not in self._state.probed_volumes
            or well_name not in self._state.probed_volumes[labware_id]
        ):
            probed_volume_info = None
        else:
            probed_volume_info = self._state.probed_volumes[labware_id][well_name]
        return loaded_volume_info, probed_height_info, probed_volume_info
