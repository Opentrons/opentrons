"""Test methods that translate well heights and volumes for GeometryView."""
from opentrons.protocol_engine.state.frustum_helpers import (
    find_volume_at_well_height,
    find_height_at_well_volume,
)
from ...protocol_runner.test_json_translator import _load_labware_definition_data


def test_find_volume_at_well_height() -> None:
    """Test find_volume_at_well_height."""
    labware_def = _load_labware_definition_data()
    assert labware_def.innerLabwareGeometry is not None
    inner_well_def = labware_def.innerLabwareGeometry["welldefinition1111"]
    result = find_volume_at_well_height(40.0, inner_well_def)
    assert result == 1245.833  # use isclose() or something


def test_find_height_at_well_volume() -> None:
    """Test find_height_at_well_volume."""
    labware_def = _load_labware_definition_data()
    assert labware_def.innerLabwareGeometry is not None
    inner_well_def = labware_def.innerLabwareGeometry["welldefinition1111"]
    result = find_height_at_well_volume(1245.833, inner_well_def)
    assert result == 40.0  # use isclose() or something
