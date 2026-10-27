"""Test state getters for retrieving liquid tracking views of state."""

import json
from datetime import datetime
from math import isclose
from os import listdir, path
from typing import Any, Dict
from unittest.mock import sentinel

import pytest
from decoy import Decoy

from opentrons_shared_data import get_shared_data_root, load_shared_data
from opentrons_shared_data.labware.labware_definition import (
    CuboidalFrustum,
    InnerWellGeometry,
    LabwareDefinition,
    SphericalSegment,
    labware_definition_type_adapter,
)
from opentrons_shared_data.pipette.types import (
    PipetteNameType,
)

from ..pipette_fixtures import get_default_nozzle_map
from .inner_geometry_test_params import INNER_WELL_GEOMETRY_TEST_PARAMS
from opentrons.protocol_engine import errors
from opentrons.protocol_engine.state import liquid_tracking
from opentrons.protocol_engine.state.geometry import GeometryView
from opentrons.protocol_engine.state.inner_well_math_utils import (
    find_height_inner_well_geometry,
    find_height_user_defined_volumes,
    find_volume_inner_well_geometry,
    find_volume_user_defined_volumes,
)
from opentrons.protocol_engine.state.labware import LabwareView
from opentrons.protocol_engine.state.liquid_tracking import LiquidTrackingView
from opentrons.protocol_engine.state.pipettes import PipetteView
from opentrons.protocol_engine.state.wells import WellView
from opentrons.protocol_engine.types import (
    LiquidHandlingWellLocation,
    LoadedVolumeInfo,
    ProbedHeightInfo,
    ProbedVolumeInfo,
    WellLiquidInfo,
    WellLocation,
    WellOffset,
    WellOrigin,
)
from opentrons.protocol_engine.types.liquid_level_detection import (
    LiquidTrackingType,
    SimulatedProbeResult,
)

_TEST_INNER_WELL_GEOMETRY = InnerWellGeometry(
    sections=[
        CuboidalFrustum(
            shape="cuboidal",
            topXDimension=7.6,
            topYDimension=8.5,
            bottomXDimension=5.6,
            bottomYDimension=6.5,
            topHeight=45,
            bottomHeight=20,
        ),
        CuboidalFrustum(
            shape="cuboidal",
            topXDimension=5.6,
            topYDimension=6.5,
            bottomXDimension=4.5,
            bottomYDimension=4.0,
            topHeight=20,
            bottomHeight=10,
        ),
        SphericalSegment(
            shape="spherical",
            radiusOfCurvature=6,
            topHeight=10,
            bottomHeight=0.0,
        ),
    ],
)


@pytest.fixture
def mock_labware_view(decoy: Decoy) -> LabwareView:
    """Get a mock in the shape of a LabwareView."""
    return decoy.mock(cls=LabwareView)


@pytest.fixture
def mock_well_view(decoy: Decoy) -> WellView:
    """Get a mock in the shape of a WellView."""
    return decoy.mock(cls=WellView)


@pytest.fixture
def mock_pipette_view(decoy: Decoy) -> PipetteView:
    """Get a mock in the shape of a PipetteView."""
    return decoy.mock(cls=PipetteView)


@pytest.fixture
def mock_geometry_view(decoy: Decoy) -> GeometryView:
    """Get a mock in the shape of a GeometryView."""
    return decoy.mock(cls=GeometryView)


@pytest.fixture
def inner_labware_geometry_fixture() -> LabwareDefinition:
    """Load a labware def containing an InnerWellGeometry object."""
    return labware_definition_type_adapter.validate_python(
        json.loads(
            load_shared_data("labware/fixtures/3/fixture_corning_24_plate.json").decode(
                "utf-8"
            )
        )
    )


@pytest.fixture
def user_volumes_fixture() -> LabwareDefinition:
    """Load a labware def containing a UserDefinedVolumes object."""
    return labware_definition_type_adapter.validate_python(
        json.loads(
            load_shared_data(
                "labware/fixtures/2/fixture_user_volumes_prototype.json"
            ).decode("utf-8")
        )
    )


@pytest.fixture
def mock_well_math_utils(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> Dict[str, Any]:
    """Patch inner_well_math_utils functions."""
    mocks = {
        "volume_user_volumes": decoy.mock(func=find_volume_user_defined_volumes),
        "height_user_volumes": decoy.mock(func=find_height_user_defined_volumes),
        "volume_inner_well_geometry": decoy.mock(func=find_volume_inner_well_geometry),
        "height_inner_well_geometry": decoy.mock(func=find_height_inner_well_geometry),
    }
    monkeypatch.setattr(
        liquid_tracking,
        "find_volume_user_defined_volumes",
        mocks["volume_user_volumes"],
    )
    monkeypatch.setattr(
        liquid_tracking,
        "find_height_user_defined_volumes",
        mocks["height_user_volumes"],
    )
    monkeypatch.setattr(
        liquid_tracking,
        "find_volume_inner_well_geometry",
        mocks["volume_inner_well_geometry"],
    )
    monkeypatch.setattr(
        liquid_tracking,
        "find_height_inner_well_geometry",
        mocks["height_inner_well_geometry"],
    )
    return mocks


@pytest.fixture
def subject(
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_pipette_view: PipetteView,
    mock_geometry_view: GeometryView,
) -> LiquidTrackingView:
    """Get a LiquidTrackingView with its store dependencies provided."""
    return LiquidTrackingView(
        labware_view=mock_labware_view,
        well_view=mock_well_view,
        pipette_view=mock_pipette_view,
        geometry_view=mock_geometry_view,
    )


def test_get_well_offset_adjustment_with_meniscus(
    decoy: Decoy,
    mock_well_view: WellView,
    subject: LiquidTrackingView,
) -> None:
    """It should be able to get the position of a well meniscus in a labware."""
    probe_time = datetime.now()
    probed_liquid_height = 5.53
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
        WellLiquidInfo(
            probed_volume=None,
            probed_height=ProbedHeightInfo(
                height=probed_liquid_height, last_probed=probe_time
            ),
            loaded_volume=None,
        )
    )
    result = subject.get_well_offset_adjustment(
        labware_id="labware-id",
        well_name="B2",
        well_location=WellLocation(
            origin=WellOrigin.MENISCUS,
            offset=WellOffset(x=2, y=3, z=4),
        ),
    )
    assert result == probed_liquid_height


def test_get_well_offset_adjustment_with_volume_offset_raises_error(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_pipette_view: PipetteView,
    subject: LiquidTrackingView,
) -> None:
    """Calling get_well_offset_adjustment with any volume offset should raise when there's no innerLabwareGeometry."""
    probe_time = datetime.now()
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=ProbedHeightInfo(height=45.0, last_probed=probe_time),
            probed_volume=None,
        )
    )
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_plate_def.wells["B2"]
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_raise(
        errors.IncompleteLabwareDefinitionError("Woops!")
    )

    with pytest.raises(errors.IncompleteLabwareDefinitionError):
        subject.get_well_offset_adjustment(
            labware_id="labware-id",
            well_name="B2",
            well_location=LiquidHandlingWellLocation(
                origin=WellOrigin.MENISCUS,
                offset=WellOffset(x=2, y=3, z=4),
                volumeOffset="operationVolume",
            ),
            operation_volume=-1245.833,
            pipette_id="pipette-id",
        )


def test_get_well_position_with_meniscus_and_literal_volume_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_pipette_view: PipetteView,
    subject: LiquidTrackingView,
) -> None:
    """It should be able to get the position of a well meniscus in a labware with a volume offset."""
    probe_time = datetime.now()
    well_def = well_plate_def.wells["B2"]
    probed_height = 5.53
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=ProbedHeightInfo(
                height=probed_height, last_probed=probe_time
            ),
            probed_volume=None,
        )
    )
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.5)

    meniscus_well_offset = WellOffset(x=2, y=3, z=4)
    result = subject.get_well_offset_adjustment(
        labware_id="labware-id",
        well_name="B2",
        well_location=LiquidHandlingWellLocation(
            origin=WellOrigin.MENISCUS,
            offset=meniscus_well_offset,
            volumeOffset="operationVolume",
        ),
        operation_volume=-124.58,
        pipette_id="pipette-id",
    )
    assert result == 4.3909


def test_get_well_position_with_meniscus_and_float_volume_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_pipette_view: PipetteView,
    subject: LiquidTrackingView,
) -> None:
    """It should be able to get the position of a well meniscus in a labware with a volume offset."""
    probe_time = datetime.now()
    well_def = well_plate_def.wells["B2"]
    probed_height = 5.53
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=ProbedHeightInfo(
                height=probed_height, last_probed=probe_time
            ),
            probed_volume=None,
        )
    )
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.5)

    meniscus_well_offset = WellOffset(x=2, y=3, z=4)
    result = subject.get_well_offset_adjustment(
        labware_id="labware-id",
        well_name="B2",
        well_location=LiquidHandlingWellLocation(
            origin=WellOrigin.MENISCUS,
            offset=meniscus_well_offset,
            volumeOffset=-124.58,
        ),
        operation_volume=-999,
        pipette_id="pipette-id",
    )
    assert result == 4.3909


@pytest.mark.parametrize(
    "operation_volume",
    [-500.0, -1000.0, -10000.0],
)
def test_get_well_position_adjusts_to_lower_boundary(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_pipette_view: PipetteView,
    subject: LiquidTrackingView,
    operation_volume: float,
) -> None:
    """If a volume offset is too small, geometry should constrain the volume offset to the well bounds."""
    probe_time = datetime.now()
    well_def = well_plate_def.wells["B2"]
    probed_height = 5.53
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=ProbedHeightInfo(
                height=probed_height, last_probed=probe_time
            ),
            probed_volume=None,
        )
    )
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.123)

    meniscus_well_offset = WellOffset(x=2, y=3, z=4)
    result = subject.get_well_offset_adjustment(
        labware_id="labware-id",
        well_name="B2",
        well_location=LiquidHandlingWellLocation(
            origin=WellOrigin.MENISCUS,
            offset=meniscus_well_offset,
            volumeOffset="operationVolume",
        ),
        operation_volume=operation_volume,
        pipette_id="pipette-id",
    )
    assert result == 0.123


@pytest.mark.parametrize(
    "operation_volume",
    [500.0, 1000.0, 10000.0],
)
def test_get_well_position_adjusts_to_higher_boundary(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_pipette_view: PipetteView,
    subject: LiquidTrackingView,
    operation_volume: float,
) -> None:
    """If a volume offset is too small, geometry should constrain the volume offset to the well bounds."""
    probe_time = datetime.now()
    well_def = well_plate_def.wells["B2"]
    probed_height = 5.53
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=ProbedHeightInfo(
                height=probed_height, last_probed=probe_time
            ),
            probed_volume=None,
        )
    )
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.123)

    meniscus_well_offset = WellOffset(x=2, y=3, z=4)
    result = subject.get_well_offset_adjustment(
        labware_id="labware-id",
        well_name="B2",
        well_location=LiquidHandlingWellLocation(
            origin=WellOrigin.MENISCUS,
            offset=meniscus_well_offset,
            volumeOffset="operationVolume",
        ),
        operation_volume=operation_volume,
        pipette_id="pipette-id",
    )
    assert result == 10.67


def test_get_latest_volume_information(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    subject: LiquidTrackingView,
) -> None:
    """It should raise an InvalidDispenseVolumeError if too much volume is specified."""
    # Setup
    load_time = datetime.min
    probe_time = datetime.now()

    decoy.when(mock_labware_view.get_well_geometry("labware-id", "A1")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    ten_ul_height = subject.get_well_height_at_volume(
        labware_id="labware-id", well_name="A1", volume=10.0
    )
    twenty_ul_height = subject.get_well_height_at_volume(
        labware_id="labware-id", well_name="A1", volume=20.0
    )

    # Make sure Get height with no information raises an error
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "A1")).then_return(
        None
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "A1")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=None,
            probed_volume=None,
        )
    )
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "A1")).then_return(
        None
    )

    with pytest.raises(errors.LiquidHeightUnknownError):
        subject.get_meniscus_height(labware_id="labware-id", well_name="A1")
    # Make sure get height with a valid load returns the correct height
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "A1")).then_return(
        WellLiquidInfo(
            loaded_volume=LoadedVolumeInfo(
                volume=10.0, last_loaded=load_time, operations_since_load=0
            ),
            probed_height=None,
            probed_volume=None,
        )
    )

    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "A1")).then_return(
        load_time
    )
    assert (
        subject.get_meniscus_height(labware_id="labware-id", well_name="A1")
        == ten_ul_height
    )

    # Make sure that if there is a probe after a load that we get the correct height
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "A1")).then_return(
        WellLiquidInfo(
            loaded_volume=LoadedVolumeInfo(
                volume=10.0, last_loaded=load_time, operations_since_load=0
            ),
            probed_height=ProbedHeightInfo(height=40.0, last_probed=probe_time),
            probed_volume=None,
        )
    )
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "A1")).then_return(
        probe_time
    )

    assert subject.get_meniscus_height(labware_id="labware-id", well_name="A1") == 40.0

    # Simulate a pipetting action and make sure we get the height based on the most current one
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "A1")).then_return(
        WellLiquidInfo(
            loaded_volume=LoadedVolumeInfo(
                volume=10.0, last_loaded=load_time, operations_since_load=1
            ),
            probed_height=None,
            probed_volume=ProbedVolumeInfo(
                volume=20.0, last_probed=probe_time, operations_since_probe=1
            ),
        )
    )
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "A1")).then_return(
        probe_time
    )
    assert (
        subject.get_meniscus_height(labware_id="labware-id", well_name="A1")
        == twenty_ul_height
    )

    # Simulate a calling load_liquid after a probe and make sure we get the height based on the load_liquid
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "A1")).then_return(
        WellLiquidInfo(
            loaded_volume=LoadedVolumeInfo(
                volume=10.0, last_loaded=datetime.max, operations_since_load=0
            ),
            probed_height=ProbedHeightInfo(height=40.0, last_probed=probe_time),
            probed_volume=ProbedVolumeInfo(
                volume=20.0, last_probed=probe_time, operations_since_probe=0
            ),
        )
    )
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "A1")).then_return(
        datetime.max
    )
    assert (
        subject.get_meniscus_height(labware_id="labware-id", well_name="A1")
        == ten_ul_height
    )


@pytest.mark.parametrize("initial_liquid_height", [5.6, SimulatedProbeResult()])
def test_virtual_get_well_height_after_liquid_handling(
    decoy: Decoy,
    subject: LiquidTrackingView,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    well_plate_def: LabwareDefinition,
    initial_liquid_height: LiquidTrackingType,
) -> None:
    """Make sure SimulatedLiquidProbe doesn't change geometry behavior."""
    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    fake_min_height = 0.5
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(fake_min_height)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    well_def = well_plate_def.wells["B2"]
    # make the depth match the phoney baloney innerwellgeomtry
    well_def = well_def.model_copy(update={"depth": 45.0})
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    operation_volume = 1000.0
    result_estimate = subject.get_well_height_after_liquid_handling(
        labware_id="labware-id",
        well_name="B2",
        pipette_id="pipette-id",
        initial_height=initial_liquid_height,
        volume=operation_volume,
    )
    #  make sure that math operations involving SimulatedProbeResult return the same instance of
    #  SimulatedProbeResult
    if isinstance(initial_liquid_height, SimulatedProbeResult):
        assert result_estimate == initial_liquid_height


@pytest.mark.parametrize("target_height_volume", [5.6, SimulatedProbeResult()])
def test_virtual_find_height_and_volume(
    target_height_volume: LiquidTrackingType,
) -> None:
    """Make sure geometry math helpers return the expected liquid tracking type."""
    height_estimate = find_height_inner_well_geometry(
        target_volume=target_height_volume,
        well_geometry=_TEST_INNER_WELL_GEOMETRY,
    )

    volume_estimate = find_volume_inner_well_geometry(
        target_height=target_height_volume, well_geometry=_TEST_INNER_WELL_GEOMETRY
    )

    #  make sure that math operations involving SimulatedProbeResult return the same instance of
    #  SimulatedProbeResult
    if isinstance(target_height_volume, SimulatedProbeResult):
        assert height_estimate == volume_estimate == target_height_volume


@pytest.mark.parametrize("target_measurement", ["height", "volume"])
@pytest.mark.parametrize("well_def_type", ["user_volumes", "inner_well_geometry"])
def test_find_well_height_and_volume(
    mock_labware_view: LabwareView,
    mock_well_math_utils: Dict[str, Any],
    user_volumes_fixture: LabwareDefinition,
    inner_labware_geometry_fixture: LabwareDefinition,
    decoy: Decoy,
    subject: LiquidTrackingView,
    target_measurement: str,
    well_def_type: str,
) -> None:
    """Test that find_volume_at_well_height and find_height_at_well_volume call the correct functions."""
    assert inner_labware_geometry_fixture.innerLabwareGeometry is not None
    assert user_volumes_fixture.innerLabwareGeometry is not None
    inner_well_geometry = [
        well for well in inner_labware_geometry_fixture.innerLabwareGeometry.values()
    ][0]
    user_defined_volumes = [
        well for well in user_volumes_fixture.innerLabwareGeometry.values()
    ][0]
    if well_def_type == "inner_well_geometry":
        labware_id = "iwg"
        geometry_def = inner_well_geometry
    else:
        labware_id = "udv"
        geometry_def = user_defined_volumes

    decoy.when(mock_labware_view.get_well_geometry(labware_id, "A1")).then_return(
        geometry_def
    )
    # mock the correct inner_well_math_utils functions
    decoy.when(
        mock_well_math_utils[target_measurement + "_" + well_def_type](
            sentinel.arbitrary_height_volume, geometry_def
        )
    ).then_return(sentinel.arbitrary_return_val)

    if target_measurement == "height":
        assert (
            subject._find_height_at_well_volume(
                labware_id=labware_id,
                well_name="A1",
                target_volume=sentinel.arbitrary_height_volume,
            )
            == sentinel.arbitrary_return_val
        )
    elif target_measurement == "volume":
        assert (
            subject._find_volume_at_well_height(
                labware_id=labware_id,
                well_name="A1",
                target_height=sentinel.arbitrary_height_volume,
            )
            == sentinel.arbitrary_return_val
        )


@pytest.mark.parametrize(
    [
        "labware_id",
        "well_name",
        "input_volume_bottom",
        "input_volume_top",
        "expected_height_from_bottom_mm",
        "expected_height_from_top_mm",
    ],
    INNER_WELL_GEOMETRY_TEST_PARAMS,
)
def test_get_well_height_at_volume(
    decoy: Decoy,
    subject: LiquidTrackingView,
    labware_id: str,
    well_name: str,
    input_volume_bottom: float,
    input_volume_top: float,
    expected_height_from_bottom_mm: float,
    expected_height_from_top_mm: float,
    mock_labware_view: LabwareView,
) -> None:
    """Test getting the well height at a given volume."""

    def _get_labware_def() -> LabwareDefinition:
        def_dir = str(get_shared_data_root()) + f"/labware/definitions/2/{labware_id}"
        version_str = max([str(version) for version in listdir(def_dir)])
        def_path = path.join(def_dir, version_str)
        _labware_def = labware_definition_type_adapter.validate_python(
            json.loads(load_shared_data(def_path).decode("utf-8"))
        )
        return _labware_def

    labware_def = _get_labware_def()
    assert labware_def.innerLabwareGeometry is not None
    well_geometry = labware_def.innerLabwareGeometry.get(well_name)
    assert well_geometry is not None
    well_definition = [
        well
        for well in labware_def.wells.values()
        if well.geometryDefinitionId == well_name
    ][0]

    decoy.when(mock_labware_view.get_well_geometry(labware_id, well_name)).then_return(
        well_geometry
    )
    decoy.when(
        mock_labware_view.get_well_definition(labware_id, well_name)
    ).then_return(well_definition)

    found_height_bottom = subject.get_well_height_at_volume(
        labware_id=labware_id, well_name=well_name, volume=input_volume_bottom
    )
    found_height_top = subject.get_well_height_at_volume(
        labware_id=labware_id, well_name=well_name, volume=input_volume_top
    )
    assert isinstance(found_height_bottom, float)
    assert isinstance(found_height_top, float)
    assert isclose(found_height_bottom, expected_height_from_bottom_mm, rel_tol=0.01)
    vol_2_expected_height_from_bottom = (
        well_definition.depth - expected_height_from_top_mm
    )
    assert isclose(found_height_top, vol_2_expected_height_from_bottom, rel_tol=0.01)


@pytest.mark.parametrize(
    [
        "labware_id",
        "well_name",
        "expected_volume_bottom",
        "expected_volume_top",
        "input_height_from_bottom_mm",
        "input_height_from_top_mm",
    ],
    INNER_WELL_GEOMETRY_TEST_PARAMS,
)
def test_get_well_volume_at_height(
    decoy: Decoy,
    subject: LiquidTrackingView,
    labware_id: str,
    well_name: str,
    expected_volume_bottom: float,
    expected_volume_top: float,
    input_height_from_bottom_mm: float,
    input_height_from_top_mm: float,
    mock_labware_view: LabwareView,
) -> None:
    """Test getting the volume at a given height."""

    def _get_labware_def() -> LabwareDefinition:
        def_dir = str(get_shared_data_root()) + f"/labware/definitions/2/{labware_id}"
        version_str = max([str(version) for version in listdir(def_dir)])
        def_path = path.join(def_dir, version_str)
        _labware_def = labware_definition_type_adapter.validate_python(
            json.loads(load_shared_data(def_path).decode("utf-8"))
        )
        return _labware_def

    labware_def = _get_labware_def()
    assert labware_def.innerLabwareGeometry is not None
    well_geometry = labware_def.innerLabwareGeometry.get(well_name)
    assert well_geometry is not None
    well_definition = [
        well
        for well in labware_def.wells.values()
        if well.geometryDefinitionId == well_name
    ][0]

    decoy.when(mock_labware_view.get_well_geometry(labware_id, well_name)).then_return(
        well_geometry
    )
    decoy.when(
        mock_labware_view.get_well_definition(labware_id, well_name)
    ).then_return(well_definition)

    found_volume_bottom = subject.get_well_volume_at_height(
        labware_id=labware_id, well_name=well_name, height=input_height_from_bottom_mm
    )
    vol_2_input_height_from_bottom = well_definition.depth - input_height_from_top_mm
    found_volume_top = subject.get_well_volume_at_height(
        labware_id=labware_id,
        well_name=well_name,
        height=vol_2_input_height_from_bottom,
    )
    assert isinstance(found_volume_bottom, float)
    assert isinstance(found_volume_top, float)
    assert isclose(found_volume_bottom, expected_volume_bottom, rel_tol=0.01)
    assert isclose(found_volume_top, expected_volume_top, rel_tol=0.01)
