"""Test state getters for retrieving geometry views of state."""

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
from opentrons.protocol_engine.state.labware import (
    LabwareStore,
    LabwareView,
)
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

_MOCK_LABWARE_DEFINITION3 = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=200, y=-50, z=30),
        ),
    ),
)

_MOCK_LABWARE_DEFINITION2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    dimensions=LabwareDimensions(xDimension=1000, yDimension=1200, zDimension=750),
    parameters=LabwareDefinition2Parameters.model_construct(loadName="labware-name"),  # type: ignore[call-arg]
)


MOCK_ADDRESSABLE_AREA = AddressableArea(
    area_name="1",
    area_type=AreaType.SLOT,
    base_slot=DeckSlotName.SLOT_1,
    display_name="Slot 1",
    bounding_box=Dimensions(x=128, y=86, z=0),
    position=AddressableOffsetVector(x=0, y=0, z=0),
    compatible_module_types=[],
    features=LocatingFeatures(),
    mating_surface_unit_vector=[-1, 1, -1],
    orientation=ModuleOrientation.NOT_APPLICABLE,
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
def mock_well_view(decoy: Decoy) -> WellView:
    """Get a mock in the shape of a WellView."""
    return decoy.mock(cls=WellView)


@pytest.fixture
def mock_module_view(decoy: Decoy) -> ModuleView:
    """Get a mock in the shape of a ModuleView."""
    return decoy.mock(cls=ModuleView)


@pytest.fixture
def mock_pipette_view(decoy: Decoy) -> PipetteView:
    """Get a mock in the shape of a PipetteView."""
    return decoy.mock(cls=PipetteView)


@pytest.fixture
def mock_addressable_area_view(decoy: Decoy) -> AddressableAreaView:
    """Get a mock in the shape of a AddressableAreaView."""
    return decoy.mock(cls=AddressableAreaView)


@pytest.fixture(autouse=True)
def auto_setup_addressable_area_mocks(
    decoy: Decoy, mock_addressable_area_view: AddressableAreaView, use_mocks: bool
) -> None:
    """Addressable area mocks for all tests."""
    if not use_mocks:
        return

    for slot_id in ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]:
        mock_area = AddressableArea(
            area_name=slot_id,
            area_type=AreaType.SLOT,
            base_slot=DeckSlotName(slot_id),
            display_name=f"Slot {slot_id}",
            bounding_box=Dimensions(x=128, y=86, z=0),
            position=AddressableOffsetVector(x=0, y=0, z=0),
            compatible_module_types=[],
            features=LocatingFeatures(),
            mating_surface_unit_vector=[-1, 1, -1],
            orientation=ModuleOrientation.NOT_APPLICABLE,
        )

        decoy.when(
            mock_addressable_area_view.get_addressable_area(slot_id)
        ).then_return(mock_area)
        decoy.when(
            mock_addressable_area_view._get_addressable_area_from_deck_data(
                slot_id, False
            )
        ).then_return(mock_area)
        decoy.when(
            mock_addressable_area_view.get_addressable_area_position(slot_id)
        ).then_return(Point(1, 2, 3))

    module_areas = [
        "magneticModuleV2Slot3",
        "temperatureModuleV2A3",
        "thermocyclerModuleV2",
        "flexStackerModuleV1A4",
        "flexStackerModuleV1D4",
    ]

    for area_name in module_areas:
        mock_module_area = AddressableArea(
            area_name=area_name,
            area_type=AreaType.SLOT,
            base_slot=DeckSlotName.SLOT_3,
            display_name=f"Module Area {area_name}",
            bounding_box=Dimensions(x=128, y=86, z=0),
            position=AddressableOffsetVector(x=0, y=0, z=0),
            compatible_module_types=[],
            features=LocatingFeatures(),
            mating_surface_unit_vector=[-1, 1, -1],
            orientation=ModuleOrientation.NOT_APPLICABLE,
        )

        decoy.when(
            mock_addressable_area_view.get_addressable_area(area_name)
        ).then_return(mock_module_area)
        decoy.when(
            mock_addressable_area_view._get_addressable_area_from_deck_data(
                area_name, False
            )
        ).then_return(mock_module_area)
        decoy.when(
            mock_addressable_area_view.get_addressable_area_position(area_name)
        ).then_return(Point(1, 2, 3))

    decoy.when(mock_addressable_area_view.deck_definition).then_return(
        sentinel.deck_definition
    )


@pytest.fixture(autouse=True)
def patch_mock__move_types(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out _move_types.py functions."""
    for name, func in inspect.getmembers(_move_types, inspect.isfunction):
        monkeypatch.setattr(_move_types, name, decoy.mock(func=func))


@pytest.fixture
def use_mocks() -> bool:
    """True to use mocks; add a use_mocks parameter of False to your test to use real states."""
    return True


@pytest.fixture
def deck_definition(state_config: Config) -> DeckDefinitionV5:
    """Override as parameter to use a non-flex deck def."""
    return load_deck(name=state_config.deck_type.value, version=5)


@pytest.fixture
def state_config() -> Config:
    """Get a state config. This is set up for a Flex."""
    return Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )


@pytest.fixture
def labware_store(deck_definition: DeckDefinitionV5) -> LabwareStore:
    """Get a labware store that can accept actions."""
    return LabwareStore(deck_definition=deck_definition, deck_fixed_labware=[])


@pytest.fixture
def labware_view(labware_store: LabwareStore) -> LabwareView:
    """Get a labware view of a real labware store."""
    return LabwareView(labware_store._state)


@pytest.fixture
def well_store() -> WellStore:
    """Get a well store that can accept actions."""
    return WellStore()


@pytest.fixture
def well_view(well_store: WellStore) -> WellView:
    """Get a well view of a real well store."""
    return WellView(well_store._state)


@pytest.fixture
def module_store(state_config: Config) -> ModuleStore:
    """Get a module store that can accept actions."""
    return ModuleStore(
        config=state_config, deck_fixed_labware=[], module_calibration_offsets={}
    )


@pytest.fixture
def module_view(module_store: ModuleStore, state_config: Config) -> ModuleView:
    """Get a module view of a real labware store."""
    return ModuleView(state=module_store._state)


@pytest.fixture
def pipette_store() -> PipetteStore:
    """Get a pipette store that can accept actions."""
    return PipetteStore()


@pytest.fixture
def pipette_view(pipette_store: PipetteStore) -> PipetteView:
    """Get a pipette view of a real pipette store."""
    return PipetteView(pipette_store._state)


@pytest.fixture
def addressable_area_store(
    state_config: Config, deck_definition: DeckDefinitionV5
) -> AddressableAreaStore:
    """Get an addressable area store that can accept actions."""
    return AddressableAreaStore(
        deck_configuration=[],
        config=state_config,
        deck_definition=deck_definition,
        robot_definition={
            "displayName": "OT-3",
            "robotType": "OT-3 Standard",
            "models": ["OT-3 Standard"],
            "extents": [477.2, 493.8, 0.0],
            "paddingOffsets": {
                "rear": -177.42,
                "front": 51.8,
                "leftSide": 31.88,
                "rightSide": -80.32,
            },
            "mountOffsets": {
                "left": [-13.5, -60.5, 255.675],
                "right": [40.5, -60.5, 255.675],
                "gripper": [84.55, -12.75, 93.85],
            },
        },
    )


@pytest.fixture
def addressable_area_view(
    addressable_area_store: AddressableAreaStore,
) -> AddressableAreaView:
    """Get an addressable area view of a real addressable are store."""
    return AddressableAreaView(addressable_area_store._state)


@pytest.fixture
def nice_labware_definition() -> LabwareDefinition:
    """Load a nice labware def that won't blow up your terminal."""
    return labware_definition_type_adapter.validate_python(
        json.loads(
            load_shared_data("labware/fixtures/2/fixture_12_trough_v2.json").decode(
                "utf-8"
            )
        )
    )


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
def nice_adapter_definition() -> LabwareDefinition:
    """Load a friendly adapter definition."""
    return labware_definition_type_adapter.validate_python(
        json.loads(
            load_shared_data(
                "labware/definitions/2/opentrons_aluminum_flat_bottom_plate/1.json"
            ).decode("utf-8")
        )
    )


@pytest.fixture
def mock_well_math_utils(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> Dict[str, Any]:
    """Patch inner_well_math_utils functions."""
    mocks = {}
    mocks["volume_user_volumes"] = decoy.mock(func=find_volume_user_defined_volumes)
    mocks["height_user_volumes"] = decoy.mock(func=find_height_user_defined_volumes)  # type: ignore[assignment]
    mocks["volume_inner_well_geometry"] = decoy.mock(  # type: ignore[assignment]
        func=find_volume_inner_well_geometry
    )
    mocks["height_inner_well_geometry"] = decoy.mock(  # type: ignore[assignment]
        func=find_height_inner_well_geometry
    )
    monkeypatch.setattr(
        geometry, "find_volume_user_defined_volumes", mocks["volume_user_volumes"]
    )
    monkeypatch.setattr(
        geometry, "find_height_user_defined_volumes", mocks["height_user_volumes"]
    )
    monkeypatch.setattr(
        geometry, "find_volume_inner_well_geometry", mocks["volume_inner_well_geometry"]
    )
    monkeypatch.setattr(
        geometry, "find_height_inner_well_geometry", mocks["height_inner_well_geometry"]
    )
    return mocks


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
    mock_well_view: WellView,
    mock_module_view: ModuleView,
    mock_pipette_view: PipetteView,
    mock_addressable_area_view: AddressableAreaView,
    state_config: Config,
    labware_view: LabwareView,
    well_view: WellView,
    module_view: ModuleView,
    pipette_view: PipetteView,
    addressable_area_view: AddressableAreaView,
    use_mocks: bool,
) -> GeometryView:
    """Get a GeometryView with its store dependencies provided.

    By default, this will return a view with those dependencies as mocked. If you add a
    parameter to your test of use_mocks that returns false, i.e.

    @pytest.mark.parametrize('use_mocks', [False])
    def my_cool_test(subject: GeometryView) -> None:
        pass

    then the provided subject will use actual states. Over time, we should get more and more
    things using use_mocks=True, and then flip the default
    """
    return GeometryView(
        config=state_config,
        labware_view=mock_labware_view if use_mocks else labware_view,
        well_view=mock_well_view if use_mocks else well_view,
        module_view=mock_module_view if use_mocks else module_view,
        pipette_view=mock_pipette_view if use_mocks else pipette_view,
        addressable_area_view=(
            mock_addressable_area_view if use_mocks else addressable_area_view
        ),
    )


def _dummy_command() -> Command:
    """Return a placeholder command."""
    return create_comment_command()


def load_module_action(
    module_id: str,
    module_def: ModuleDefinition,
    location: DeckSlotLocation,
    used_addressable_area: str | None = None,
) -> SucceedCommandAction:
    """Create a SucceedCommandAction for loading a module."""
    state_update = StateUpdate()
    if used_addressable_area is not None:
        state_update.addressable_area_used = AddressableAreaUsedUpdate(
            addressable_area_name=used_addressable_area
        )

    state_update.set_load_module(
        module_id=module_id,
        definition=module_def,
        requested_model=module_def.model,
        serial_number="fake-serial",
        slot_name=location.slotName,
    )

    return SucceedCommandAction(
        command=_dummy_command(),
        state_update=state_update,
    )


def load_labware_action(
    labware_id: str,
    labware_def: LabwareDefinition,
    location: LabwareLocation,
) -> SucceedCommandAction:
    """Create a SucceedCommandAction for loading a labware."""
    state_update = StateUpdate(
        loaded_labware=LoadedLabwareUpdate(
            labware_id=labware_id,
            definition=labware_def,
            offset_id=None,
            new_location=location,
            display_name=None,
        )
    )

    if isinstance(location, DeckSlotLocation):
        state_update.addressable_area_used = AddressableAreaUsedUpdate(
            addressable_area_name=location.slotName.id
        )
    elif isinstance(location, AddressableAreaLocation):
        state_update.addressable_area_used = AddressableAreaUsedUpdate(
            addressable_area_name=location.addressableAreaName
        )

    return SucceedCommandAction(
        command=_dummy_command(),
        state_update=state_update,
    )


def load_adapter_action(
    adapter_id: str, adapter_def: LabwareDefinition, location: LabwareLocation
) -> SucceedCommandAction:
    """Create a SucceedCommandAction for loading an adapter."""
    return SucceedCommandAction(
        command=_dummy_command(),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id=adapter_id,
                definition=adapter_def,
                offset_id=None,
                new_location=location,
                display_name=None,
            )
        ),
    )


def test_module_calibration_offset_rotation(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    ot2_standard_deck_def: DeckDefinitionV5,
    subject: GeometryView,
) -> None:
    """Return the rotated module calibration offset if the module was moved from one side of the deck to the other."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="b",
        definitionUri=uri_from_details(namespace="a", load_name="b", version=1),
        location=ModuleLocation(moduleId="module-id"),
        offsetId=None,
    )

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_D1)
    )
    decoy.when(mock_module_view.get_connected_model("module-id")).then_return(
        ModuleModel.TEMPERATURE_MODULE_V2
    )
    decoy.when(mock_module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetData(
            moduleOffsetVector=ModuleOffsetVector(x=2, y=3, z=4),
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D1),
        )
    )

    # the module has not changed location after calibration, so there is no rotation
    result = subject._get_calibrated_module_offset(ModuleLocation(moduleId="module-id"))
    assert result == Point(x=2, y=3, z=4)

    # the module has changed from slot D1 to D3, so we should rotate the calibration offset 180 degrees along the z axis
    decoy.when(mock_module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_D3)
    )
    result = subject._get_calibrated_module_offset(ModuleLocation(moduleId="module-id"))
    assert result == Point(x=-2, y=-3, z=4)

    # attempting to load the module calibration offset from an invalid slot in the middle of the deck (A2, B2, C2, D2)
    # is not be allowed since you can't even load a module in the middle to perform a module calibration in the
    # first place. So if someone manually edits the stored module calibration offset we will throw an assert error.
    decoy.when(mock_module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetData(
            moduleOffsetVector=ModuleOffsetVector(x=2, y=3, z=4),
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D2),
        )
    )
    with pytest.raises(AssertionError):
        result = subject._get_calibrated_module_offset(
            ModuleLocation(moduleId="module-id")
        )


def test_get_labware_origin_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should return the labware origin position."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId=None,
    )

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_3.id)
    ).then_return(Point(1, 2, 3))

    result = subject.get_labware_origin_position("labware-id")

    assert result == Point(
        1 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        2 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        3 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )


def test_get_labware_origin_position_with_lw_definition3(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should return a deck slot position with the labware's offset as its origin when the labware is of type LabwareDefinition3."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId=None,
    )

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        _MOCK_LABWARE_DEFINITION3
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_3.id)
    ).then_return(Point(1, 2, 3))

    result = subject.get_labware_origin_position("labware-id")

    assert result == Point(
        1 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        2 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        3 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )


def test_get_labware_highest_z(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should get the absolute location of a labware's highest Z point."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId="offset-id",
    )
    slot_pos = Point(1, 2, 3)
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_dimensions(labware_id="labware-id")).then_return(
        Dimensions(x=999, y=999, z=100)
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_3.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        _MOCK_LABWARE_DEFINITION3
    )

    highest_z = subject.get_labware_highest_z("labware-id")

    assert highest_z == (100 + 3 + 3 + 30)


def test_get_module_labware_highest_z(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    mock_addressable_area_view: AddressableAreaView,
    ot2_standard_deck_def: DeckDefinitionV5,
    subject: GeometryView,
) -> None:
    """It should get the absolute location of a labware's highest Z point."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=ModuleLocation(moduleId="module-id"),
        offsetId="offset-id",
    )
    slot_pos = Point(1, 2, 3)
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        _MOCK_LABWARE_DEFINITION3
    )
    decoy.when(mock_labware_view.get_dimensions(labware_id="labware-id")).then_return(
        Dimensions(x=999, y=999, z=100)
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(
            "magneticModuleV2Slot3"
        )
    ).then_return(slot_pos)
    decoy.when(mock_module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    )
    decoy.when(mock_module_view.get_definition("module-id")).then_return(
        sentinel.module_definition
    )
    decoy.when(mock_labware_view.get_deck_definition()).then_return(
        ot2_standard_deck_def
    )
    decoy.when(mock_module_view.get_height_over_labware("module-id")).then_return(0.5)
    decoy.when(mock_module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetData(
            moduleOffsetVector=ModuleOffsetVector(x=0, y=0, z=0),
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        )
    )
    decoy.when(
        mock_module_view.get_nominal_offset_to_child_from_addressable_area(
            module_id="module-id"
        )
    ).then_return(Point(x=0, y=0, z=0))
    decoy.when(mock_module_view.get_connected_model("module-id")).then_return(
        ModuleModel.MAGNETIC_MODULE_V2
    )
    decoy.when(mock_module_view.get_provided_addressable_area("module-id")).then_return(
        "magneticModuleV2Slot3"
    )

    highest_z = subject.get_labware_highest_z("labware-id")

    assert highest_z == (100 + 3 + 3 + 0.5 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z)


def test_get_all_obstacle_highest_z_no_equipment(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should return 0 if no loaded equipment."""
    decoy.when(mock_module_view.get_all()).then_return([])
    decoy.when(mock_labware_view.get_all()).then_return([])
    decoy.when(mock_addressable_area_view.get_all()).then_return([])

    result = subject.get_all_obstacle_highest_z()

    assert result == 0


@pytest.mark.parametrize("use_mocks", [False])
def test_get_obstacle_highest_z_with_labware(
    labware_store: LabwareStore,
    addressable_area_store: AddressableAreaStore,
    module_store: ModuleStore,
    addressable_area_view: AddressableAreaView,
    nice_labware_definition: LabwareDefinition,
    subject: GeometryView,
    flex_stacker_v1_def: ModuleDefinition,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """It should get the highest Z of the on-deck labware."""
    # load a flex stacker module
    load_module = load_module_action(
        module_id="module-id",
        module_def=flex_stacker_v1_def,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D3),
        used_addressable_area="flexStackerModuleV1D4",
    )
    # in hopper labware is considered off-deck
    hopper_lw_definition = nice_labware_definition.model_copy(
        update={
            "version": "hopper-lw",  # this is to make sure definitionURI is unique
            "dimensions": LabwareDimensions(
                xDimension=0, yDimension=0, zDimension=20000
            ),
        }
    )
    load_hopper_labware = load_labware_action(
        labware_id="hopper-lw-id",
        labware_def=hopper_lw_definition,
        location=InStackerHopperLocation(moduleId="module-id"),
    )

    # shuttle labware is considered on-deck
    shuttle_lw_definition = nice_labware_definition.model_copy(
        update={
            "version": "hopper-lw",  # this is to make sure definitionURI is unique
            "dimensions": LabwareDimensions(xDimension=0, yDimension=0, zDimension=300),
        }
    )
    load_shuttle_labware = load_labware_action(
        labware_id="module-lw-id",
        labware_def=shuttle_lw_definition,
        location=ModuleLocation(moduleId="module-id"),
    )

    # load a offdeck labware
    offdeck_lw_definition = nice_labware_definition.model_copy(
        update={
            "version": "offdeck-lw",  # this is to make sure definitionURI is unique
            "dimensions": LabwareDimensions(
                xDimension=0, yDimension=0, zDimension=10000
            ),
        }
    )
    load_offdeck_labware = load_labware_action(
        labware_id="offdeck-lw-id",
        labware_def=offdeck_lw_definition,
        location=OFF_DECK_LOCATION,
    )

    module_store.handle_action(load_module)
    addressable_area_store.handle_action(load_module)
    labware_store.handle_action(load_hopper_labware)
    labware_store.handle_action(load_shuttle_labware)
    labware_store.handle_action(load_offdeck_labware)

    # the tallest labware is the one on the stacker shuttle
    # the labware's highest z is the z dimension + height of the shuttle
    shuttle_height = addressable_area_view.get_addressable_area_position(
        "flexStackerModuleV1D4"
    ).z

    expected_height = 300 + shuttle_height + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z

    assert subject.get_all_obstacle_highest_z() == expected_height


@pytest.mark.parametrize("use_mocks", [False])
def test_get_obstacle_highest_z_with_lid(
    labware_store: LabwareStore,
    addressable_area_store: AddressableAreaStore,
    labware_view: LabwareView,
    subject: GeometryView,
    nice_labware_definition: LabwareDefinition,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """It should get the highest Z including labware lids."""
    load_labware = load_labware_action(
        labware_id="labware-id",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
        labware_def=nice_labware_definition,
    )

    lid_def = nice_labware_definition.model_copy(
        update={
            "version": "lid-lw",  # this is to make sure definitionURI is unique
            "dimensions": LabwareDimensions(xDimension=0, yDimension=0, zDimension=100),
        }
    )

    load_labware_lid = load_labware_action(
        labware_id="lid-id",
        labware_def=lid_def,
        location=OnLabwareLocation(labwareId="labware-id"),
    )

    lid_stack_def = nice_labware_definition.model_copy(
        update={
            "version": "lid-stack",
            "parameters": LabwareDefinition2Parameters.model_construct(
                format="96Standard",
                loadName="protocol_engine_lid_stack_object",
                isTiprack=False,
                isMagneticModuleCompatible=False,
            ),
            "dimensions": LabwareDimensions(xDimension=0, yDimension=0, zDimension=50),
        }
    )

    load_lid_stack = load_labware_action(
        labware_id="lid-stack-id",
        labware_def=lid_stack_def,
        location=SYSTEM_LOCATION,
    )

    labware_store.handle_action(load_labware)
    labware_store.handle_action(load_lid_stack)
    labware_store.handle_action(load_labware_lid)
    addressable_area_store.handle_action(load_labware)

    # The highest Z should be the max of the highest Z of the on-deck labware
    # The labware's highest z is the z dimension of the lid + labware's height
    labware_height = labware_view.get_dimensions(labware_id="labware-id").z
    monkeypatch.setattr(
        "opentrons.protocol_engine.state.geometry.get_stackup_origin_to_labware_origin",
        lambda *args, **kwargs: Point(10, 20, labware_height),
    )

    assert subject.get_all_obstacle_highest_z() == 100 + labware_height


@pytest.mark.parametrize("use_mocks", [False])
def test_get_all_obstacle_highest_z_with_staging_area(
    labware_store: LabwareStore,
    addressable_area_view: AddressableAreaView,
    addressable_area_store: AddressableAreaStore,
    labware_view: LabwareView,
    subject: GeometryView,
    nice_labware_definition: LabwareDefinition,
) -> None:
    """It should get the highest Z amongst all labware including staging area."""
    load_deck_labware = load_labware_action(
        "deck-lw-id",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
        labware_def=nice_labware_definition,
    )

    load_staging_labware = load_labware_action(
        "staging-lw-id",
        location=AddressableAreaLocation(addressableAreaName="D4"),
        labware_def=nice_labware_definition,
    )
    labware_store.handle_action(load_deck_labware)
    labware_store.handle_action(load_staging_labware)
    addressable_area_store.handle_action(load_deck_labware)
    addressable_area_store.handle_action(load_staging_labware)

    # the tallest labware is the one in the staging area
    # the labware's highest z is the z dimension + staging slot height
    labware_height = labware_view.get_dimensions(labware_id="staging-lw-id").z
    staging_slot_height = addressable_area_view.get_addressable_area_position("D4").z
    assert (
        subject.get_all_obstacle_highest_z()
        == labware_height + staging_slot_height + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z
    )


@pytest.mark.parametrize("use_mocks", [False])
def test_get_all_obstacle_highest_z_with_modules(
    module_store: ModuleStore,
    addressable_area_store: AddressableAreaStore,
    subject: GeometryView,
    thermocycler_v2_def: ModuleDefinition,
    flex_stacker_v1_def: ModuleDefinition,
) -> None:
    """It should get the module highest Z."""
    load_thermocycler = load_module_action(
        "thermocycler-id",
        thermocycler_v2_def,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
    )

    load_stacker = load_module_action(
        "stacker-id",
        flex_stacker_v1_def,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D3),
        used_addressable_area="flexStackerModuleV1D4",
    )
    module_store.handle_action(load_thermocycler)
    module_store.handle_action(load_stacker)
    addressable_area_store.handle_action(load_thermocycler)
    addressable_area_store.handle_action(load_stacker)

    # the tallest module is the flex stacker
    # Note: since no labware are loaded on the modules, the thermocycler
    # lid is considered open, so the thermocycler lid height is not included
    # in the thermocycler height
    assert isclose(subject.get_all_obstacle_highest_z(), 35.0)


@pytest.mark.parametrize("use_mocks", [False])
def test_get_all_obstacle_highest_z_with_fixtures(
    addressable_area_store: AddressableAreaStore,
    subject: GeometryView,
) -> None:
    """It should get the highest Z including fixtures."""
    addressable_area_store.handle_action(
        SetDeckConfigurationAction(
            deck_configuration=[
                ("cutoutA3", "trashBinAdapter", None),
                ("cutoutB3", "singleRightSlot", None),
            ],
        )
    )
    # the highest Z should be the height of the trash bin adapter
    assert subject.get_all_obstacle_highest_z() == 40.0


def test_get_highest_z_in_slot_with_single_labware(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should get the highest Z in slot with just a single labware."""
    # Case: Slot has a labware that doesn't have any other labware on it. Highest z is equal to labware height.
    labware_in_slot = LoadedLabware(
        id="just-labware-id",
        loadName="just-labware-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId="offset-id",
    )
    slot_pos = Point(1, 2, 3)
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)

    decoy.when(mock_labware_view.get_by_slot(DeckSlotName.SLOT_3)).then_return(
        labware_in_slot
    )
    decoy.when(mock_labware_view.get_id_by_labware("just-labware-id")).then_raise(
        errors.LabwareNotLoadedOnLabwareError("no more labware")
    )
    decoy.when(mock_labware_view.get("just-labware-id")).then_return(labware_in_slot)
    decoy.when(
        mock_labware_view.get_dimensions(labware_id="just-labware-id")
    ).then_return(Dimensions(x=0, y=0, z=1000))
    decoy.when(
        mock_labware_view.get_labware_offset_vector("just-labware-id")
    ).then_return(calibration_offset)
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_3.id)
    ).then_return(slot_pos)

    expected_highest_z = 1000 + 3 + 3 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z
    assert (
        subject.get_highest_z_in_slot(DeckSlotLocation(slotName=DeckSlotName.SLOT_3))
        == expected_highest_z
    )


def test_get_highest_z_in_slot_with_single_module(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
    ot2_standard_deck_def: DeckDefinitionV5,
) -> None:
    """It should get the highest Z in slot with just a single module."""
    # Case: Slot has a module that doesn't have any labware on it. Highest z is equal to module height.
    module_in_slot = LoadedModule.model_construct(
        id="only-module",
        model=ModuleModel.THERMOCYCLER_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
    )

    decoy.when(mock_module_view.get_by_slot(DeckSlotName.SLOT_3)).then_return(
        module_in_slot
    )
    decoy.when(mock_labware_view.get_id_by_module("only-module")).then_raise(
        errors.LabwareNotLoadedOnModuleError("only module")
    )
    decoy.when(mock_labware_view.get_deck_definition()).then_return(
        ot2_standard_deck_def
    )
    decoy.when(
        mock_module_view.get_module_highest_z(
            module_id="only-module",
            addressable_areas=mock_addressable_area_view,
        )
    ).then_return(12345)
    decoy.when(mock_module_view.is_column_4_module(module_in_slot.model)).then_return(
        False
    )

    assert (
        subject.get_highest_z_in_slot(DeckSlotLocation(slotName=DeckSlotName.SLOT_3))
        == 12345
    )


# TODO (spp, 2023-12-05): this is mocking out too many things and is hard to follow.
#  Create an integration test that loads labware and modules and tests the geometry
#  in an easier-to-understand manner.
def test_get_highest_z_in_slot_with_stacked_labware_on_slot(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should get the highest z in slot of the topmost labware in stack.

    Tests both `get_highest_z_in_slot` and `get_highest_z_of_labware_stack`.
    """
    labware_in_slot = LoadedLabware(
        id="bottom-labware-id",
        loadName="bottom-labware-name",
        definitionUri="bottom-definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId="offset-id",
    )
    middle_labware = LoadedLabware(
        id="middle-labware-id",
        loadName="middle-labware-name",
        definitionUri="middle-definition-uri",
        location=OnLabwareLocation(labwareId="bottom-labware-id"),
        offsetId="offset-id",
    )
    top_labware = LoadedLabware(
        id="top-labware-id",
        loadName="top-labware-name",
        definitionUri="top-definition-uri",
        location=OnLabwareLocation(labwareId="middle-labware-id"),
        offsetId="offset-id",
    )
    top_lw_lpc_offset = LabwareOffsetVector(x=1, y=-2, z=3)

    decoy.when(mock_labware_view.get_by_slot(DeckSlotName.SLOT_3)).then_return(
        labware_in_slot
    )
    decoy.when(mock_labware_view.get_id_by_labware("bottom-labware-id")).then_return(
        "middle-labware-id"
    )
    decoy.when(mock_labware_view.get_id_by_labware("middle-labware-id")).then_return(
        "top-labware-id"
    )
    decoy.when(mock_labware_view.get_id_by_labware("top-labware-id")).then_raise(
        errors.LabwareNotLoadedOnLabwareError("top labware")
    )

    decoy.when(mock_labware_view.get("bottom-labware-id")).then_return(labware_in_slot)
    decoy.when(mock_labware_view.get("middle-labware-id")).then_return(middle_labware)
    decoy.when(mock_labware_view.get("top-labware-id")).then_return(top_labware)

    decoy.when(
        mock_labware_view.get_dimensions(labware_id="top-labware-id")
    ).then_return(Dimensions(x=0, y=0, z=1000))
    decoy.when(
        mock_labware_view.get_labware_offset_vector("top-labware-id")
    ).then_return(top_lw_lpc_offset)
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_3.id)
    ).then_return(Point(11, 22, 33))

    expected_highest_z = 33 + 1000 + 3 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z

    assert (
        subject.get_highest_z_in_slot(DeckSlotLocation(slotName=DeckSlotName.SLOT_3))
        == expected_highest_z
    )


# TODO (spp, 2023-12-05): this is mocking out too many things and is hard to follow.
#  Create an integration test that loads labware and modules and tests the geometry
#  in an easier-to-understand manner.
def test_get_highest_z_in_slot_with_labware_stack_on_module(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    mock_addressable_area_view: AddressableAreaView,
    ot2_standard_deck_def: DeckDefinitionV5,
    subject: GeometryView,
) -> None:
    """It should get the highest z in slot of labware on module.

    Tests both `get_highest_z_in_slot` and `get_highest_z_of_labware_stack`.
    """
    top_labware = LoadedLabware(
        id="top-labware-id",
        loadName="top-labware-name",
        definitionUri="top-labware-uri",
        location=OnLabwareLocation(labwareId="adapter-id"),
        offsetId="offset-id1",
    )
    adapter = LoadedLabware(
        id="adapter-id",
        loadName="adapter-name",
        definitionUri="adapter-uri",
        location=ModuleLocation(moduleId="module-id"),
        offsetId="offset-id2",
    )
    module_on_slot = LoadedModule.model_construct(
        id="module-id",
        model=ModuleModel.THERMOCYCLER_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
    )
    top_lw_lpc_offset = LabwareOffsetVector(x=1, y=-2, z=3)

    decoy.when(mock_module_view.get("module-id")).then_return(module_on_slot)
    decoy.when(mock_module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    )
    decoy.when(mock_module_view.get_by_slot(DeckSlotName.SLOT_3)).then_return(
        module_on_slot
    )
    decoy.when(mock_labware_view.get_id_by_module("module-id")).then_return(
        "adapter-id"
    )
    decoy.when(mock_labware_view.get_id_by_labware("adapter-id")).then_return(
        "top-labware-id"
    )
    decoy.when(mock_labware_view.get_id_by_labware("top-labware-id")).then_raise(
        errors.LabwareNotLoadedOnLabwareError("top labware")
    )
    decoy.when(
        mock_module_view.get_nominal_offset_to_child_from_addressable_area(
            module_id="module-id"
        )
    ).then_return(Point(x=0, y=0, z=0))
    decoy.when(mock_module_view.get_provided_addressable_area("module-id")).then_return(
        "magneticModuleV2Slot3"
    )
    decoy.when(mock_labware_view.get("adapter-id")).then_return(adapter)
    decoy.when(mock_labware_view.get("top-labware-id")).then_return(top_labware)
    decoy.when(mock_labware_view.get_definition("top-labware-id")).then_return(
        _MOCK_LABWARE_DEFINITION3
    )
    decoy.when(mock_labware_view.get_definition("adapter-id")).then_return(
        _MOCK_LABWARE_DEFINITION3
    )
    decoy.when(
        mock_labware_view.get_dimensions(labware_id="top-labware-id")
    ).then_return(Dimensions(x=0, y=0, z=1000))
    decoy.when(
        mock_labware_view.get_labware_offset_vector("top-labware-id")
    ).then_return(top_lw_lpc_offset)
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(
            "magneticModuleV2Slot3"
        )
    ).then_return(Point(11, 22, 33))
    decoy.when(mock_module_view.is_column_4_module(module_on_slot.model)).then_return(
        False
    )

    expected_highest_z = 33 + 1000 + 3 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z

    assert (
        subject.get_highest_z_in_slot(DeckSlotLocation(slotName=DeckSlotName.SLOT_3))
        == expected_highest_z
    )


@pytest.mark.parametrize(
    ["location", "min_z_height", "expected_min_z"],
    [
        (None, None, 0),
        (None, 1337, 1337),
        (CurrentWell("other-pipette-id", "labware-id", "well-name"), None, 0),
        (CurrentWell("pipette-id", "other-labware-id", "well-name"), None, 0),
        (
            CurrentWell("pipette-id", "labware-id", "well-name"),
            None,
            20.22 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
        ),
        (
            CurrentWell("pipette-id", "labware-id", "well-name"),
            1.23,
            20.22 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
        ),
        (CurrentWell("pipette-id", "labware-id", "well-name"), 1337, 1337),
    ],
)
def test_get_min_travel_z(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    mock_addressable_area_view: AddressableAreaView,
    location: Optional[CurrentWell],
    min_z_height: Optional[float],
    expected_min_z: float,
    subject: GeometryView,
) -> None:
    """It should find the minimum travel z."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId="offset-id",
    )

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_dimensions(labware_id="labware-id")).then_return(
        Dimensions(x=0, y=0, z=14.22)
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        LabwareOffsetVector(x=0, y=0, z=3)
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_3.id)
    ).then_return(Point(0, 0, 3))

    decoy.when(mock_module_view.get_all()).then_return([])
    decoy.when(mock_labware_view.get_all()).then_return([])
    decoy.when(mock_addressable_area_view.get_all()).then_return([])

    min_travel_z = subject.get_min_travel_z(
        "pipette-id", "labware-id", location, min_z_height
    )

    assert min_travel_z == expected_min_z


def test_get_labware_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should return the slot position plus calibrated offset."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="reservoir-offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)

    position = subject.get_labware_position(labware_id="labware-id")

    assert (
        well_plate_def.schemaVersion == 2
    )  # For the presence of cornerOffsetFromSlot.
    assert position == Point(
        x=slot_pos[0]
        + well_plate_def.cornerOffsetFromSlot.x
        + 1
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=slot_pos[1]
        + well_plate_def.cornerOffsetFromSlot.y
        - 2
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=slot_pos[2]
        + well_plate_def.cornerOffsetFromSlot.z
        + 3
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )


def test_get_well_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result = subject.get_well_position("labware-id", "B2")

    assert result.elementwise_isclose(
        Point(
            x=slot_pos[0] + 1 + well_def.x + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
            y=slot_pos[1] - 2 + well_def.y + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
            z=slot_pos[2]
            + 3
            + well_def.z
            + well_def.depth
            + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
        )
    )


@pytest.mark.parametrize(
    "probed_height", [-1.0, 0.0, 5.0, 10.0, 1000.0, SimulatedProbeResult()]
)
def test_validate_probed_height(
    decoy: Decoy,
    subject: GeometryView,
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


def test_get_well_height(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the well height."""
    well_def = well_plate_def.wells["B2"]
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    assert subject.get_well_height("labware-id", "B2") == 10.67


def test_get_module_labware_well_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    mock_addressable_area_view: AddressableAreaView,
    ot2_standard_deck_def: DeckDefinitionV5,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well top in a labware on module."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=ModuleLocation(moduleId="module-id"),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(mock_module_view.get_provided_addressable_area("module-id")).then_return(
        "magneticModuleV2Slot3"
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(
            "magneticModuleV2Slot3"
        )
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    decoy.when(mock_module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    )
    decoy.when(
        mock_module_view.get_nominal_offset_to_child_from_addressable_area(
            module_id="module-id"
        )
    ).then_return(Point(x=0, y=0, z=0))
    decoy.when(mock_module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetData(
            moduleOffsetVector=ModuleOffsetVector(x=0, y=0, z=0),
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        )
    )
    decoy.when(mock_module_view.get_connected_model("module-id")).then_return(
        ModuleModel.MAGNETIC_MODULE_V2
    )

    result = subject.get_well_position("labware-id", "B2")
    assert result.elementwise_isclose(
        Point(
            x=slot_pos[0]
            + calibration_offset.x
            + well_def.x
            + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
            y=slot_pos[1]
            + calibration_offset.y
            + well_def.y
            + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
            z=slot_pos[2]
            + calibration_offset.z
            + well_def.z
            + well_def.depth
            + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
        )
    )


def test_get_well_position_with_top_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=WellLocation(
            origin=WellOrigin.TOP,
            offset=WellOffset(x=1, y=2, z=3),
        ),
    )

    assert result.elementwise_isclose(
        Point(
            x=slot_pos[0] + 1 + well_def.x + 1 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
            y=slot_pos[1] - 2 + well_def.y + 2 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
            z=slot_pos[2]
            + 3
            + well_def.z
            + well_def.depth
            + 3
            + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
        )
    )


def test_get_well_position_with_bottom_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well bottom in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=WellLocation(
            origin=WellOrigin.BOTTOM,
            offset=WellOffset(x=3, y=2, z=1),
        ),
    )

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 3 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=slot_pos[1] - 2 + well_def.y + 2 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=slot_pos[2] + 3 + well_def.z + 1 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )


def test_get_well_position_with_center_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """It should be able to get the position of a well center in a labware."""
    monkeypatch.setattr(
        "opentrons.protocol_engine.state.geometry.get_stackup_origin_to_labware_origin",
        lambda *args, **kwargs: Point(0, 0, 0),
    )
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=WellLocation(
            origin=WellOrigin.CENTER,
            offset=WellOffset(x=2, y=3, z=4),
        ),
    )

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 2,
        y=slot_pos[1] - 2 + well_def.y + 3,
        z=slot_pos[2] + 3 + well_def.z + 4 + (well_def.depth / 2.0),
    )


def test_get_well_position_with_meniscus_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_addressable_area_view: AddressableAreaView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well meniscus in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    meniscus_offset = WellOffset(x=2, y=3, z=4)
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    probed_liquid_height = 5.53
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    probe_time = datetime.now()
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
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.5)

    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=WellLocation(
            origin=WellOrigin.MENISCUS,
            offset=meniscus_offset,
        ),
        pipette_id="pipette-id",
    )
    # slot_pos + calibration_offset + well_def + meniscus_offset + meniscus height(for z)
    assert result == Point(
        x=slot_pos[0]
        + calibration_offset.x
        + well_def.x
        + meniscus_offset.x
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=slot_pos[1]
        + calibration_offset.y
        + well_def.y
        + meniscus_offset.y
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=slot_pos[2]
        + calibration_offset.z
        + well_def.z
        + meniscus_offset.z
        + probed_liquid_height
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )


def test_get_well_position_with_volume_offset_raises_error(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_addressable_area_view: AddressableAreaView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """Calling get_well_position with any volume offset should raise an error when there's no innerLabwareGeometry."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
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
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.5)
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_raise(
        errors.IncompleteLabwareDefinitionError("Woops!")
    )

    with pytest.raises(errors.IncompleteLabwareDefinitionError):
        subject.get_well_position(
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
    mock_addressable_area_view: AddressableAreaView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well meniscus in a labware with a volume offset."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]
    meniscus_well_offset = WellOffset(x=2, y=3, z=4)
    probed_height = 5.53

    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    probe_time = datetime.now()
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
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
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.5)

    result = subject.get_well_position(
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
    volume_adjustment = 4.3909
    expected = Point(
        x=slot_pos[0]
        + calibration_offset.x
        + well_def.x
        + meniscus_well_offset.x
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=slot_pos[1]
        + calibration_offset.y
        + well_def.y
        + meniscus_well_offset.y
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=slot_pos[2]
        + calibration_offset.z
        + well_def.z
        + meniscus_well_offset.z
        + volume_adjustment
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )
    assert all([isclose(i[0], i[1], abs_tol=0.0001) for i in zip(result, expected)])


def test_get_well_position_with_meniscus_and_float_volume_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_addressable_area_view: AddressableAreaView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well meniscus in a labware with a volume offset."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    probed_height = 5.35
    meniscus_well_offset = WellOffset(x=2, y=3, z=4)
    well_def = well_plate_def.wells["B2"]
    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    well_def = well_def.model_copy(update={"depth": 45.0})
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    probe_time = datetime.now()
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
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.5)
    operation_volume = -124.58
    well_loc = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS,
        offset=meniscus_well_offset,
        volumeOffset=operation_volume,
    )
    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=well_loc,
        pipette_id="pipette-id",
    )
    expected_vol_offset = subject.get_well_offset_adjustment(
        labware_id="labware-id",
        well_name="B2",
        well_location=well_loc,
        well_depth=well_def.depth,
        pipette_id="pipette-id",
        operation_volume=operation_volume,
    )
    assert isinstance(expected_vol_offset, float)
    expected = Point(
        x=slot_pos[0]
        + calibration_offset.x
        + well_def.x
        + meniscus_well_offset.x
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=slot_pos[1]
        + calibration_offset.y
        + well_def.y
        + meniscus_well_offset.y
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=slot_pos[2]
        + calibration_offset.z
        + well_def.z
        + meniscus_well_offset.z
        + expected_vol_offset
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )
    assert all([isclose(i[0], i[1], abs_tol=0.0001) for i in zip(result, expected)])


@pytest.mark.parametrize(
    "operation_volume",
    [199.0, -10000.0, 10000.0],
)
def test_get_well_position_adjusts_well_position_to_boundaries(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_addressable_area_view: AddressableAreaView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
    operation_volume: float,
) -> None:
    """If a volume offset is too large or too small, geometry should constrain the volume offset to the well bounds ."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    # should not constrain user-specified offsets
    meniscus_well_offset = WellOffset(x=2, y=3, z=-40)
    well_def = well_plate_def.wells["B2"]
    lld_min_height = 0.5

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    well_def = well_def.model_copy(update={"depth": 45.0})
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    probe_time = datetime.now()
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=ProbedHeightInfo(height=40.0, last_probed=probe_time),
            probed_volume=None,
        )
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(lld_min_height)

    # make sure that just the volume offset has been adjusted to the correct well boundary
    # but the well offset overall can still end up outside the well
    well_loc = LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS,
        offset=meniscus_well_offset,
        volumeOffset="operationVolume",
    )
    expected_vol_offset = subject.get_well_offset_adjustment(
        labware_id="labware-id",
        well_name="B2",
        well_location=well_loc,
        well_depth=well_def.depth,
        pipette_id="pipette-id",
        operation_volume=operation_volume,
    )
    assert isinstance(expected_vol_offset, float) or isinstance(
        expected_vol_offset, int
    )
    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=well_loc,
        operation_volume=operation_volume,
        pipette_id="pipette-id",
    )
    expected = Point(
        x=slot_pos[0]
        + calibration_offset.x
        + well_def.x
        + meniscus_well_offset.x
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=slot_pos[1]
        + calibration_offset.y
        + well_def.y
        + meniscus_well_offset.y
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=slot_pos[2]
        + calibration_offset.z
        + well_def.z
        + meniscus_well_offset.z
        + expected_vol_offset
        + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )
    assert all([isclose(i[0], i[1], abs_tol=0.0001) for i in zip(result, expected)])


def test_get_meniscus_height(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    mock_addressable_area_view: AddressableAreaView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well meniscus in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    probe_time = datetime.now()
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "B2")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "B2")).then_return(
        WellLiquidInfo(
            loaded_volume=LoadedVolumeInfo(
                volume=2000.0, last_loaded=probe_time, operations_since_load=0
            ),
            probed_height=None,
            probed_volume=None,
        )
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "B2")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(0.5)

    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=WellLocation(
            origin=WellOrigin.MENISCUS,
            offset=WellOffset(x=2, y=3, z=4),
        ),
        pipette_id="pipette-id",
    )

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 2 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=slot_pos[1] - 2 + well_def.y + 3 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=slot_pos[2]
        + 3
        + well_def.z
        + 4
        + 39.2423
        + +_PARENT_ORIGIN_TO_LABWARE_ORIGIN.z,
    )


def test_get_relative_well_location(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """It should get the relative location of a well given an absolute position."""
    monkeypatch.setattr(
        "opentrons.protocol_engine.state.geometry.get_stackup_origin_to_labware_origin",
        lambda *args, **kwargs: Point(0, 0, 0),
    )
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(slot_pos)
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result, _ = subject.get_relative_well_location(
        labware_id="labware-id",
        well_name="B2",
        absolute_point=Point(
            x=slot_pos[0] + 1 + well_def.x + 7,
            y=slot_pos[1] - 2 + well_def.y + 8,
            z=slot_pos[2] + 3 + well_def.z + well_def.depth + 9,
        ),
        location_type=WellLocationFunction.BASE,
    )
    assert result == WellLocation(
        origin=WellOrigin.TOP,
        offset=WellOffset.model_construct(
            x=cast(float, pytest.approx(7)),
            y=cast(float, pytest.approx(8)),
            z=cast(float, pytest.approx(9)),
        ),
    )


def test_get_relative_liquid_handling_well_location(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should get the relative location of a well given an absolute position."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="b",
        definitionUri=uri_from_details(namespace="a", load_name="b", version=1),
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId=None,
    )
    decoy.when(mock_labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(
        mock_addressable_area_view.get_addressable_area_position("3")
    ).then_return(Point(1, 2, 3))
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    decoy.when(mock_labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )

    well_def = well_plate_def.wells["B2"]

    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    (result, dynamic_liquid_tracking) = subject.get_relative_well_location(
        labware_id="labware-id",
        well_name="B2",
        absolute_point=Point(x=0, y=0, z=-2),
        meniscus_tracking=MeniscusTrackingTarget.END,
        location_type=WellLocationFunction.LIQUID_HANDLING,
    )

    assert result == LiquidHandlingWellLocation(
        origin=WellOrigin.MENISCUS,
        offset=WellOffset.model_construct(
            x=0.0,
            y=0.0,
            z=cast(float, pytest.approx(-2)),
        ),
        volumeOffset="operationVolume",
    )


def test_get_nominal_effective_tip_length(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
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
    subject: GeometryView,
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
    subject: GeometryView,
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
    subject: GeometryView,
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
    subject: GeometryView,
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
    subject: GeometryView,
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
    subject: GeometryView,
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


def test_get_ancestor_slot_name(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should get name of ancestor slot of labware."""
    decoy.when(mock_labware_view.get("labware-1")).then_return(
        LoadedLabware(
            id="labware-1",
            loadName="load-name",
            definitionUri="1234",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        )
    )
    assert subject.get_ancestor_slot_name("labware-1") == DeckSlotName.SLOT_4

    decoy.when(mock_labware_view.get("labware-2")).then_return(
        LoadedLabware(
            id="labware-2",
            loadName="load-name",
            definitionUri="4567",
            location=ModuleLocation(moduleId="4321"),
        )
    )
    decoy.when(mock_module_view.get_location("4321")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    assert subject.get_ancestor_slot_name("labware-2") == DeckSlotName.SLOT_1


def test_get_ancestor_slot_for_labware_stack_in_staging_area_slot(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get name of ancestor slot of a stack of labware in a staging area slot."""
    decoy.when(mock_labware_view.get("labware-1")).then_return(
        LoadedLabware(
            id="labware-1",
            loadName="load-name",
            definitionUri="1234",
            location=AddressableAreaLocation(
                addressableAreaName=StagingSlotName.SLOT_D4.id
            ),
        )
    )
    decoy.when(mock_labware_view.get("labware-2")).then_return(
        LoadedLabware(
            id="labware-2",
            loadName="load-name",
            definitionUri="1234",
            location=OnLabwareLocation(labwareId="labware-1"),
        )
    )
    assert subject.get_ancestor_slot_name("labware-2") == StagingSlotName.SLOT_D4


def test_get_ancestor_addressable_area_name(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should get name of ancestor AA of labware."""
    decoy.when(mock_labware_view.get("labware-1")).then_return(
        LoadedLabware(
            id="labware-1",
            loadName="load-name",
            definitionUri="1234",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        )
    )
    assert subject.get_ancestor_addressable_area_name("labware-1") == "4"

    decoy.when(mock_labware_view.get("labware-2")).then_return(
        LoadedLabware(
            id="labware-2",
            loadName="load-name",
            definitionUri="4567",
            location=ModuleLocation(moduleId="4321"),
        )
    )
    decoy.when(mock_module_view.get_provided_addressable_area("4321")).then_return(
        "someModuleAddressableArea"
    )
    assert (
        subject.get_ancestor_addressable_area_name("labware-2")
        == "someModuleAddressableArea"
    )


def test_get_ancestor_addressable_area_for_labware_stack_in_staging_area_slot(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get name of ancestor AA of a stack of labware in a staging area slot."""
    decoy.when(mock_labware_view.get("labware-1")).then_return(
        LoadedLabware(
            id="labware-1",
            loadName="load-name",
            definitionUri="1234",
            location=AddressableAreaLocation(
                addressableAreaName=StagingSlotName.SLOT_D4.id
            ),
        )
    )
    decoy.when(mock_labware_view.get("labware-2")).then_return(
        LoadedLabware(
            id="labware-2",
            loadName="load-name",
            definitionUri="1234",
            location=OnLabwareLocation(labwareId="labware-1"),
        )
    )
    assert subject.get_ancestor_addressable_area_name("labware-2") == "D4"


def test_get_ancestor_addressable_area_handles_cycles(
    decoy: Decoy, mock_labware_view: LabwareView, subject: GeometryView
) -> None:
    """It should raise and not lock up if there is a location cycle."""
    decoy.when(mock_labware_view.get("labware-1")).then_return(
        LoadedLabware(
            id="labware-1",
            loadName="load-name",
            definitionUri="1234",
            location=OnLabwareLocation(labwareId="labware-2"),
        )
    )
    decoy.when(mock_labware_view.get("labware-2")).then_return(
        LoadedLabware(
            id="labware-2",
            loadName="load-name",
            definitionUri="1234",
            location=OnLabwareLocation(labwareId="labware-3"),
        )
    )
    decoy.when(mock_labware_view.get("labware-3")).then_return(
        LoadedLabware(
            id="labware-3",
            loadName="load-name",
            definitionUri="1234",
            location=OnLabwareLocation(labwareId="labware-1"),
        )
    )
    with pytest.raises(errors.InvalidLabwarePositionError):
        subject.get_ancestor_addressable_area_name("labware-1")


def test_ensure_location_not_occupied_raises(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should raise error when labware is present in given location."""
    slot_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_4)
    # Shouldn't raise if neither labware nor module in location
    assert subject.ensure_location_not_occupied(location=slot_location) == slot_location

    # Raise if labware in location
    decoy.when(
        mock_labware_view.raise_if_labware_in_location(slot_location)
    ).then_raise(errors.LocationIsOccupiedError("Woops!"))
    with pytest.raises(errors.LocationIsOccupiedError):
        subject.ensure_location_not_occupied(location=slot_location)

    # Raise if module in location
    module_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    decoy.when(
        mock_labware_view.raise_if_labware_in_location(module_location)
    ).then_return(True)
    decoy.when(
        mock_module_view.raise_if_module_in_location(module_location)
    ).then_raise(errors.LocationIsOccupiedError("Woops again!"))
    with pytest.raises(errors.LocationIsOccupiedError):
        subject.ensure_location_not_occupied(location=module_location)

    # Shouldn't raise for off-deck labware
    assert (
        subject.ensure_location_not_occupied(location=OFF_DECK_LOCATION)
        == OFF_DECK_LOCATION
    )


def test_get_labware_grip_point_v2_definition(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should get the grip point of a LabwareDefinition2 labware at the specified location using addressable area center."""
    decoy.when(mock_labware_view.get_grip_z(_MOCK_LABWARE_DEFINITION2)).then_return(100)

    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_1.id)
    ).then_return(Point(x=101, y=102, z=103))

    decoy.when(
        mock_addressable_area_view.get_addressable_area(DeckSlotName.SLOT_1.id)
    ).then_return(MOCK_ADDRESSABLE_AREA)

    decoy.when(
        mock_addressable_area_view.get_addressable_area_center(DeckSlotName.SLOT_1.id)
    ).then_return(Point(x=64, y=43, z=0))

    labware_center = subject.get_labware_grip_point(
        labware_definition=_MOCK_LABWARE_DEFINITION2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        move_type=GripperMoveType.PICK_UP_LABWARE,
        user_additional_offset=None,
    )

    expected = Point(
        x=64 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=43 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=0 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z + 100,
    )

    assert labware_center == expected


def test_get_labware_grip_point_v3_definition(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should get the grip point of a LabwareDefinition3 labware at the specified location using labware center."""
    decoy.when(mock_labware_view.get_grip_z(_MOCK_LABWARE_DEFINITION3)).then_return(100)

    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_1.id)
    ).then_return(Point(x=101, y=102, z=103))

    decoy.when(
        mock_addressable_area_view.get_addressable_area(DeckSlotName.SLOT_1.id)
    ).then_return(MOCK_ADDRESSABLE_AREA)

    labware_center = subject.get_labware_grip_point(
        labware_definition=_MOCK_LABWARE_DEFINITION3,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        move_type=GripperMoveType.PICK_UP_LABWARE,
        user_additional_offset=None,
    )

    expected = Point(
        x=101.0 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x + 100,
        y=102.0 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y + (-25),
        z=103 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z + 100,
    )

    assert labware_center == expected


def test_get_labware_grip_point_v2_on_labware(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should get the grip point of a LabwareDefinition2 labware on another labware."""
    decoy.when(mock_labware_view.get(labware_id="below-id")).then_return(
        LoadedLabware(
            id="below-id",
            loadName="below-name",
            definitionUri="1234",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        )
    )
    decoy.when(mock_labware_view.get_definition("below-id")).then_return(
        sentinel.below_definition
    )

    decoy.when(
        mock_labware_view.get_grip_z(labware_definition=_MOCK_LABWARE_DEFINITION2)
    ).then_return(100)

    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(Point(x=5, y=9, z=10))

    decoy.when(
        mock_addressable_area_view.get_addressable_area(DeckSlotName.SLOT_4.id)
    ).then_return(MOCK_ADDRESSABLE_AREA)

    decoy.when(
        mock_addressable_area_view.get_addressable_area_center(DeckSlotName.SLOT_4.id)
    ).then_return(Point(x=64, y=43, z=0))

    grip_point = subject.get_labware_grip_point(
        labware_definition=_MOCK_LABWARE_DEFINITION2,
        location=OnLabwareLocation(labwareId="below-id"),
        move_type=GripperMoveType.PICK_UP_LABWARE,
        user_additional_offset=None,
    )

    expected = Point(
        x=64 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x,
        y=43 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y,
        z=0 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z + 100,
    )

    assert grip_point == expected


def test_get_labware_grip_point_v3_on_labware(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
) -> None:
    """It should get the grip point of a LabwareDefinition3 labware on another labware."""
    decoy.when(mock_labware_view.get(labware_id="below-id")).then_return(
        LoadedLabware(
            id="below-id",
            loadName="below-name",
            definitionUri="1234",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        )
    )
    decoy.when(mock_labware_view.get_definition("below-id")).then_return(
        sentinel.below_definition
    )

    decoy.when(
        mock_labware_view.get_grip_z(labware_definition=_MOCK_LABWARE_DEFINITION3)
    ).then_return(100)

    decoy.when(
        mock_addressable_area_view.get_addressable_area_position(DeckSlotName.SLOT_4.id)
    ).then_return(Point(x=5, y=9, z=10))

    decoy.when(
        mock_addressable_area_view.get_addressable_area(DeckSlotName.SLOT_4.id)
    ).then_return(MOCK_ADDRESSABLE_AREA)

    grip_point = subject.get_labware_grip_point(
        labware_definition=_MOCK_LABWARE_DEFINITION3,
        location=OnLabwareLocation(labwareId="below-id"),
        move_type=GripperMoveType.PICK_UP_LABWARE,
        user_additional_offset=None,
    )

    expected = Point(
        x=5 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.x + 100,
        y=9 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.y + (-25),
        z=10.0 + _PARENT_ORIGIN_TO_LABWARE_ORIGIN.z + 100,
    )

    assert grip_point == expected


@pytest.mark.parametrize(
    ["test_definition", "expected_x", "expected_y"],
    [
        pytest.param(
            _MOCK_LABWARE_DEFINITION2,
            503.0,
            372.0,
            id="labware_definition_v2",
        ),
        pytest.param(
            _MOCK_LABWARE_DEFINITION3,
            539.0,
            304.0,
            id="labware_definition_v3",
        ),
    ],
)
def test_get_labware_grip_point_for_labware_on_module(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    ot3_standard_deck_def: DeckDefinitionV5,
    subject: GeometryView,
    test_definition: LabwareDefinition,
    expected_x: float,
    expected_y: float,
) -> None:
    """It should return the grip point for labware directly on a module."""
    addressable_area_view = AddressableAreaView(
        state=AddressableAreaState(
            loaded_addressable_areas_by_name={},
            potential_cutout_fixtures_by_cutout_id={
                "cutoutC3": {
                    PotentialCutoutFixture(
                        "cutoutC3", "magneticBlockV1", frozenset({"magneticBlockV1C3"})
                    )
                }
            },
            deck_definition=ot3_standard_deck_def,
            deck_configuration=None,
            robot_type=subject._config.robot_type,
            use_simulated_deck_config=True,
            robot_definition=RobotDefinition(
                displayName="cool_guy",
                robotType="OT-3 Standard",
                models=[],
                extents=[5000, 5000, 5000],
                paddingOffsets=paddingOffset(rear=0, front=0, leftSide=0, rightSide=0),
                mountOffsets=mountOffset(left=[0], right=[0], gripper=[0]),
            ),
        )
    )
    subject = GeometryView(
        config=subject._config,
        labware_view=subject._labware,
        well_view=subject._wells,
        module_view=subject._modules,
        pipette_view=subject._pipettes,
        addressable_area_view=addressable_area_view,
    )
    decoy.when(mock_labware_view.get_grip_z(test_definition)).then_return(500)
    decoy.when(mock_module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_C3)
    )
    decoy.when(mock_module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetData(
            moduleOffsetVector=ModuleOffsetVector(x=100, y=200, z=300),
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_C3),
        )
    )
    decoy.when(mock_module_view.get_connected_model("module-id")).then_return(
        ModuleModel.MAGNETIC_BLOCK_V1
    )
    decoy.when(mock_module_view.get_provided_addressable_area("module-id")).then_return(
        "magneticBlockV1C3"
    )
    decoy.when(
        mock_module_view.get_nominal_offset_to_child(
            module_id="module-id", addressable_areas=addressable_area_view
        )
    ).then_return(Point(x=0, y=0, z=0))

    result_grip_point = subject.get_labware_grip_point(
        labware_definition=test_definition,
        location=ModuleLocation(moduleId="module-id"),
        move_type=GripperMoveType.PICK_UP_LABWARE,
        user_additional_offset=Point(x=1, y=2, z=3),
    )

    expected = Point(
        x=expected_x,
        y=expected_y,
        z=871.0,
    )

    assert result_grip_point == expected


@pytest.mark.parametrize(
    "test_definition,expected_x,expected_y",
    [
        pytest.param(
            _MOCK_LABWARE_DEFINITION2,
            502.0,
            370.0,
            id="labware_definition_v2",
        ),
        pytest.param(
            _MOCK_LABWARE_DEFINITION3,
            538.0,
            302.0,
            id="labware_definition_v3",
        ),
    ],
)
def test_get_labware_grip_point_for_labware_stack_on_module(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    ot3_standard_deck_def: DeckDefinitionV5,
    subject: GeometryView,
    test_definition: LabwareDefinition,
    expected_x: float,
    expected_y: float,
) -> None:
    """It should return the grip point for labware stack on a module."""
    addressable_area_view = AddressableAreaView(
        state=AddressableAreaState(
            loaded_addressable_areas_by_name={},
            potential_cutout_fixtures_by_cutout_id={
                "cutoutC3": {
                    PotentialCutoutFixture(
                        "cutoutC3", "magneticBlockV1", frozenset({"magneticBlockV1C3"})
                    )
                }
            },
            deck_definition=ot3_standard_deck_def,
            deck_configuration=None,
            robot_type=subject._config.robot_type,
            use_simulated_deck_config=True,
            robot_definition=RobotDefinition(
                displayName="cool_guy",
                robotType="OT-3 Standard",
                models=[],
                extents=[5000, 5000, 5000],
                paddingOffsets=paddingOffset(rear=0, front=0, leftSide=0, rightSide=0),
                mountOffsets=mountOffset(left=[0], right=[0], gripper=[0]),
            ),
        )
    )
    subject = GeometryView(
        config=subject._config,
        labware_view=subject._labware,
        well_view=subject._wells,
        module_view=subject._modules,
        pipette_view=subject._pipettes,
        addressable_area_view=addressable_area_view,
    )
    decoy.when(mock_labware_view.get_grip_z(test_definition)).then_return(500)
    decoy.when(mock_module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_C3)
    )
    decoy.when(mock_module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetData(
            moduleOffsetVector=ModuleOffsetVector(x=100, y=200, z=300),
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_C3),
        )
    )
    decoy.when(mock_module_view.get_connected_model("module-id")).then_return(
        ModuleModel.MAGNETIC_BLOCK_V1
    )

    decoy.when(mock_labware_view.get("below-id-9")).then_return(
        LoadedLabware(
            id="below-id-9",
            loadName="bottom-name",
            definitionUri="1234",
            location=ModuleLocation(moduleId="module-id"),
        )
    )
    decoy.when(mock_labware_view.get_definition("below-id-9")).then_return(
        sentinel.bottom_definition
    )
    decoy.when(mock_module_view.get_provided_addressable_area("module-id")).then_return(
        "magneticBlockV1C3"
    )

    result_grip_point = subject.get_labware_grip_point(
        labware_definition=test_definition,
        location=OnLabwareLocation(labwareId="below-id-9"),
        move_type=GripperMoveType.PICK_UP_LABWARE,
        user_additional_offset=None,
    )

    expected = Point(
        x=expected_x,
        y=expected_y,
        z=868.0,
    )

    assert result_grip_point == expected


@pytest.mark.parametrize(
    argnames=["location", "should_dodge", "expected_waypoints"],
    argvalues=[
        (None, True, []),
        (None, False, []),
        (CurrentWell("pipette-id", "from-labware-id", "well-name"), False, []),
        (CurrentWell("pipette-id", "from-labware-id", "well-name"), True, [(11, 22)]),
        (CurrentAddressableArea("pipette-id", "area-name"), False, []),
        (CurrentAddressableArea("pipette-id", "area-name"), True, [(11, 22)]),
    ],
)
def test_get_extra_waypoints(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    mock_addressable_area_view: AddressableAreaView,
    location: Optional[CurrentPipetteLocation],
    should_dodge: bool,
    expected_waypoints: List[Tuple[float, float]],
    subject: GeometryView,
) -> None:
    """It should return extra waypoints if thermocycler should be dodged."""
    decoy.when(mock_labware_view.get("from-labware-id")).then_return(
        LoadedLabware(
            id="labware1",
            loadName="load-name1",
            definitionUri="1234",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        )
    )

    decoy.when(
        mock_addressable_area_view.get_addressable_area_base_slot("area-name")
    ).then_return(DeckSlotName.SLOT_1)

    decoy.when(
        mock_module_view.should_dodge_thermocycler(
            from_slot=DeckSlotName.SLOT_1, to_slot=DeckSlotName.SLOT_2
        )
    ).then_return(should_dodge)
    decoy.when(
        # Assume the subject's Config is for an OT-3, so use an OT-3 slot name.
        mock_addressable_area_view.get_addressable_area_center(
            addressable_area_name=DeckSlotName.SLOT_C2.id
        )
    ).then_return(Point(x=11, y=22, z=33))

    extra_waypoints = subject.get_extra_waypoints(location, DeckSlotName.SLOT_2)

    assert extra_waypoints == expected_waypoints


def test_get_slot_item(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    ot3_standard_deck_def: DeckDefinitionV5,
    subject: GeometryView,
) -> None:
    """It should get items in certain slots."""
    labware = LoadedLabware.model_construct(id="cool-labware")  # type: ignore[call-arg]
    module = LoadedModule.model_construct(id="cool-module")  # type: ignore[call-arg]
    chute_fixture = CutoutFixture(
        id="wasteChuteRightAdapterNoCover",
        mayMountTo=["cutoutD3"],
        providesAddressableAreas={
            "cutoutD3": [
                "1ChannelWasteChute",
                "8ChannelWasteChute",
                "96ChannelWasteChute",
                "gripperWasteChute",
            ]
        },
        displayName="Waste Chute Adapter for 96 Channel Pipette or Gripper",
        fixtureGroup={},
        expectOpentronsModuleSerialNumber=False,
        height=124.5,
    )
    chute_area = AddressableArea(
        area_name="1ChannelWasteChute",
        area_type=AreaType.WASTE_CHUTE,
        base_slot=DeckSlotName.SLOT_D3,
        display_name="",
        bounding_box=Dimensions(x=0, y=0, z=0),
        position=AddressableOffsetVector(x=0, y=0, z=0),
        compatible_module_types=[],
        features=LocatingFeatures(),
        mating_surface_unit_vector=[-1, 1, -1],
        orientation=ModuleOrientation.NOT_APPLICABLE,
    )
    subject._addressable_areas = AddressableAreaView(
        state=AddressableAreaState(
            loaded_addressable_areas_by_name={
                "1ChannelWasteChute": chute_area,
            },
            potential_cutout_fixtures_by_cutout_id={
                "cutoutD3": {
                    PotentialCutoutFixture(
                        cutout_id="cutoutD3",
                        cutout_fixture_id="cool_chute",
                        provided_addressable_areas=frozenset({chute_area.area_name}),
                    )
                },
                "cutoutC3": {
                    PotentialCutoutFixture(
                        cutout_id="cutoutC3",
                        cutout_fixture_id="cool_trash",
                        provided_addressable_areas=frozenset({chute_area.area_name}),
                    )
                },
            },
            deck_definition=ot3_standard_deck_def,
            deck_configuration=[
                ("cutoutC1", "singleLeftSlot", None),
                ("cutoutD1", "singleLeftSlot", None),
                ("cutoutD2", "singleCenterSlot", None),
                ("cutoutD3", "wasteChuteRightAdapterNoCover", None),
            ],
            robot_type=subject._addressable_areas._state.robot_type,
            use_simulated_deck_config=subject._addressable_areas._state.use_simulated_deck_config,
            robot_definition=subject._addressable_areas._state.robot_definition,
        )
    )

    decoy.when(mock_labware_view.get_by_slot(DeckSlotName.SLOT_D1)).then_return(None)
    decoy.when(mock_labware_view.get_by_slot(DeckSlotName.SLOT_D2)).then_return(labware)
    decoy.when(mock_labware_view.get_by_slot(DeckSlotName.SLOT_C1)).then_return(None)

    decoy.when(mock_module_view.get_by_slot(DeckSlotName.SLOT_D1)).then_return(module)
    decoy.when(mock_module_view.get_by_slot(DeckSlotName.SLOT_D2)).then_return(None)
    decoy.when(mock_module_view.get_by_slot(DeckSlotName.SLOT_C1)).then_return(None)

    assert (
        subject.get_slot_item(
            DeckSlotName.SLOT_C1,
        )
        is None
    )
    assert subject.get_slot_item(DeckSlotName.SLOT_D2) == labware
    assert subject.get_slot_item(DeckSlotName.SLOT_D1) == module
    assert subject.get_slot_item(DeckSlotName.SLOT_D3) == chute_fixture


def test_get_slot_item_that_is_overflowed_module(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should return the module that occupies the slot, even if not loaded on it."""
    module = LoadedModule.model_construct(id="cool-module")  # type: ignore[call-arg]
    decoy.when(mock_labware_view.get_by_slot(DeckSlotName.SLOT_3)).then_return(None)
    decoy.when(mock_module_view.get_by_slot(DeckSlotName.SLOT_3)).then_return(None)
    decoy.when(
        mock_module_view.get_overflowed_module_in_slot(DeckSlotName.SLOT_3)
    ).then_return(module)
    assert subject.get_slot_item(DeckSlotName.SLOT_3) == module


@pytest.mark.parametrize(
    argnames=["slot_name", "expected_column"],
    argvalues=[
        (DeckSlotName.SLOT_3, 3),
        (DeckSlotName.SLOT_5, 2),
        (DeckSlotName.SLOT_7, 1),
        (DeckSlotName.SLOT_A1, 1),
        (DeckSlotName.SLOT_B2, 2),
        (DeckSlotName.SLOT_C3, 3),
    ],
)
def test_get_slot_column(
    subject: GeometryView,
    slot_name: DeckSlotName,
    expected_column: int,
) -> None:
    """It should return the correct column number for the slot."""
    assert subject.get_slot_column(slot_name) == expected_column


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
    subject: GeometryView,
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
            available_volume_modes_min_vol={},
        )
    )
    decoy.when(mock_pipette_view.get_mount("pip-123")).then_return(pipette_mount)
    decoy.when(mock_labware_view.get("abc")).then_return(
        LoadedLabware(
            id="abc",
            loadName="load-name2",
            definitionUri="4567",
            location=DeckSlotLocation(slotName=labware_slot),
        )
    )
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
    subject: GeometryView,
) -> None:
    """It should provide the default drop tip location when dropping into a non-fixed-trash labware."""
    decoy.when(mock_labware_view.is_fixed_trash(labware_id="abc")).then_return(False)
    assert subject.get_next_tip_drop_location(
        labware_id="abc", well_name="A1", pipette_id="pip-123"
    ) == DropTipWellLocation(
        origin=DropTipWellOrigin.DEFAULT,
        offset=WellOffset(x=0, y=0, z=0),
    )


def test_ensure_valid_gripper_location(subject: GeometryView) -> None:
    """It should raise error if it's not a valid labware movement location for gripper."""
    slot_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    module_location = ModuleLocation(moduleId="dummy-module")
    on_labware_location = OnLabwareLocation(labwareId="adapter-id")
    off_deck_location = OFF_DECK_LOCATION

    assert subject.ensure_valid_gripper_location(slot_location) == slot_location
    assert subject.ensure_valid_gripper_location(module_location) == module_location
    assert (
        subject.ensure_valid_gripper_location(on_labware_location)
        == on_labware_location
    )

    with pytest.raises(errors.LabwareMovementNotAllowedError):
        subject.ensure_valid_gripper_location(off_deck_location)


def test_check_gripper_labware_tip_collision(
    decoy: Decoy,
    mock_pipette_view: PipetteView,
    mock_labware_view: LabwareView,
    mock_addressable_area_view: AddressableAreaView,
    subject: GeometryView,
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
    decoy.when(subject.get_labware_origin_position("labware-id")).then_return(
        Point(1, 2, 3)
    )
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


# Note: Below here, all tests should be done using actual state objects rather than mocks of dependent views.
# I (sf) think this is a better way to do things, but let's try and do it as we add more stuff and see if I'm
# right!


@pytest.mark.parametrize("use_mocks", [False])
def test_get_offset_location_deck_slot(
    labware_store: LabwareStore,
    subject: GeometryView,
    nice_labware_definition: LabwareDefinition,
) -> None:
    """Test if you can get the offset location of a labware in a deck slot."""
    action = load_labware_action(
        labware_id="labware-id-1",
        labware_def=nice_labware_definition,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_C2),
    )

    labware_store.handle_action(action)
    offset_location = subject.get_offset_location("labware-id-1")
    assert offset_location == [
        OnAddressableAreaOffsetLocationSequenceComponent(addressableAreaName="C2")
    ]


@pytest.mark.parametrize("use_mocks", [False])
def test_get_offset_location_module(
    labware_store: LabwareStore,
    module_store: ModuleStore,
    tempdeck_v2_def: ModuleDefinition,
    subject: GeometryView,
    nice_labware_definition: LabwareDefinition,
) -> None:
    """Test if you can get the offset of a labware directly on a module."""
    load_module = load_module_action(
        "module-id-1", tempdeck_v2_def, DeckSlotLocation(slotName=DeckSlotName.SLOT_A3)
    )
    load_labware = load_labware_action(
        labware_id="labware-id-1",
        labware_def=nice_labware_definition,
        location=ModuleLocation(moduleId="module-id-1"),
    )

    module_store.handle_action(load_module)
    labware_store.handle_action(load_labware)
    offset_location = subject.get_offset_location("labware-id-1")
    assert offset_location == [
        OnModuleOffsetLocationSequenceComponent(
            moduleModel=ModuleModel.TEMPERATURE_MODULE_V2
        ),
        OnAddressableAreaOffsetLocationSequenceComponent(
            addressableAreaName="temperatureModuleV2A3"
        ),
    ]


@pytest.mark.parametrize("use_mocks", [False])
def test_get_offset_location_module_with_adapter(
    labware_store: LabwareStore,
    module_store: ModuleStore,
    tempdeck_v2_def: ModuleDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
    nice_adapter_definition: LabwareDefinition,
    nice_labware_definition: LabwareDefinition,
) -> None:
    """Test if you can get the offset of a labware directly on a module."""
    load_module = load_module_action(
        "module-id-1", tempdeck_v2_def, DeckSlotLocation(slotName=DeckSlotName.SLOT_A3)
    )
    load_adapter = load_adapter_action(
        "adapter-id-1", nice_adapter_definition, ModuleLocation(moduleId="module-id-1")
    )
    load_labware = load_labware_action(
        "labware-id-1",
        nice_labware_definition,
        OnLabwareLocation(labwareId="adapter-id-1"),
    )

    module_store.handle_action(load_module)
    labware_store.handle_action(load_adapter)
    labware_store.handle_action(load_labware)

    offset_location = subject.get_offset_location("labware-id-1")
    assert offset_location == [
        OnLabwareOffsetLocationSequenceComponent(
            labwareUri=labware_view.get_uri_from_definition(nice_adapter_definition)
        ),
        OnModuleOffsetLocationSequenceComponent(
            moduleModel=ModuleModel.TEMPERATURE_MODULE_V2
        ),
        OnAddressableAreaOffsetLocationSequenceComponent(
            addressableAreaName="temperatureModuleV2A3"
        ),
    ]


@pytest.mark.parametrize("use_mocks", [False])
def test_get_offset_fails_with_off_deck_labware(
    decoy: Decoy,
    labware_store: LabwareStore,
    subject: GeometryView,
    nice_labware_definition: LabwareDefinition,
) -> None:
    """You cannot get the offset location for a labware loaded OFF_DECK."""
    action = load_labware_action(
        labware_id="labware-id-1",
        location=OFF_DECK_LOCATION,
        labware_def=nice_labware_definition,
    )

    labware_store.handle_action(action)
    offset_location = subject.get_offset_location("labware-id-1")
    assert offset_location is None


@pytest.mark.parametrize("use_mocks", [False])
def test_get_projected_offset_location_pending_labware(
    decoy: Decoy,
    module_store: ModuleStore,
    tempdeck_v2_def: ModuleDefinition,
    subject: GeometryView,
) -> None:
    """Test if you can get the projected offset of a labware on a labware not yet loaded."""
    load_module = load_module_action(
        module_id="module-id-1",
        module_def=tempdeck_v2_def,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
    )

    module_store.handle_action(load_module)
    offset_location = subject.get_projected_offset_location(
        OnLabwareLocation(labwareId="adapter-id-1"),
        {
            "adapter-id-1": LoadedLabware(
                id="adapter-id-1",
                loadName="some-adapter-loadname",
                definitionUri="some-adapter-defuri",
                lid_id=None,
                offsetId=None,
                displayName=None,
                location=ModuleLocation(moduleId="module-id-1"),
            ),
        },
    )
    assert offset_location == [
        OnLabwareOffsetLocationSequenceComponent(labwareUri="some-adapter-defuri"),
        OnModuleOffsetLocationSequenceComponent(
            moduleModel=ModuleModel.TEMPERATURE_MODULE_V2
        ),
        OnAddressableAreaOffsetLocationSequenceComponent(
            addressableAreaName="temperatureModuleV2A3"
        ),
    ]


@pytest.mark.parametrize("frustum", RECTANGULAR_TEST_EXAMPLES)
def test_rectangular_frustum_math_helpers(
    decoy: Decoy,
    frustum: Dict[str, List[float]],
    subject: GeometryView,
) -> None:
    """Test both height and volume calculation within a given rectangular frustum."""
    total_frustum_height = frustum["height"][0]
    bottom_length = frustum["length"][-1]
    bottom_width = frustum["width"][-1]

    def _find_volume_from_height_(index: int) -> None:
        nonlocal total_frustum_height, bottom_width, bottom_length
        top_length = frustum["length"][index]
        top_width = frustum["width"][index]
        target_height = frustum["height"][index]

        found_volume = _volume_from_height_rectangular(
            target_height=target_height,
            total_frustum_height=total_frustum_height,
            top_length=top_length,
            bottom_length=bottom_length,
            top_width=top_width,
            bottom_width=bottom_width,
        )

        found_height = _height_from_volume_rectangular(
            volume=found_volume,
            total_frustum_height=total_frustum_height,
            top_length=top_length,
            bottom_length=bottom_length,
            top_width=top_width,
            bottom_width=bottom_width,
        )

        assert isclose(found_height, frustum["height"][index])

    for i in range(len(frustum["height"])):
        _find_volume_from_height_(i)


@pytest.mark.parametrize("frustum", CIRCULAR_TEST_EXAMPLES)
def test_circular_frustum_math_helpers(
    frustum: Dict[str, List[float]],
) -> None:
    """Test both height and volume calculation within a given circular frustum."""
    total_frustum_height = frustum["height"][0]
    bottom_radius = frustum["radius"][-1]

    def _find_volume_from_height_(index: int) -> None:
        nonlocal total_frustum_height, bottom_radius
        top_radius = frustum["radius"][index]
        target_height = frustum["height"][index]
        segment = ConicalFrustum(
            shape="conical",
            bottomDiameter=bottom_radius * 2,
            topDiameter=top_radius * 2,
            topHeight=total_frustum_height,
            bottomHeight=0.0,
            xCount=1,
            yCount=1,
        )
        found_volume = _volume_from_height_circular(
            target_height=target_height,
            segment=segment,
        )

        found_height = _height_from_volume_circular(
            target_volume=found_volume,
            segment=segment,
        )

        assert isclose(found_height, frustum["height"][index], abs_tol=0.001)

    for i in range(len(frustum["height"])):
        _find_volume_from_height_(i)


def test_validate_dispense_volume_into_well_bottom(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should raise an InvalidDispenseVolumeError if too much volume is specified."""
    well_def = well_plate_def.wells["B2"]
    decoy.when(mock_labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    with pytest.raises(errors.InvalidDispenseVolumeError):
        subject.validate_dispense_volume_into_well(
            labware_id="labware-id",
            well_name="B2",
            well_location=LiquidHandlingWellLocation(
                origin=WellOrigin.BOTTOM,
                offset=WellOffset(x=2, y=3, z=4),
            ),
            volume=400.0,
        )


def test_validate_dispense_volume_into_well_meniscus(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    subject: GeometryView,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should raise an InvalidDispenseVolumeError if too much volume is specified."""
    well_def = well_plate_def.wells["A1"]
    # make the depth match the phoney baloney innerwellgeomtry
    well_def = well_def.model_copy(update={"depth": 45.0})
    decoy.when(mock_labware_view.get_well_definition("labware-id", "A1")).then_return(
        well_def
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "A1")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    probe_time = datetime.now()
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "A1")).then_return(
        probe_time
    )
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "A1")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=ProbedHeightInfo(height=40.0, last_probed=probe_time),
            probed_volume=None,
        )
    )

    with pytest.raises(errors.InvalidDispenseVolumeError):
        subject.validate_dispense_volume_into_well(
            labware_id="labware-id",
            well_name="A1",
            well_location=LiquidHandlingWellLocation(
                origin=WellOrigin.MENISCUS,
                offset=WellOffset(x=2, y=3, z=4),
            ),
            volume=1100000.0,
        )


def test_get_latest_volume_information(
    decoy: Decoy,
    mock_labware_view: LabwareView,
    mock_well_view: WellView,
    subject: GeometryView,
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
    subject: GeometryView,
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
        subject.get_well_height(labware_id=labware_id, well_name=well_name)
        - expected_height_from_top_mm
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
    subject: GeometryView,
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
    vol_2_input_height_from_bottom = (
        subject.get_well_height(labware_id=labware_id, well_name=well_name)
        - input_height_from_top_mm
    )
    found_volume_top = subject.get_well_volume_at_height(
        labware_id=labware_id,
        well_name=well_name,
        height=vol_2_input_height_from_bottom,
    )
    assert isinstance(found_volume_bottom, float)
    assert isinstance(found_volume_top, float)
    assert isclose(found_volume_bottom, expected_volume_bottom, rel_tol=0.01)
    assert isclose(found_volume_top, expected_volume_top, rel_tol=0.01)


@pytest.mark.parametrize("use_mocks", [False])
def test_get_location_sequence_deck_slot(
    labware_store: LabwareStore,
    addressable_area_store: AddressableAreaStore,
    nice_labware_definition: LabwareDefinition,
    subject: GeometryView,
) -> None:
    """Test if you can get the location sequence of a labware in a deck slot."""
    action = load_labware_action(
        labware_id="labware-id-1",
        labware_def=nice_labware_definition,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_C2),
    )
    labware_store.handle_action(action)
    addressable_area_store.handle_action(action)
    location_sequence = subject.get_location_sequence("labware-id-1")
    assert location_sequence == [
        OnAddressableAreaLocationSequenceComponent(addressableAreaName="C2"),
        OnCutoutFixtureLocationSequenceComponent(
            cutoutId="cutoutC2", possibleCutoutFixtureIds=["singleCenterSlot"]
        ),
    ]


@pytest.mark.parametrize("use_mocks", [False])
def test_get_location_sequence_module(
    labware_store: LabwareStore,
    module_store: ModuleStore,
    addressable_area_store: AddressableAreaStore,
    nice_labware_definition: LabwareDefinition,
    tempdeck_v2_def: ModuleDefinition,
    subject: GeometryView,
) -> None:
    """Test if you can get the location sequence of a labware directly on a module."""
    load_module = load_module_action(
        module_id="module-id-1",
        module_def=tempdeck_v2_def,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
        used_addressable_area="temperatureModuleV2A3",
    )
    load_labware = load_labware_action(
        labware_id="labware-id-1",
        location=ModuleLocation(moduleId="module-id-1"),
        labware_def=nice_labware_definition,
    )

    module_store.handle_action(load_module)
    addressable_area_store.handle_action(load_module)
    labware_store.handle_action(load_labware)

    location_sequence = subject.get_location_sequence("labware-id-1")
    assert location_sequence == [
        OnAddressableAreaLocationSequenceComponent(
            addressableAreaName="temperatureModuleV2A3"
        ),
        OnModuleLocationSequenceComponent(moduleId="module-id-1"),
        OnCutoutFixtureLocationSequenceComponent(
            cutoutId="cutoutA3", possibleCutoutFixtureIds=["temperatureModuleV2"]
        ),
    ]


@pytest.mark.parametrize("use_mocks", [False])
def test_get_location_sequence_module_with_adapter(
    decoy: Decoy,
    labware_store: LabwareStore,
    module_store: ModuleStore,
    addressable_area_store: AddressableAreaStore,
    nice_labware_definition: LabwareDefinition,
    nice_adapter_definition: LabwareDefinition,
    tempdeck_v2_def: ModuleDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """Test if you can get the location sequence of a labware directly on a module."""
    load_module = load_module_action(
        module_id="module-id-1",
        module_def=tempdeck_v2_def,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
        used_addressable_area="temperatureModuleV2A3",
    )
    load_adapter = SucceedCommandAction(
        command=_dummy_command(),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id="adapter-id-1",
                definition=nice_adapter_definition,
                offset_id=None,
                new_location=ModuleLocation(moduleId="module-id-1"),
                display_name=None,
            ),
        ),
    )
    load_labware = SucceedCommandAction(
        command=_dummy_command(),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id="labware-id-1",
                definition=nice_labware_definition,
                offset_id=None,
                new_location=OnLabwareLocation(labwareId="adapter-id-1"),
                display_name=None,
            )
        ),
    )
    module_store.handle_action(load_module)
    addressable_area_store.handle_action(load_module)
    labware_store.handle_action(load_adapter)
    labware_store.handle_action(load_labware)
    location_sequence = subject.get_location_sequence("labware-id-1")
    assert location_sequence == [
        OnLabwareLocationSequenceComponent(labwareId="adapter-id-1", lidId=None),
        OnAddressableAreaLocationSequenceComponent(
            addressableAreaName="temperatureModuleV2A3"
        ),
        OnModuleLocationSequenceComponent(moduleId="module-id-1"),
        OnCutoutFixtureLocationSequenceComponent(
            cutoutId="cutoutA3", possibleCutoutFixtureIds=["temperatureModuleV2"]
        ),
    ]


@pytest.mark.parametrize("use_mocks", [False])
def test_get_location_sequence_off_deck(
    decoy: Decoy,
    labware_store: LabwareStore,
    nice_labware_definition: LabwareDefinition,
    subject: GeometryView,
) -> None:
    """You cannot get the location sequence for a labware loaded OFF_DECK."""
    action = SucceedCommandAction(
        command=_dummy_command(),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id="labware-id-1",
                definition=nice_labware_definition,
                offset_id=None,
                new_location=OFF_DECK_LOCATION,
                display_name=None,
            )
        ),
    )
    labware_store.handle_action(action)
    location_sequence = subject.get_location_sequence("labware-id-1")
    assert location_sequence == [
        NotOnDeckLocationSequenceComponent(logicalLocationName=OFF_DECK_LOCATION)
    ]


@pytest.mark.parametrize("use_mocks", [False])
def test_get_location_sequence_stacker_hopper(
    decoy: Decoy,
    labware_store: LabwareStore,
    module_store: ModuleStore,
    addressable_area_store: AddressableAreaStore,
    nice_labware_definition: LabwareDefinition,
    flex_stacker_v1_def: ModuleDefinition,
    subject: GeometryView,
) -> None:
    """Test if you can get the location sequence of a labware in the stacker hopper."""
    load_module = load_module_action(
        module_id="module-id-1",
        module_def=flex_stacker_v1_def,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
        used_addressable_area="flexStackerModuleV1A4",
    )

    load_labware = SucceedCommandAction(
        command=_dummy_command(),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id="labware-id-1",
                definition=nice_labware_definition,
                offset_id=None,
                new_location=InStackerHopperLocation(moduleId="module-id-1"),
                display_name=None,
            ),
        ),
    )

    module_store.handle_action(load_module)
    addressable_area_store.handle_action(load_module)
    module_store.handle_action(load_labware)
    labware_store.handle_action(load_labware)
    location_sequence = subject.get_location_sequence("labware-id-1")
    assert location_sequence == [
        InStackerHopperLocation(moduleId="module-id-1"),
        OnCutoutFixtureLocationSequenceComponent(
            possibleCutoutFixtureIds=[
                "flexStackerModuleV1",
                "flexStackerModuleV1WithMagneticBlockV1",
            ],
            cutoutId="cutoutA3",
        ),
    ]


@pytest.mark.parametrize("use_mocks", [False])
def test_get_predicted_location_sequence_with_pending_labware(
    decoy: Decoy,
    labware_store: LabwareStore,
    module_store: ModuleStore,
    addressable_area_store: AddressableAreaStore,
    tempdeck_v2_def: ModuleDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """Test if you can get the location sequence of a labware directly on a module."""
    load_module = load_module_action(
        module_id="module-id-1",
        module_def=tempdeck_v2_def,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
        used_addressable_area="temperatureModuleV2A3",
    )
    module_store.handle_action(load_module)
    addressable_area_store.handle_action(load_module)
    location_sequence = subject.get_predicted_location_sequence(
        OnLabwareLocation(labwareId="adapter-id-1"),
        {
            "adapter-id-1": LoadedLabware(
                id="adapter-id-1",
                loadName="some-adapter-loadname",
                definitionUri="some-adapter-uri",
                lid_id=None,
                offsetId=None,
                displayName=None,
                location=ModuleLocation(moduleId="module-id-1"),
            )
        },
    )
    assert location_sequence == [
        OnLabwareLocationSequenceComponent(labwareId="adapter-id-1", lidId=None),
        OnAddressableAreaLocationSequenceComponent(
            addressableAreaName="temperatureModuleV2A3"
        ),
        OnModuleLocationSequenceComponent(moduleId="module-id-1"),
        OnCutoutFixtureLocationSequenceComponent(
            cutoutId="cutoutA3", possibleCutoutFixtureIds=["temperatureModuleV2"]
        ),
    ]


@pytest.mark.parametrize("use_mocks", [False])
@pytest.mark.parametrize(
    "definition_list,height",
    [
        pytest.param([], 0, id="empty-list"),
        pytest.param(
            [
                labware_definition_type_adapter.validate_python(
                    load_labware_definition(
                        "corning_96_wellplate_360ul_flat", version=2
                    )
                )
            ],
            14.22,
            id="single-labware",
        ),
        pytest.param(
            [
                labware_definition_type_adapter.validate_python(
                    load_labware_definition(
                        "opentrons_flex_tiprack_lid", version=1, schema=2
                    )
                ),
                labware_definition_type_adapter.validate_python(
                    load_labware_definition(
                        "opentrons_flex_96_tiprack_1000ul", version=1
                    )
                ),
            ],
            99 + 17 - 14.25,
            id="tiprack-plus-lid",
        ),
    ],
)
def test_get_height_of_labware_stack(
    subject: GeometryView,
    definition_list: list[LabwareDefinition],
    height: float,
) -> None:
    """It should correctly calculate the height of labware stacks."""
    assert subject.get_height_of_labware_stack(definition_list) == height


@pytest.mark.parametrize("initial_liquid_height", [5.6, SimulatedProbeResult()])
def test_virtual_get_well_height_after_liquid_handling(
    decoy: Decoy,
    subject: GeometryView,
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
    decoy: Decoy,
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
    subject: GeometryView,
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
            subject.find_height_at_well_volume(
                labware_id=labware_id,
                well_name="A1",
                target_volume=sentinel.arbitrary_height_volume,
            )
            == sentinel.arbitrary_return_val
        )
    elif target_measurement == "volume":
        assert (
            subject.find_volume_at_well_height(
                labware_id=labware_id,
                well_name="A1",
                target_height=sentinel.arbitrary_height_volume,
            )
            == sentinel.arbitrary_return_val
        )


@pytest.mark.parametrize(
    ["operation_volume", "expected_change"],
    [(199.0, 1.9117), (-10000.0, -2.944), (10000.0, 41.556)],
)
def test_get_liquid_handling_z_change(
    decoy: Decoy,
    subject: GeometryView,
    well_plate_def: LabwareDefinition,
    mock_labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    mock_well_view: WellView,
    operation_volume: float,
    expected_change: float,
) -> None:
    """Test for get_liquid_handling_z_change math."""
    pip_type = PipetteNameType.P300_SINGLE
    decoy.when(mock_pipette_view.get_nozzle_configuration("pipette-id")).then_return(
        get_default_nozzle_map(pip_type)
    )
    fake_min_height = 0.5
    decoy.when(
        mock_pipette_view.get_current_tip_lld_settings(pipette_id="pipette-id")
    ).then_return(fake_min_height)
    well_def = well_plate_def.wells["A1"]
    # make the depth match the phoney baloney innerwellgeomtry
    well_def = well_def.model_copy(update={"depth": 45.0})
    decoy.when(mock_labware_view.get_well_definition("labware-id", "A1")).then_return(
        well_def
    )
    decoy.when(mock_labware_view.get_definition("labware-id")).then_return(
        well_plate_def
    )
    decoy.when(mock_labware_view.get_well_geometry("labware-id", "A1")).then_return(
        _TEST_INNER_WELL_GEOMETRY
    )
    probe_time = datetime.now()
    decoy.when(mock_well_view.get_last_liquid_update("labware-id", "A1")).then_return(
        probe_time
    )
    probed_height = 3.444
    decoy.when(mock_well_view.get_well_liquid_info("labware-id", "A1")).then_return(
        WellLiquidInfo(
            loaded_volume=None,
            probed_height=ProbedHeightInfo(
                height=probed_height, last_probed=probe_time
            ),
            probed_volume=None,
        )
    )
    # make sure that liquid handling z change math stays the same
    change = subject.get_liquid_handling_z_change(
        labware_id="labware-id",
        well_name="A1",
        pipette_id="pipette-id",
        operation_volume=operation_volume,
    )
    assert isclose(change, expected_change, abs_tol=0.0001)


def test_raise_if_labware_inaccessible_by_pipette_staging_area(
    subject: GeometryView, mock_labware_view: LabwareView, decoy: Decoy
) -> None:
    """It should raise if the labware is on a staging slot."""
    decoy.when(mock_labware_view.get("labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="test",
            definitionUri="def-uri",
            location=AddressableAreaLocation(addressableAreaName="B4"),
        )
    )

    with pytest.raises(
        errors.LocationNotAccessibleByPipetteError, match="on staging slot"
    ):
        subject.raise_if_labware_inaccessible_by_pipette("labware-id")


def test_raise_if_labware_inaccessible_by_pipette_off_deck(
    subject: GeometryView, mock_labware_view: LabwareView, decoy: Decoy
) -> None:
    """It should raise if the labware is off-deck."""
    decoy.when(mock_labware_view.get("labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="test",
            definitionUri="def-uri",
            location=OFF_DECK_LOCATION,
        )
    )

    with pytest.raises(errors.LocationNotAccessibleByPipetteError, match="off-deck"):
        subject.raise_if_labware_inaccessible_by_pipette("labware-id")


def test_raise_if_labware_inaccessible_by_pipette_stacked_labware_on_staging_area(
    subject: GeometryView, mock_labware_view: LabwareView, decoy: Decoy
) -> None:
    """It should raise if the labware is stacked on a staging slot."""
    decoy.when(mock_labware_view.get("labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="test",
            definitionUri="def-uri",
            location=OnLabwareLocation(labwareId="lower-labware-id"),
        )
    )
    decoy.when(mock_labware_view.get("lower-labware-id")).then_return(
        LoadedLabware(
            id="lower-labware-id",
            loadName="test",
            definitionUri="def-uri",
            location=AddressableAreaLocation(addressableAreaName="B4"),
        )
    )

    with pytest.raises(
        errors.LocationNotAccessibleByPipetteError, match="on staging slot"
    ):
        subject.raise_if_labware_inaccessible_by_pipette("labware-id")


@pytest.mark.parametrize(
    "addressable_area",
    [
        "flexStackerModuleV1A4",
        "flexStackerModuleV1B4",
        "flexStackerModuleV1C4",
        "flexStackerModuleV1D4",
    ],
)
def test_raise_if_labware_on_stacker_aa(
    subject: GeometryView,
    mock_labware_view: LabwareView,
    decoy: Decoy,
    addressable_area: str,
) -> None:
    """It should raise if the labware is on a stacker shuttle aa."""
    decoy.when(mock_labware_view.get("labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="test",
            definitionUri="def-uri",
            location=AddressableAreaLocation(addressableAreaName=addressable_area),
        )
    )
    with pytest.raises(
        errors.LocationNotAccessibleByPipetteError, match="on a stacker shuttle"
    ):
        subject.raise_if_labware_inaccessible_by_pipette("labware-id")


@pytest.mark.parametrize(
    "model", [m for m in ModuleModel if ModuleModel.is_flex_stacker(m)]
)
def test_raise_if_labware_on_stacker_module(
    subject: GeometryView,
    mock_labware_view: LabwareView,
    mock_module_view: ModuleView,
    decoy: Decoy,
    model: ModuleModel,
) -> None:
    """It should raise if the labware is on a stacker module."""
    decoy.when(mock_labware_view.get("labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="test",
            definitionUri="def-uri",
            location=ModuleLocation(moduleId="module-id"),
        )
    )
    decoy.when(mock_module_view.get("module-id")).then_return(
        LoadedModule(id="module-id", model=model, location=None, serialNumber=None)
    )
    with pytest.raises(
        errors.LocationNotAccessibleByPipetteError, match="on a stacker shuttle"
    ):
        subject.raise_if_labware_inaccessible_by_pipette("labware-id")


def test_raise_if_labware_in_stacker_hopper(
    subject: GeometryView, mock_labware_view: LabwareView, decoy: Decoy
) -> None:
    """It should raise if the labware is in a stacker hopper."""
    decoy.when(mock_labware_view.get("labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="test",
            definitionUri="def-uri",
            location=InStackerHopperLocation(moduleId="module-id"),
        )
    )
    with pytest.raises(
        errors.LocationNotAccessibleByPipetteError, match="in a stacker hopper"
    ):
        subject.raise_if_labware_inaccessible_by_pipette("labware-id")
