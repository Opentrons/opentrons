"""Tests for the legacy ModuleGeometry interface."""
import pytest
import mock

from typing import ContextManager, Any, Optional
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]
from contextlib import nullcontext as does_not_raise
from opentrons.types import Location, Point

from opentrons.hardware_control.modules.types import ModuleType, HeaterShakerModuleModel

from opentrons.protocols.api_support.deck_type import STANDARD_OT2_DECK
from opentrons.protocol_api.core.legacy.module_geometry import (
    create_geometry,
    ModuleGeometry,
    HeaterShakerGeometry,
    PipetteMovementRestrictedByHeaterShakerError,
)
from opentrons.protocol_api.core.legacy.deck import Deck

from opentrons_shared_data.module.dev_types import (
    ModuleDefinitionV3,
    ModuleDefinitionV1,
)


@pytest.fixture
def v1_mag_module_schema_v3_definition() -> ModuleDefinitionV3:
    """A Gen1 Magnetic Module's schemaV3 definition fixture."""
    return {
        "$otSharedSchema": "module/schemas/3",
        "moduleType": "magneticModuleType",
        "model": "magneticModuleV1",
        "labwareOffset": {"x": 11.0, "y": 22.0, "z": 33.0},
        "dimensions": {
            "bareOverallHeight": 123,
            "overLabwareHeight": 234,
            "xDimension": 345,
            "yDimension": 456,
        },
        "calibrationPoint": {"x": 111, "y": 222, "z": 333},
        "displayName": "Sample Module",
        "quirks": [],
        "slotTransforms": {},
        "compatibleWith": ["someSimilarModule"],  # type: ignore[list-item]
        "cornerOffsetFromSlot": {"x": 111, "y": 222, "z": 333},
        "twoDimensionalRendering": {},
        "config": {},
    }


@pytest.fixture
def minimal_heater_shaker_definition() -> ModuleDefinitionV3:
    """A Heater-shaker module's definition fixture."""
    return {
        "$otSharedSchema": "module/schemas/3",
        "moduleType": "heaterShakerModuleType",
        "model": "heaterShakerModuleV1",
        "labwareOffset": {"x": 11.0, "y": 22.0, "z": 33.0},
        "dimensions": {
            "bareOverallHeight": 123,
            "overLabwareHeight": 234,
            "xDimension": 345,
            "yDimension": 456,
        },
        "calibrationPoint": {"x": 111, "y": 222, "z": 333},
        "displayName": "Sample H/S Module",
        "quirks": [],
        "slotTransforms": {},
        "compatibleWith": ["someSimilarModule"],  # type: ignore[list-item]
        "cornerOffsetFromSlot": {"x": 111, "y": 222, "z": 333},
        "twoDimensionalRendering": {},
        "config": {},
    }


@pytest.fixture
def v1_mag_module_schema_v1_definition() -> ModuleDefinitionV1:
    """A Gen1 Magnetic Module's schemaV1 definition fixture."""
    return {
        "labwareOffset": {"x": 11.0, "y": 22.0, "z": 33.0},
        "dimensions": {"bareOverallHeight": 123, "overLabwareHeight": 321},
        "calibrationPoint": {"x": 44.0, "y": 55.0},
        "displayName": "Sample Old Module",
        "loadName": "magdeck",
        "quirks": [],
    }


@pytest.fixture
def heater_shaker_geometry() -> HeaterShakerGeometry:
    """Get a Heater-Shaker Geometry fixture."""
    heater_shaker_slot_location = Deck(deck_type=STANDARD_OT2_DECK).position_for(5)
    return HeaterShakerGeometry(
        display_name="A new shiny module!",
        model=HeaterShakerModuleModel.HEATER_SHAKER_V1,
        module_type=ModuleType.HEATER_SHAKER,
        offset=Point(0, 0, 0),
        overall_height=111,
        height_over_labware=222,
        parent=heater_shaker_slot_location,
    )


@pytest.fixture
def mock_location() -> mock.MagicMock:
    """Get a mocked out Location object."""
    return mock.MagicMock(return_value=Location(point=Point(1, 2, 3), labware=None))


@pytest.mark.parametrize(
    argnames=[
        "module_definition",
        "expected_geometry",
        "expected_parent_location",
        "expected_repr",
    ],
    argvalues=[
        (
            lazy_fixture("minimal_heater_shaker_definition"),
            HeaterShakerGeometry(
                parent=Location(Point(0, 0, 0), labware="5"),
                offset=Point(11, 22, 33),
                overall_height=123,
                height_over_labware=234,
                model=HeaterShakerModuleModel.HEATER_SHAKER_V1,
                module_type=ModuleType.HEATER_SHAKER,
                display_name="Sample H/S Module",
            ),
            "5",
            "Sample H/S Module on 5",
        ),
        (
            lazy_fixture("minimal_heater_shaker_definition"),
            HeaterShakerGeometry(
                parent=Location(Point(0, 0, 0), labware=None),
                offset=Point(11, 22, 33),
                overall_height=123,
                height_over_labware=234,
                model=HeaterShakerModuleModel.HEATER_SHAKER_V1,
                module_type=ModuleType.HEATER_SHAKER,
                display_name="Sample H/S Module",
            ),
            None,
            "Sample H/S Module",
        ),
    ],
)
def test_create_geometry(
    module_definition: ModuleDefinitionV3,
    expected_geometry: ModuleGeometry,
    expected_parent_location: Optional[str],
    expected_repr: str,
) -> None:
    """It should load an API-version-specific module from its definition."""
    load_result = create_geometry(
        definition=module_definition,
        parent=Location(point=Point(0, 0, 0), labware=expected_parent_location),
        configuration=None,
    )
    assert isinstance(load_result, expected_geometry.__class__)
    assert load_result.parent == expected_geometry.parent
    assert load_result.module_type == expected_geometry.module_type
    assert load_result.model == expected_geometry.model
    assert load_result.labware_offset == expected_geometry.labware_offset
    assert load_result.highest_z == expected_geometry.highest_z
    assert str(load_result) == expected_repr


def test_create_geometry_raises(
    v1_mag_module_schema_v3_definition: ModuleDefinitionV3,
) -> None:
    """It raises when an invalid definition is passed."""
    v1_mag_module_schema_v3_definition.update({"moduleType": "blahblahModuleType"})  # type: ignore[typeddict-item]

    with pytest.raises(ValueError):
        create_geometry(
            definition=v1_mag_module_schema_v3_definition,
            parent=Location(point=Point(0, 0, 0), labware=None),
            configuration=None,
        )


def test_heater_shaker_geometry_properties() -> None:
    """It should initialize a heater-shaker geometry instance with all properties."""
    subject = HeaterShakerGeometry(
        display_name="A new shiny module!",
        model=HeaterShakerModuleModel.HEATER_SHAKER_V1,
        module_type=ModuleType.HEATER_SHAKER,
        offset=Point(0, 0, 0),
        overall_height=111,
        height_over_labware=222,
        parent=Location(point=Point(1, 2, 3), labware=None),
    )
    assert subject.model == HeaterShakerModuleModel.HEATER_SHAKER_V1
    assert subject.labware is None
    assert subject.location.point == Point(1, 2, 3)


@pytest.mark.parametrize(
    argnames=["destination_slot", "expected_raise"],
    argvalues=[
        [
            4,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # east
        [
            6,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # west
        [
            8,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # north
        [
            2,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # south
        [
            5,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # h/s
        [1, does_not_raise()],  # non-adjacent
    ],
)
def test_hs_raises_when_moving_to_restricted_slots_while_shaking(
    heater_shaker_geometry: HeaterShakerGeometry,
    destination_slot: int,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while module is shaking."""
    with expected_raise:
        heater_shaker_geometry.flag_unsafe_move(
            to_slot=destination_slot,
            is_tiprack=False,
            is_using_multichannel=False,
            is_labware_latch_closed=True,
            is_plate_shaking=True,
        )


@pytest.mark.parametrize(
    argnames=["destination_slot", "expected_raise"],
    argvalues=[
        [
            4,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # east
        [
            6,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # west
        [
            5,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # h/s
        [8, does_not_raise()],  # north
        [2, does_not_raise()],  # south
        [3, does_not_raise()],  # non-adjacent
    ],
)
def test_raises_when_moving_to_restricted_slots_while_latch_open(
    heater_shaker_geometry: HeaterShakerGeometry,
    destination_slot: int,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while latch is open."""
    with expected_raise:
        heater_shaker_geometry.flag_unsafe_move(
            to_slot=destination_slot,
            is_tiprack=False,
            is_using_multichannel=False,
            is_labware_latch_closed=False,
            is_plate_shaking=False,
        )


@pytest.mark.parametrize(
    argnames=["destination_slot", "is_tiprack", "expected_raise"],
    argvalues=[
        [
            4,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="left or right"
            ),
        ],  # east
        [
            6,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="left or right"
            ),
        ],  # west
        [
            8,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError,
                match="non-tip-rack labware",
            ),
        ],  # north, non-tiprack
        [
            2,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError,
                match="non-tip-rack labware",
            ),
        ],  # south, non-tiprack
        [8, True, does_not_raise()],  # north, tiprack
        [2, True, does_not_raise()],  # south, tiprack
        [5, False, does_not_raise()],  # h/s
        [7, False, does_not_raise()],  # non-adjacent
    ],
)
def test_raises_on_restricted_movement_with_multi_channel(
    heater_shaker_geometry: HeaterShakerGeometry,
    destination_slot: int,
    is_tiprack: bool,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted with a multi-channel pipette."""
    with expected_raise:
        heater_shaker_geometry.flag_unsafe_move(
            to_slot=destination_slot,
            is_tiprack=is_tiprack,
            is_using_multichannel=True,
            is_labware_latch_closed=True,
            is_plate_shaking=False,
        )


@pytest.mark.parametrize(
    argnames=["destination_slot"],
    argvalues=[
        [4],  # east
        [6],  # west
        [5],  # h/s
        [8],  # north
        [2],  # south
        [9],  # non-adjacent
    ],
)
def test_does_not_raise_when_idle_and_latch_closed(
    heater_shaker_geometry: HeaterShakerGeometry,
    destination_slot: int,
) -> None:
    """It should not raise if single channel pipette moves anywhere near heater-shaker when idle and latch closed."""
    with does_not_raise():
        heater_shaker_geometry.flag_unsafe_move(
            to_slot=destination_slot,
            is_tiprack=False,
            is_using_multichannel=False,
            is_labware_latch_closed=True,
            is_plate_shaking=False,
        )


@pytest.mark.parametrize(
    argnames=["pipette_slot", "expected_is_blocking"],
    argvalues=[
        ("4", True),
        ("6", True),
        ("2", True),
        ("5", True),
        ("8", True),
        (None, True),
        ("1", False),
    ],
)
def test_pipette_is_blocking_shake_movement(
    heater_shaker_geometry: HeaterShakerGeometry,
    mock_location: mock.MagicMock,
    pipette_slot: Optional[str],
    expected_is_blocking: bool,
) -> None:
    """It should return True if pipette is blocking shake movement."""
    mock_location.labware.first_parent = mock.MagicMock(return_value=pipette_slot)

    assert (
        heater_shaker_geometry.is_pipette_blocking_shake_movement(
            pipette_location=mock_location
        )
        == expected_is_blocking
    )


@pytest.mark.parametrize(
    argnames=["pipette_slot", "expected_is_blocking"],
    argvalues=[("4", True), ("6", True), ("2", False), (None, True), ("1", False)],
)
def test_pipette_is_blocking_latch_movement(
    heater_shaker_geometry: HeaterShakerGeometry,
    mock_location: mock.MagicMock,
    pipette_slot: Optional[str],
    expected_is_blocking: bool,
) -> None:
    """It should return True if pipette is blocking latch movement."""
    mock_location.labware.first_parent = mock.MagicMock(return_value=pipette_slot)

    assert (
        heater_shaker_geometry.is_pipette_blocking_latch_movement(
            pipette_location=mock_location
        )
        == expected_is_blocking
    )


def test_pipette_is_blocking_shake_and_latch_movements_with_no_pipette_slot(
    heater_shaker_geometry: HeaterShakerGeometry,
    mock_location: mock.MagicMock,
) -> None:
    """It should return True if pipette's last location slot is not known."""
    assert (
        heater_shaker_geometry.is_pipette_blocking_shake_movement(
            pipette_location=Location(point=Point(3, 2, 1), labware=None)
        )
        is True
    )
    assert (
        heater_shaker_geometry.is_pipette_blocking_latch_movement(
            pipette_location=Location(point=Point(3, 2, 1), labware=None)
        )
        is True
    )
