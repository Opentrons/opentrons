"""Test all labware to see if z speed is fast enough to do dynamic on all labware."""
from opentrons.protocol_engine.resources.labware_data_provider import (
    LabwareDataProvider,
)
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    InnerWellGeometry,
    UserDefinedVolumes,
)
from opentrons_shared_data.labware import list_definitions
from opentrons.config.defaults_ot3 import DEFAULT_MAX_SPEEDS
from opentrons.hardware_control.types import OT3AxisKind

from opentrons.protocol_engine.state.inner_well_math_utils import (
    find_height_inner_well_geometry,
    find_volume_inner_well_geometry,
    find_height_user_defined_volumes,
    find_volume_user_defined_volumes,
)

from typing import List, Tuple

ninety_six_faster_than_em_point = 62


def _get_all_labware() -> List[LabwareDefinition]:
    labware_list = list_definitions()
    labware_defs = []
    for load_name, version, _ in labware_list:
        labware_defs.append(
            LabwareDataProvider._get_labware_definition_sync(
                load_name, "opentrons", version
            )
        )
    wellplates = [
        lw for lw in labware_defs if len(lw.wells) > 0 and not lw.parameters.isTiprack
    ]
    return wellplates


def _get_each_well_type(
    labware: LabwareDefinition,
) -> List[InnerWellGeometry | UserDefinedVolumes]:
    if labware.innerLabwareGeometry is not None:
        return list(labware.innerLabwareGeometry.values())
    return []


def _get_max_nozzles_per_well(labware: LabwareDefinition) -> int:
    if labware.parameters.format == "irregular":
        return 1
    labware_columns = [column for column in labware.ordering]
    if len(labware_columns) >= 12 and len(labware_columns[0]) >= 8:
        # 96 or 384 plate
        return 1
    # reservoir
    return int(96 / len(labware_columns) / len(labware_columns[0]))


def _get_max_flow_rate(nozzles_per_well: int) -> Tuple[float, float]:
    if nozzles_per_well >= ninety_six_faster_than_em_point:
        # the 96 channel beats out total flow rate if there's > 61.15 nozzles per well
        return (187.2, 2.0)
    # otherwise the 8 channel em pipette is the worst case scenario in either 8 or single tip mode.
    return (1431.0, 1.5)


def _get_dead_volume(
    well_geometry: InnerWellGeometry | UserDefinedVolumes, pip_dead_height: float
) -> float:
    if isinstance(well_geometry, InnerWellGeometry):
        return find_volume_inner_well_geometry(  # type: ignore[return-value]
            target_height=pip_dead_height, well_geometry=well_geometry
        )
    else:
        return find_volume_user_defined_volumes(  # type: ignore[return-value]
            target_height=pip_dead_height, well_geometry=well_geometry
        )


def _get_height_from_volume(
    well_geometry: InnerWellGeometry | UserDefinedVolumes, target_volume: float
) -> float:
    if isinstance(well_geometry, InnerWellGeometry):
        return find_height_inner_well_geometry(  # type: ignore[return-value]
            target_volume=target_volume, well_geometry=well_geometry
        )
    else:
        return find_height_user_defined_volumes(  # type: ignore[return-value]
            target_volume=target_volume, well_geometry=well_geometry
        )


def _get_z_speed(nozzles_per_well: int) -> float:
    if nozzles_per_well >= ninety_six_faster_than_em_point:
        return DEFAULT_MAX_SPEEDS.high_throughput_1000[OT3AxisKind.Z]
    return DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.Z]


def test_all_labware() -> None:
    """Run the test."""
    for labware in _get_all_labware():
        nozzles_per_well = _get_max_nozzles_per_well(labware)
        max_tip_size = 1000
        max_flow_rate, pip_dead_height = _get_max_flow_rate(nozzles_per_well)
        for well in _get_each_well_type(labware):
            dead_volume = _get_dead_volume(well, pip_dead_height)
            max_delta_h = _get_height_from_volume(
                well, dead_volume + (nozzles_per_well * max_tip_size)
            )
            delta_t = max_tip_size / max_flow_rate
            max_z_speed = _get_z_speed(nozzles_per_well)
            """
            print(
                f"max z speed {max_z_speed:3d} needed z speed {(max_delta_h / delta_t):5.2f} nozzles {nozzles_per_well:2d} {labware.metadata.displayName} "
            )
            """
            assert max_delta_h / delta_t <= max_z_speed
