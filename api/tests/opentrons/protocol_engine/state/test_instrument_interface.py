"""Test state getters for retrieving instrumenting interfacing views of state."""

import inspect
import json
from datetime import datetime
from math import isclose
from os import listdir, path
from typing import Any, Dict, List, NamedTuple, Optional, Tuple, cast
from unittest.mock import sentinel

import pytest
from decoy import Decoy

from opentrons_shared_data import get_shared_data_root, load_shared_data
from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.types import CutoutFixture, DeckDefinitionV5
from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError
from opentrons_shared_data.labware import load_definition as load_labware_definition
from opentrons_shared_data.labware.labware_definition import (
    AxisAlignedBoundingBox3D,
    ConicalFrustum,
    ContainedSpace,
    ContainmentShape,
    CuboidalFrustum,
    Extents,
    InnerWellGeometry,
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
    SphericalSegment,
    Vector3D,
    labware_definition_type_adapter,
)
from opentrons_shared_data.labware.labware_definition import (
    Dimensions as LabwareDimensions,
)
from opentrons_shared_data.labware.labware_definition import (
    Parameters2 as LabwareDefinition2Parameters,
)
from opentrons_shared_data.labware.labware_definition import (
    Vector3D as LabwareDefinitionVector3D,
)
from opentrons_shared_data.labware.types import LabwareUri, LocatingFeatures
from opentrons_shared_data.module.types import ModuleOrientation
from opentrons_shared_data.pipette import pipette_definition
from opentrons_shared_data.pipette.types import (
    LiquidClasses as VolumeModes,
)
from opentrons_shared_data.pipette.types import (
    PipetteNameType,
)
from opentrons_shared_data.robot.types import (
    RobotDefinition,
    mountOffset,
    paddingOffset,
)

from ..mock_circular_frusta import TEST_EXAMPLES as CIRCULAR_TEST_EXAMPLES
from ..mock_rectangular_frusta import TEST_EXAMPLES as RECTANGULAR_TEST_EXAMPLES
from ..pipette_fixtures import get_default_nozzle_map
from .command_fixtures import (
    create_comment_command,
)
from .inner_geometry_test_params import INNER_WELL_GEOMETRY_TEST_PARAMS
from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.motion_planning.adjacent_slots_getters import (
    get_east_west_slots,
    get_north_south_slots,
)
from opentrons.protocol_engine import errors
from opentrons.protocol_engine.actions import (
    SetDeckConfigurationAction,
    SucceedCommandAction,
)
from opentrons.protocol_engine.commands import Command
from opentrons.protocol_engine.state import _move_types, geometry
from opentrons.protocol_engine.state._axis_aligned_bounding_box import (
    AxisAlignedBoundingBox3D as EngineAABB,
)
from opentrons.protocol_engine.state.addressable_areas import (
    AddressableAreaState,
    AddressableAreaStore,
    AddressableAreaView,
)
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.state.geometry import GeometryView
from opentrons.protocol_engine.state.inner_well_math_utils import (
    _height_from_volume_circular,
    _height_from_volume_rectangular,
    _volume_from_height_circular,
    _volume_from_height_rectangular,
    find_height_inner_well_geometry,
    find_height_user_defined_volumes,
    find_volume_inner_well_geometry,
    find_volume_user_defined_volumes,
)
from opentrons.protocol_engine.state.instrument_interface import InstrumentInterfaceView
from opentrons.protocol_engine.state.labware import (
    LabwareStore,
    LabwareView,
)
from opentrons.protocol_engine.state.liquid_tracking import LiquidTrackingView
from opentrons.protocol_engine.state.modules import ModuleStore, ModuleView
from opentrons.protocol_engine.state.pipettes import (
    BoundingNozzlesOffsets,
    PipetteBoundingBoxOffsets,
    PipetteStore,
    PipetteView,
    StaticPipetteConfig,
)
from opentrons.protocol_engine.state.update_types import (
    AddressableAreaUsedUpdate,
    LoadedLabwareUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.state.wells import WellStore, WellView
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    SYSTEM_LOCATION,
    WASTE_CHUTE_LOCATION,
    AddressableArea,
    AddressableAreaLocation,
    AddressableOffsetVector,
    AreaType,
    CurrentAddressableArea,
    CurrentPipetteLocation,
    CurrentWell,
    DeckSlotLocation,
    DeckType,
    Dimensions,
    DropTipWellLocation,
    DropTipWellOrigin,
    GripperMoveType,
    InStackerHopperLocation,
    LabwareLocation,
    LabwareOffsetVector,
    LiquidHandlingWellLocation,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    LoadedVolumeInfo,
    ModuleDefinition,
    ModuleLocation,
    ModuleModel,
    ModuleOffsetData,
    ModuleOffsetVector,
    NotOnDeckLocationSequenceComponent,
    OnAddressableAreaLocationSequenceComponent,
    OnAddressableAreaOffsetLocationSequenceComponent,
    OnCutoutFixtureLocationSequenceComponent,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
    OnLabwareOffsetLocationSequenceComponent,
    OnModuleLocationSequenceComponent,
    OnModuleOffsetLocationSequenceComponent,
    PotentialCutoutFixture,
    ProbedHeightInfo,
    ProbedVolumeInfo,
    TipGeometry,
    WellLiquidInfo,
    WellLocation,
    WellLocationFunction,
    WellOffset,
    WellOrigin,
)
from opentrons.protocol_engine.types.liquid_level_detection import (
    LiquidTrackingType,
    SimulatedProbeResult,
)
from opentrons.types import (
    DeckSlotName,
    MeniscusTrackingTarget,
    MountType,
    Point,
    StagingSlotName,
)

# TODO refactor this into conftest
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
def available_sensors() -> pipette_definition.AvailableSensorDefinition:
    """Provide a list of sensors."""
    return pipette_definition.AvailableSensorDefinition(
        sensors=["pressure", "capacitive", "environment"]
    )


@pytest.fixture
def mock_labware_view(decoy: Decoy) -> LabwareView:
    """Get a mock in the shape of a LabwareView."""
    return decoy.mock(cls=LabwareView)


@pytest.fixture
def mock_pipette_view(decoy: Decoy) -> PipetteView:
    """Get a mock in the shape of a PipetteView."""
    return decoy.mock(cls=PipetteView)


@pytest.fixture
def mock_geometry_view(decoy: Decoy) -> GeometryView:
    """Get a mock in the shape of a GeometryView."""
    return decoy.mock(cls=GeometryView)


@pytest.fixture
def mock_addressable_area_view(decoy: Decoy) -> AddressableAreaView:
    """Get a mock in the shape of a AddressableAreaView."""
    return decoy.mock(cls=AddressableAreaView)


@pytest.fixture
def mock_liquid_tracking(decoy: Decoy) -> LiquidTrackingView:
    """Get a mock in the shape of a LiquidTrackingView."""
    return decoy.mock(cls=LiquidTrackingView)


# TODO refactor this into conftest
_PARENT_ORIGIN_TO_LABWARE_ORIGIN = Point(x=10, y=20, z=30)


@pytest.fixture(autouse=True)
def mock_labware_origin_math(monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock labware origin math's main export."""
    monkeypatch.setattr(
        "opentrons.protocol_engine.state.geometry.get_stackup_origin_to_labware_origin",
        lambda *args, **kwargs: _PARENT_ORIGIN_TO_LABWARE_ORIGIN,
    )


@pytest.fixture
def subject(
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    mock_addressable_area_view: AddressableAreaView,
    mock_geometry_view: GeometryView,
    mock_liquid_tracking: LiquidTrackingView,
) -> InstrumentInterfaceView:
    return InstrumentInterfaceView(
        labware_view=mock_labware_view,
        pipette_view=mock_pipette_view,
        addressable_area_view=mock_addressable_area_view,
        geometry_view=mock_geometry_view,
        liquid_tracking_view=mock_liquid_tracking,
    )


@pytest.mark.parametrize(
    "probed_height", [-1.0, 0.0, 5.0, 10.0, 1000.0, SimulatedProbeResult()]
)
def test_validate_probed_height(
    decoy: Decoy,
    subject: InstrumentInterfaceView,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    probed_height: LiquidTrackingType,
) -> None:
    """Test validation for probed liquid heights."""
    labware_id = "labware-id"
    pipette_id = "pipette-id"
    well_name = "B2"
    well_def = well_plate_def.wells[well_name]
    decoy.when(
        mock_labware_view.get_well_definition(labware_id, well_name)
    ).then_return(well_def)
    fake_min_height = 0.5
    well_depth = well_def.depth
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id=pipette_id)
    ).then_return(fake_min_height)
    # Only invalid floats should raise an error
    if isinstance(probed_height, float):
        if probed_height < fake_min_height or probed_height > well_depth:
            with pytest.raises(PipetteLiquidNotFoundError):
                subject.validate_probed_height(
                    labware_id=labware_id,
                    well_name=well_name,
                    pipette_id=pipette_id,
                    probed_height=probed_height,
                )
    # floats within bounds and SimulatedProbeResult should not cause an error
    else:
        subject.validate_probed_height(
            labware_id=labware_id,
            well_name=well_name,
            pipette_id=pipette_id,
            probed_height=probed_height,
        )


# TODO These will be uncommented in the refactor well position PR
# def test_get_well_position_with_meniscus_offset(
#     decoy: Decoy,
#     well_plate_def: LabwareDefinition,
#     mock_labware_view: LabwareView,
#     mock_well_view: WellView,
#     mock_addressable_area_view: AddressableAreaView,
#     mock_pipette_view: PipetteView,
#     subject: InstrumentInterfaceView,
# ) -> None:
#     """It should be able to get the position of a well meniscus in a labware."""
#     labware_data = LoadedLabware(
#         id="labware-id",
#         loadName="load-name",
#         definitionUri="definition-uri",
#         location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
#         offsetId="offset-id",
#     )
#     meniscus_offset = WellOffset(x=2, y=3, z=4)
#     calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
#     slot_pos = Point(4, 5, 6)
#     probed_liquid_height = 5.53
#     well_def = well_plate_def.wells["B2"]
#
#     decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
#     decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
#         well_plate_def
#     )
#     decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
#         calibration_offset
#     )
#     decoy.when(
#         mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
#     ).then_return(slot_pos)
#     decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
#         well_def
#     )
#     probe_time = datetime.now()
#     decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
#         probe_time
#     )
#     decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
#         WellLiquidInfo(
#             probed_volume=None,
#             probed_height=ProbedHeightInfo(
#                 height=probed_liquid_height, last_probed=probe_time
#             ),
#             loaded_volume=None,
#         )
#     )
#     decoy.when(
#         mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
#     ).then_return(0.5)
#
#     result = subject.get_well_position(
#         labware_id="labware-id",
#         well_name="B2",
#         well_location=WellLocation(
#             origin=WellOrigin.MENISCUS,
#             offset=meniscus_offset,
#         ),
#         pipette_id="pipette-id",
#     )
#     # slot_pos + calibration_offset + well_def + meniscus_offset + meniscus height(for z)
#     assert result == Point(
#         x=slot_pos[0]
#         + calibration_offset.x
#         + well_def.x
#         + meniscus_offset.x
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
#         y=slot_pos[1]
#         + calibration_offset.y
#         + well_def.y
#         + meniscus_offset.y
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
#         z=slot_pos[2]
#         + calibration_offset.z
#         + well_def.z
#         + meniscus_offset.z
#         + probed_liquid_height
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
#     )
#
#
# def test_get_well_position_with_volume_offset_raises_error(
#     decoy: Decoy,
#     well_plate_def: LabwareDefinition,
#     mock_labware_view: LabwareView,
#     mock_well_view: WellView,
#     mock_addressable_area_view: AddressableAreaView,
#     mock_pipette_view: PipetteView,
#     subject: InstrumentInterfaceView,
# ) -> None:
#     """Calling get_well_position with any volume offset should raise an error when there's no innerLabwareGeometry."""
#     labware_data = LoadedLabware(
#         id="labware-id",
#         loadName="load-name",
#         definitionUri="definition-uri",
#         location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
#         offsetId="offset-id",
#     )
#     calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
#     slot_pos = Point(4, 5, 6)
#     well_def = well_plate_def.wells["B2"]
#
#     decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
#     decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
#         well_plate_def
#     )
#     decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
#         calibration_offset
#     )
#     decoy.when(
#         mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
#     ).then_return(slot_pos)
#     decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
#         well_def
#     )
#     probe_time = datetime.now()
#     decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
#         probe_time
#     )
#     decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
#         WellLiquidInfo(
#             loaded_volume=None,
#             probed_height=ProbedHeightInfo(height=45.0, last_probed=probe_time),
#             probed_volume=None,
#         )
#     )
#     decoy.when(
#         mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
#     ).then_return(0.5)
#     decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_raise(
#         errors.IncompleteLabwareDefinitionError("Woops!")
#     )
#
#     with pytest.raises(errors.IncompleteLabwareDefinitionError):
#         subject.get_well_position(
#             labware_id="labware-id",
#             well_name="B2",
#             well_location=LiquidHandlingWellLocation(
#                 origin=WellOrigin.MENISCUS,
#                 offset=WellOffset(x=2, y=3, z=4),
#                 volumeOffset="operationVolume",
#             ),
#             operation_volume=-1245.833,
#             pipette_id="pipette-id",
#         )
#
#
# def test_get_well_position_with_meniscus_and_literal_volume_offset(
#     decoy: Decoy,
#     well_plate_def: LabwareDefinition,
#     mock_labware_view: LabwareView,
#     mock_well_view: WellView,
#     mock_addressable_area_view: AddressableAreaView,
#     mock_pipette_view: PipetteView,
#     subject: InstrumentInterfaceView,
# ) -> None:
#     """It should be able to get the position of a well meniscus in a labware with a volume offset."""
#     labware_data = LoadedLabware(
#         id="labware-id",
#         loadName="load-name",
#         definitionUri="definition-uri",
#         location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
#         offsetId="offset-id",
#     )
#     calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
#     slot_pos = Point(4, 5, 6)
#     well_def = well_plate_def.wells["B2"]
#     meniscus_well_offset = WellOffset(x=2, y=3, z=4)
#     probed_height = 5.53
#
#     pip_type = PipetteNameType.P300_SINGLE
#     decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
#         get_default_nozzle_map(pip_type)
#     )
#     decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
#     decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
#         well_plate_def
#     )
#     decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
#         calibration_offset
#     )
#     decoy.when(
#         mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
#     ).then_return(slot_pos)
#     probe_time = datetime.now()
#     decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
#         probe_time
#     )
#     decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
#         well_def
#     )
#     decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
#         WellLiquidInfo(
#             loaded_volume=None,
#             probed_height=ProbedHeightInfo(
#                 height=probed_height, last_probed=probe_time
#             ),
#             probed_volume=None,
#         )
#     )
#     decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
#         _TEST_INNER_WELL_GEOMETRY
#     )
#     decoy.when(
#         mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
#     ).then_return(0.5)
#
#     result = subject.get_well_position(
#         labware_id="labware-id",
#         well_name="B2",
#         well_location=LiquidHandlingWellLocation(
#             origin=WellOrigin.MENISCUS,
#             offset=meniscus_well_offset,
#             volumeOffset="operationVolume",
#         ),
#         operation_volume=-124.58,
#         pipette_id="pipette-id",
#     )
#     volume_adjustment = 4.3909
#     expected = Point(
#         x=slot_pos[0]
#         + calibration_offset.x
#         + well_def.x
#         + meniscus_well_offset.x
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
#         y=slot_pos[1]
#         + calibration_offset.y
#         + well_def.y
#         + meniscus_well_offset.y
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
#         z=slot_pos[2]
#         + calibration_offset.z
#         + well_def.z
#         + meniscus_well_offset.z
#         + volume_adjustment
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
#     )
#     assert all([isclose(i[0], i[1], abs_tol=0.0001) for i in zip(result, expected)])


# def test_get_well_position_with_meniscus_and_float_volume_offset(
#     decoy: Decoy,
#     well_plate_def: LabwareDefinition,
#     mock_labware_view: LabwareView,
#     mock_well_view: WellView,
#     mock_addressable_area_view: AddressableAreaView,
#     mock_pipette_view: PipetteView,
#     subject: InstrumentInterfaceView,
# ) -> None:
#     """It should be able to get the position of a well meniscus in a labware with a volume offset."""
#     labware_data = LoadedLabware(
#         id="labware-id",
#         loadName="load-name",
#         definitionUri="definition-uri",
#         location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
#         offsetId="offset-id",
#     )
#     calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
#     slot_pos = Point(4, 5, 6)
#     probed_height = 5.35
#     meniscus_well_offset = WellOffset(x=2, y=3, z=4)
#     well_def = well_plate_def.wells["B2"]
#     pip_type = PipetteNameType.P300_SINGLE
#     decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
#         get_default_nozzle_map(pip_type)
#     )
#     decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
#     decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
#         well_plate_def
#     )
#     decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
#         calibration_offset
#     )
#     decoy.when(
#         mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
#     ).then_return(slot_pos)
#     well_def = well_def.model_copy(update={"depth": 45.0})
#     decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
#         well_def
#     )
#     probe_time = datetime.now()
#     decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
#         probe_time
#     )
#     decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
#         WellLiquidInfo(
#             loaded_volume=None,
#             probed_height=ProbedHeightInfo(
#                 height=probed_height, last_probed=probe_time
#             ),
#             probed_volume=None,
#         )
#     )
#     decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
#         _TEST_INNER_WELL_GEOMETRY
#     )
#     decoy.when(
#         mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
#     ).then_return(0.5)
#     operation_volume = -124.58
#     well_loc = LiquidHandlingWellLocation(
#         origin=WellOrigin.MENISCUS,
#         offset=meniscus_well_offset,
#         volumeOffset=operation_volume,
#     )
#     result = subject.get_well_position(
#         labware_id="labware-id",
#         well_name="B2",
#         well_location=well_loc,
#         pipette_id="pipette-id",
#     )
#     expected_vol_offset = subject.get_well_offset_adjustment(
#         labware_id="labware-id",
#         well_name="B2",
#         well_location=well_loc,
#         well_depth=well_def.depth,
#         pipette_id="pipette-id",
#         operation_volume=operation_volume,
#     )
#     assert isinstance(expected_vol_offset, float)
#     expected = Point(
#         x=slot_pos[0]
#         + calibration_offset.x
#         + well_def.x
#         + meniscus_well_offset.x
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
#         y=slot_pos[1]
#         + calibration_offset.y
#         + well_def.y
#         + meniscus_well_offset.y
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
#         z=slot_pos[2]
#         + calibration_offset.z
#         + well_def.z
#         + meniscus_well_offset.z
#         + expected_vol_offset
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
#     )
#     assert all([isclose(i[0], i[1], abs_tol=0.0001) for i in zip(result, expected)])
#
#
# @pytest.mark.parametrize(
#     "operation_volume",
#     [199.0, -10000.0, 10000.0],
# )
# def test_get_well_position_adjusts_well_position_to_boundaries(
#     decoy: Decoy,
#     well_plate_def: LabwareDefinition,
#     mock_labware_view: LabwareView,
#     mock_well_view: WellView,
#     mock_addressable_area_view: AddressableAreaView,
#     mock_pipette_view: PipetteView,
#     subject: InstrumentInterfaceView,
#     operation_volume: float,
# ) -> None:
#     """If a volume offset is too large or too small, geometry should constrain the volume offset to the well bounds ."""
#     labware_data = LoadedLabware(
#         id="labware-id",
#         loadName="load-name",
#         definitionUri="definition-uri",
#         location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
#         offsetId="offset-id",
#     )
#     calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
#     slot_pos = Point(4, 5, 6)
#     # should not constrain user-specified offsets
#     meniscus_well_offset = WellOffset(x=2, y=3, z=-40)
#     well_def = well_plate_def.wells["B2"]
#     lld_min_height = 0.5
#
#     decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
#     decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
#         well_plate_def
#     )
#     decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
#         calibration_offset
#     )
#     decoy.when(
#         mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
#     ).then_return(slot_pos)
#     well_def = well_def.model_copy(update={"depth": 45.0})
#     decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
#         well_def
#     )
#     probe_time = datetime.now()
#     decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
#         probe_time
#     )
#     decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
#         WellLiquidInfo(
#             loaded_volume=None,
#             probed_height=ProbedHeightInfo(height=40.0, last_probed=probe_time),
#             probed_volume=None,
#         )
#     )
#     decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
#         _TEST_INNER_WELL_GEOMETRY
#     )
#     pip_type = PipetteNameType.P300_SINGLE
#     decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
#         get_default_nozzle_map(pip_type)
#     )
#     decoy.when(
#         mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
#     ).then_return(lld_min_height)
#
#     # make sure that just the volume offset has been adjusted to the correct well boundary
#     # but the well offset overall can still end up outside the well
#     well_loc = LiquidHandlingWellLocation(
#         origin=WellOrigin.MENISCUS,
#         offset=meniscus_well_offset,
#         volumeOffset="operationVolume",
#     )
#     expected_vol_offset = subject.get_well_offset_adjustment(
#         labware_id="labware-id",
#         well_name="B2",
#         well_location=well_loc,
#         well_depth=well_def.depth,
#         pipette_id="pipette-id",
#         operation_volume=operation_volume,
#     )
#     assert isinstance(expected_vol_offset, float) or isinstance(
#         expected_vol_offset, int
#     )
#     result = subject.get_well_position(
#         labware_id="labware-id",
#         well_name="B2",
#         well_location=well_loc,
#         operation_volume=operation_volume,
#         pipette_id="pipette-id",
#     )
#     expected = Point(
#         x=slot_pos[0]
#         + calibration_offset.x
#         + well_def.x
#         + meniscus_well_offset.x
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
#         y=slot_pos[1]
#         + calibration_offset.y
#         + well_def.y
#         + meniscus_well_offset.y
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
#         z=slot_pos[2]
#         + calibration_offset.z
#         + well_def.z
#         + meniscus_well_offset.z
#         + expected_vol_offset
#         + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
#     )
#     assert all([isclose(i[0], i[1], abs_tol=0.0001) for i in zip(result, expected)])
#
#
# def test_get_well_position_with_meniscus(
#     decoy: Decoy,
#     well_plate_def: LabwareDefinition,
#     mock_labware_view: LabwareView,
#     mock_well_view: WellView,
#     mock_addressable_area_view: AddressableAreaView,
#     mock_pipette_view: PipetteView,
#     subject: InstrumentInterfaceView,
# ) -> None:
#     """It should be able to get the position of a well meniscus in a labware."""
#     labware_data = LoadedLabware(
#         id="labware-id",
#         loadName="load-name",
#         definitionUri="definition-uri",
#         location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
#         offsetId="offset-id",
#     )
#     calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
#     slot_pos = Point(4, 5, 6)
#     well_def = well_plate_def.wells["B2"]
#
#     decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
#     decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
#         well_plate_def
#     )
#     decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
#         calibration_offset
#     )
#     decoy.when(
#         mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
#     ).then_return(slot_pos)
#     decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
#         well_def
#     )
#     probe_time = datetime.now()
#     decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
#         probe_time
#     )
#     decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
#         WellLiquidInfo(
#             loaded_volume=LoadedVolumeInfo(
#                 volume=2000.0, last_loaded=probe_time, operations_since_load=0
#             ),
#             probed_height=None,
#             probed_volume=None,
#         )
#     )
#     decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
#         _TEST_INNER_WELL_GEOMETRY
#     )
#     decoy.when(
#         mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
#     ).then_return(0.5)
#
#     result = subject.get_well_position(
#         labware_id="labware-id",
#         well_name="B2",
#         well_location=WellLocation(
#             origin=WellOrigin.MENISCUS,
#             offset=WellOffset(x=2, y=3, z=4),
#         ),
#         pipette_id="pipette-id",
#     )
#
#     assert result == Point(
#         x=slot_pos[0] + 1 + well_def.x + 2 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
#         y=slot_pos[1] - 2 + well_def.y + 3 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
#         z=slot_pos[2]
#         + 3
#         + well_def.z
#         + 4
#         + 39.2423
#         + +_PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
#     )
#
#
# def test_get_relative_well_location(
#     decoy: Decoy,
#     well_plate_def: LabwareDefinition,
#     mock_labware_view: LabwareView,
#     mock_addressable_area_view: AddressableAreaView,
#     subject: InstrumentInterfaceView,
#     monkeypatch: pytest.MonkeyPatch,
# ) -> None:
#     """It should get the relative location of a well given an absolute position."""
#     monkeypatch.setattr(
#         "opentrons.protocol_engine.state.geometry.get_stackup_origin_to_labware_origin",
#         lambda *args, **kwargs: Point(0, 0, 0),
#     )
#     labware_data = LoadedLabware(
#         id="labware-id",
#         loadName="load-name",
#         definitionUri="definition-uri",
#         location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
#         offsetId="offset-id",
#     )
#     calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
#     slot_pos = Point(4, 5, 6)
#     well_def = well_plate_def.wells["B2"]
#
#     decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
#     decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
#         calibration_offset
#     )
#     decoy.when(
#         mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
#     ).then_return(slot_pos)
#     decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
#         well_def
#     )
#
#     result, _ = subject.get_relative_well_location(
#         labware_id="labware-id",
#         well_name="B2",
#         absolute_point=Point(
#             x=slot_pos[0] + 1 + well_def.x + 7,
#             y=slot_pos[1] - 2 + well_def.y + 8,
#             z=slot_pos[2] + 3 + well_def.z + well_def.depth + 9,
#         ),
#         location_type=WellLocationFunction.BASE,
#     )
#     assert result == WellLocation(
#         origin=WellOrigin.TOP,
#         offset=WellOffset.model_construct(
#             x=cast(float, pytest.approx(7)),
#             y=cast(float, pytest.approx(8)),
#             z=cast(float, pytest.approx(9)),
#         ),
#     )


# def test_get_relative_liquid_handling_well_location(
#     decoy: Decoy,
#     well_plate_def: LabwareDefinition,
#     mock_labware_view: LabwareView,
#     mock_addressable_area_view: AddressableAreaView,
#     subject: InstrumentInterfaceView,
# ) -> None:
#     """It should get the relative location of a well given an absolute position."""
#     labware_data = LoadedLabware(
#         id="labware-id",
#         loadName="b",
#         definitionUri=uri_from_details(namespace="a", load_name="b", version=1),
#         location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
#         offsetId=None,
#     )
#     decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
#     decoy.when(
#         mock_addressable_area_view.get_addressable_area_position("3")
#     ).then_return(Point(1, 2, 3))
#     calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
#     decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
#         calibration_offset
#     )
#
#     well_def = well_plate_def.wells["B2"]
#
#     decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
#         well_def
#     )
#
#     result, dynamic_liquid_tracking = subject.get_relative_well_location(
#         labware_id="labware-id",
#         well_name="B2",
#         absolute_point=Point(x=0, y=0, z=-2),
#         meniscus_tracking=MeniscusTrackingTarget.END,
#         location_type=WellLocationFunction.LIQUID_HANDLING,
#     )
#
#     assert result == LiquidHandlingWellLocation(
#         origin=WellOrigin.MENISCUS,
#         offset=WellOffset.model_construct(
#             x=0.0,
#             y=0.0,
#             z=cast(float, pytest.approx(-2)),
#         ),
#         volumeOffset="operationVolume",
#     )


def test_get_nominal_effective_tip_length(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: InstrumentInterfaceView,
) -> None:
    """It should get the effective tip length from a labware ID and pipette config."""
    decoy.when(mock_labware_view.get_definition_uri("tip-rack-id")).then_return(
        LabwareUri("opentrons/opentrons_96_tiprack_300ul/1")
    )

    decoy.when(
        mock_pipette_view.get_nominal_tip_overlap(
            pipette_id="pipette-id",
            labware_uri=LabwareUri("opentrons/opentrons_96_tiprack_300ul/1"),
        )
    ).then_return(10)

    decoy.when(
        mock_labware_view.get_tip_length(labware_id="tip-rack-id", overlap=10)
    ).then_return(100)

    result = subject.get_nominal_effective_tip_length(
        labware_id="tip-rack-id",
        pipette_id="pipette-id",
    )

    assert result == 100


def test_get_nominal_tip_geometry(
    decoy: Decoy,
    tip_rack_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: InstrumentInterfaceView,
) -> None:
    """It should get a "well's" tip geometry."""
    well_def = tip_rack_def.wells["B2"]

    decoy.when(mock_labware_view.get_definition_uri("tip-rack-id")).then_return(
        LabwareUri("opentrons/opentrons_96_tiprack_300ul/1")
    )

    decoy.when(mock_labware_view.get_well_definition("tip-rack-id", "B2")).then_return(
        well_def
    )

    decoy.when(
        mock_pipette_view.get_nominal_tip_overlap(
            pipette_id="pipette-id",
            labware_uri="opentrons/opentrons_96_tiprack_300ul/1",
        )
    ).then_return(10)

    decoy.when(
        mock_labware_view.get_tip_length(labware_id="tip-rack-id", overlap=10)
    ).then_return(100)

    result = subject.get_nominal_tip_geometry(
        pipette_id="pipette-id",
        labware_id="tip-rack-id",
        well_name="B2",
    )

    assert result.length == 100
    assert well_def.shape == "circular"  # For type checking, required for `.diameter`.
    assert result.diameter == well_def.diameter
    assert result.volume == well_def.totalLiquidVolume


def test_get_nominal_tip_geometry_raises(
    decoy: Decoy,
    tip_rack_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    subject: InstrumentInterfaceView,
) -> None:
    """It should raise LabwareIsNotTipRackError if well is not circular."""
    well_def = tip_rack_def.wells["B2"]
    well_def.shape = "rectangular"

    decoy.when(mock_labware_view.get_well_definition("tip-rack-id", "B2")).then_return(
        well_def
    )

    with pytest.raises(errors.LabwareIsNotTipRackError):
        subject.get_nominal_tip_geometry(
            labware_id="tip-rack-id", well_name="B2", pipette_id="pipette-id"
        )


def test_get_tip_drop_location(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: InstrumentInterfaceView,
    tip_rack_def: LabwareDefinition,
) -> None:
    """It should get relative drop tip location for a pipette/labware combo."""
    decoy.when(mock_labware_view.get_definition("tip-rack-id")).then_return(
        tip_rack_def
    )

    decoy.when(mock_pipette_view.get_return_tip_scale("pipette-id")).then_return(0.5)

    decoy.when(
        mock_labware_view.get_tip_drop_z_offset(
            labware_id="tip-rack-id", length_scale=0.5, additional_offset=3
        )
    ).then_return(1337)

    location = subject.get_checked_tip_drop_location(
        pipette_id="pipette-id",
        labware_id="tip-rack-id",
        well_location=DropTipWellLocation(
            origin=DropTipWellOrigin.DEFAULT,
            offset=WellOffset(x=1, y=2, z=3),
        ),
    )

    assert location == WellLocation(offset=WellOffset(x=1, y=2, z=1337))


def test_get_tip_drop_location_with_non_tiprack(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    subject: InstrumentInterfaceView,
    reservoir_def: LabwareDefinition,
) -> None:
    """It should get relative drop tip location for a labware that is not a tiprack."""
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        reservoir_def
    )

    location = subject.get_checked_tip_drop_location(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_location=DropTipWellLocation(
            origin=DropTipWellOrigin.DEFAULT,
            offset=WellOffset(x=1, y=2, z=3),
        ),
    )

    assert location == WellLocation(
        origin=WellOrigin.TOP,
        offset=WellOffset(x=1, y=2, z=3),
    )


def test_get_tip_drop_explicit_location(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    subject: InstrumentInterfaceView,
    tip_rack_def: LabwareDefinition,
) -> None:
    """It should pass the location through if origin is not WellOrigin.DROP_TIP."""
    decoy.when(mock_labware_view.get_definition("tip-rack-id")).then_return(
        tip_rack_def
    )

    input_location = DropTipWellLocation(
        origin=DropTipWellOrigin.TOP,
        offset=WellOffset(x=1, y=2, z=3),
    )

    result = subject.get_checked_tip_drop_location(
        pipette_id="pipette-id", labware_id="tip-rack-id", well_location=input_location
    )

    assert result == WellLocation(
        origin=WellOrigin.TOP,
        offset=WellOffset(x=1, y=2, z=3),
    )


def test_get_tip_drop_location_raises_for_partial_with_tip_rack(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: InstrumentInterfaceView,
    tip_rack_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
) -> None:
    """It should raise if version gate is False and the labware is tip rack, and not raise otherwise."""
    decoy.when(mock_labware_view.get_definition("tip-rack-id")).then_return(
        tip_rack_def
    )

    with pytest.raises(errors.UnexpectedProtocolError):
        subject.get_checked_tip_drop_location(
            pipette_id="pipette-id",
            labware_id="tip-rack-id",
            well_location=DropTipWellLocation(
                origin=DropTipWellOrigin.DEFAULT,
                offset=WellOffset(x=1, y=2, z=3),
            ),
            api_version_allows_partial_return_tip=False,
        )

    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        reservoir_def
    )

    location = subject.get_checked_tip_drop_location(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_location=DropTipWellLocation(
            origin=DropTipWellOrigin.DEFAULT,
            offset=WellOffset(x=1, y=2, z=3),
        ),
        api_version_allows_partial_return_tip=False,
    )

    assert location == WellLocation(
        origin=WellOrigin.TOP,
        offset=WellOffset(x=1, y=2, z=3),
    )


class DropTipLocationFinderSpec(NamedTuple):
    """Test data for get_next_tip_drop_location."""

    labware_slot: DeckSlotName
    well_size: float
    pipette_channels: int
    pipette_mount: MountType
    expected_locations: List[DropTipWellLocation]


# TODO (spp, 2023-06-22): need to test more trash-pipette-mount combinations
@pytest.mark.parametrize(
    argnames=DropTipLocationFinderSpec._fields,
    argvalues=[
        DropTipLocationFinderSpec(
            labware_slot=DeckSlotName.FIXED_TRASH,
            well_size=225,
            pipette_channels=1,
            pipette_mount=MountType.LEFT,
            expected_locations=[
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=-22, y=0, z=0)
                ),
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=-75, y=0, z=0)
                ),
            ],
        ),
        DropTipLocationFinderSpec(
            labware_slot=DeckSlotName.SLOT_3,
            well_size=225,
            pipette_channels=8,
            pipette_mount=MountType.RIGHT,
            expected_locations=[
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=75, y=0, z=0)
                ),
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=-75, y=0, z=0)
                ),
            ],
        ),
        DropTipLocationFinderSpec(
            labware_slot=DeckSlotName.SLOT_B3,
            well_size=225,
            pipette_channels=96,
            pipette_mount=MountType.LEFT,
            expected_locations=[
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=32, y=0, z=0)
                ),
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=-32, y=0, z=0)
                ),
            ],
        ),
    ],
)
def test_get_next_drop_tip_location(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    mock_geometry_view: GeometryView,
    subject: InstrumentInterfaceView,
    labware_slot: DeckSlotName,
    well_size: float,
    pipette_channels: int,
    pipette_mount: MountType,
    expected_locations: List[DropTipWellLocation],
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
    available_sensors: pipette_definition.AvailableSensorDefinition,
) -> None:
    """It should provide the next location to drop tips into within a labware."""
    decoy.when(mock_labware_view.is_fixed_trash(labware_id="abc")).then_return(True)
    decoy.when(
        mock_labware_view.get_well_size(labware_id="abc", well_name="A1")
    ).then_return((well_size, 0, 0))
    if pipette_channels == 96:
        pip_type = PipetteNameType.P1000_96
    elif pipette_channels == 8:
        pip_type = PipetteNameType.P300_MULTI
    else:
        pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_config("pip-123")).then_return(
        StaticPipetteConfig(
            min_volume=1,
            max_volume=9001,
            channels=pipette_channels,
            model="blah",
            display_name="bleh",
            serial_number="",
            tip_configuration_lookup_table={9001: supported_tip_fixture},
            nominal_tip_overlap={},
            home_position=0,
            nozzle_offset_z=0,
            bounding_nozzle_offsets=BoundingNozzlesOffsets(
                back_left_offset=Point(x=10, y=20, z=30),
                front_right_offset=Point(x=40, y=50, z=60),
            ),
            default_nozzle_map=get_default_nozzle_map(pip_type),
            pipette_bounding_box_offsets=PipetteBoundingBoxOffsets(
                back_left_corner=Point(x=10, y=20, z=30),
                front_right_corner=Point(x=40, y=50, z=60),
                front_left_corner=Point(x=10, y=50, z=60),
                back_right_corner=Point(x=40, y=20, z=60),
            ),
            lld_settings={},
            plunger_positions={
                "top": 0.0,
                "bottom": 5.0,
                "blow_out": 19.0,
                "drop_tip": 20.0,
            },
            shaft_ul_per_mm=5.0,
            available_sensors=available_sensors,
            volume_mode=VolumeModes.default,
            available_volume_modes_min_and_max_vol={},
        )
    )
    decoy.when(mock_pipette_view.get_mount("pip-123")).then_return(pipette_mount)
    decoy.when(mock_geometry_view.get_ancestor_slot_name("abc")).then_return(
        labware_slot
    )
    decoy.when(mock_geometry_view.get_slot_column(labware_slot)).then_return(3)
    drop_location: List[DropTipWellLocation] = []
    for i in range(4):
        drop_location.append(
            subject.get_next_tip_drop_location(
                labware_id="abc", well_name="A1", pipette_id="pip-123"
            )
        )

    assert drop_location[0] == drop_location[2] == expected_locations[0]
    assert drop_location[1] == drop_location[3] == expected_locations[1]


def test_get_next_drop_tip_location_in_non_trash_labware(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: InstrumentInterfaceView,
) -> None:
    """It should provide the default drop tip location when dropping into a non-fixed-trash labware."""
    decoy.when(mock_labware_view.is_fixed_trash(labware_id="abc")).then_return(False)
    assert subject.get_next_tip_drop_location(
        labware_id="abc", well_name="A1", pipette_id="pip-123"
    ) == DropTipWellLocation(
        origin=DropTipWellOrigin.DEFAULT,
        offset=WellOffset(x=0, y=0, z=0),
    )


def test_check_gripper_labware_tip_collision(
    decoy: Decoy,
    mock_pipette_view: PipetteView,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    mock_geometry_view: GeometryView,
    subject: InstrumentInterfaceView,
) -> None:
    """It should raise a labware movement error if attached tips will collide with the labware during a gripper lift."""
    pipettes = [
        LoadedPipette(
            id="pipette-id",
            mount=MountType.LEFT,
            pipetteName=PipetteNameType.P1000_96,
        )
    ]
    decoy.when(mock_pipette_view.get_all()).then_return(pipettes)
    decoy.when(mock_pipette_view.get_attached_tip("pipette-id")).then_return(
        TipGeometry(
            length=1000,
            diameter=1000,
            volume=1000,
        )
    )

    definition = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        namespace="hello",
        dimensions=LabwareDimensions.model_construct(
            yDimension=1, zDimension=2, xDimension=3
        ),
        version=1,
        parameters=LabwareDefinition2Parameters.model_construct(
            format="96Standard",
            loadName="labware-id",
            isTiprack=True,
            isMagneticModuleCompatible=False,
        ),
        cornerOffsetFromSlot=LabwareDefinitionVector3D.model_construct(x=1, y=2, z=3),
        ordering=[],
    )

    labware_data = LoadedLabware(
        id="labware-id",
        loadName="b",
        definitionUri=uri_from_details(
            namespace="hello", load_name="labware-id", version=1
        ),
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId=None,
    )

    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(definition)
    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)

    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_1.id)
    ).then_return(Point(1, 2, 3))

    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_geometry_view.get_labware_origin_position("labware-id")
    ).then_return(Point(1, 2, 3))
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(definition)

    decoy.when(mock_labware_view.get_extents_around_lw_origin(definition)).then_return(
        EngineAABB(min_x=0, max_x=0, min_y=0, max_y=0, min_z=100, max_z=167)
    )
    decoy.when(mock_labware_view.get_grip_z(definition)).then_return(1.0)

    with pytest.raises(errors.LabwareMovementNotAllowedError):
        subject.check_gripper_labware_tip_collision(
            gripper_homed_position_z=166.125,
            labware_id="labware-id",
            current_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        )
