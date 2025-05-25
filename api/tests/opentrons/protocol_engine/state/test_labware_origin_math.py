"""Test suite for _labware_origin_math.py module."""

import pytest
from unittest.mock import MagicMock
from opentrons.types import Point, DeckSlotName

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition2,
    LabwareDefinition3,
    Vector3D as LabwareDefinitionVector3D,
    Dimensions as LabwareDimensions,
    AxisAlignedBoundingBox3D,
    AxisAlignedBoundingBox2D,
    Vector3D,
    Vector2D,
    Extents,
)

from opentrons.protocol_engine.types import (
    LoadedLabware,
    AddressableArea,
    ModuleDefinition,
    Dimensions,
    AddressableOffsetVector,
    AreaType,
    DeckSlotLocation,
)

from opentrons.protocol_engine.state._labware_origin_math import (
    get_parent_origin_to_lw_origin,
)


_MOCK_LABWARE_DEF_2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    dimensions=LabwareDimensions(
        xDimension=1000.5,
        yDimension=2000.5,
        zDimension=3000.5,
    ),
    cornerOffsetFromSlot=LabwareDefinitionVector3D(
        x=100.5,
        y=200.5,
        z=300.5,
    ),
)


_MOCK_LABWARE_DEF_3 = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    dimensions=LabwareDimensions(
        xDimension=5000.5,
        yDimension=6000.5,
        zDimension=7000.5,
    ),
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=4000.5, y=-5000.5, z=6000.5),
        ),
        footprint=AxisAlignedBoundingBox2D(
            backLeft=Vector2D(x=0, y=0),
            frontRight=Vector2D(x=4000.5, y=-5000.5),
        ),
    ),
    locatingFeaturesAsParent={},
)


_MOCK_LABWARE_DEF_3_WITH_OFFSET = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    dimensions=LabwareDimensions(
        xDimension=8000.5,
        yDimension=9000.5,
        zDimension=10000.5,
    ),
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=100.25, y=200.75, z=300.125),
            frontRightTop=Vector3D(x=7100.75, y=-8300.25, z=9300.625),
        ),
        footprint=AxisAlignedBoundingBox2D(
            backLeft=Vector2D(x=100.25, y=200.75),
            frontRight=Vector2D(x=7100.75, y=-8300.25),
        ),
    ),
    locatingFeaturesAsParent={},
)


_MOCK_PARENT_LABWARE_DEF_3 = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    dimensions=LabwareDimensions(
        xDimension=11000.5,
        yDimension=12000.5,
        zDimension=13000.5,
    ),
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=10000.5, y=-11000.5, z=12000.5),
        ),
        footprint=AxisAlignedBoundingBox2D(
            backLeft=Vector2D(x=0, y=0),
            frontRight=Vector2D(x=10000.5, y=-11000.5),
        ),
    ),
    locatingFeaturesAsParent={},
)


_MOCK_PARENT_LABWARE_DEF_3_WITH_BACK_LEFT_BOTTOM_LF = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    dimensions=LabwareDimensions(
        xDimension=11000.5,
        yDimension=12000.5,
        zDimension=13000.5,
    ),
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=150.0, y=250.0, z=350.0),
            frontRightTop=Vector3D(x=10150.5, y=-10750.5, z=12350.5),
        ),
        footprint=AxisAlignedBoundingBox2D(
            backLeft=Vector2D(x=150.0, y=250.0),
            frontRight=Vector2D(x=10150.5, y=-10750.5),
        ),
    ),
    locatingFeaturesAsParent={"backLeftBottom": {}},
)


_MOCK_PARENT_LABWARE_DEF_3_WITH_RIGHT_CENTER_BOTTOM_LF = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    dimensions=LabwareDimensions(
        xDimension=11000.5,
        yDimension=12000.5,
        zDimension=13000.5,
    ),
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=200.0, y=300.0, z=400.0),
            frontRightTop=Vector3D(x=10200.5, y=-10700.5, z=12400.5),
        ),
        footprint=AxisAlignedBoundingBox2D(
            backLeft=Vector2D(x=200.0, y=300.0),
            frontRight=Vector2D(x=10200.5, y=-10700.5),
        ),
    ),
    locatingFeaturesAsParent={"rightCenterBottom": {}},
)


_MOCK_ADDRESSABLE_AREA = AddressableArea(
    area_name="test_area",
    area_type=AreaType.SLOT,
    base_slot=DeckSlotName.SLOT_A1,
    display_name="Test Area",
    bounding_box=Dimensions(x=14000.5, y=15000.5, z=16000.5),
    position=AddressableOffsetVector(x=0, y=0, z=0),
    compatible_module_types=[],
    locatingFeaturesAsParent=None,
)


_MOCK_ADDRESSABLE_AREA_WITH_BACK_LEFT_BOTTOM_LF = AddressableArea(
    area_name="test_area",
    area_type=AreaType.SLOT,
    base_slot=DeckSlotName.SLOT_A1,
    display_name="Test Area",
    bounding_box=Dimensions(x=14000.5, y=15000.5, z=16000.5),
    position=AddressableOffsetVector(x=0, y=0, z=0),
    compatible_module_types=[],
    locatingFeaturesAsParent={"backLeftBottom": {}},
)


_MOCK_ADDRESSABLE_AREA_WITH_RIGHT_CENTER_BOTTOM_LF = AddressableArea(
    area_name="test_area",
    area_type=AreaType.SLOT,
    base_slot=DeckSlotName.SLOT_A1,
    display_name="Test Area",
    bounding_box=Dimensions(x=14000.5, y=15000.5, z=16000.5),
    position=AddressableOffsetVector(x=0, y=0, z=0),
    compatible_module_types=[],
    locatingFeaturesAsParent={"rightCenterBottom": {}},
)


def _create_mock_module_definition() -> ModuleDefinition:
    """Create a mock ModuleDefinition."""
    mock_module_def = MagicMock(spec=ModuleDefinition)
    mock_dimensions = MagicMock()
    mock_dimensions.labwareInterfaceXDimension = 17000.5
    mock_dimensions.labwareInterfaceYDimension = 18000.5
    mock_module_def.dimensions = mock_dimensions
    mock_module_def.locatingFeaturesAsParent = None

    return mock_module_def


def _create_mock_module_definition_with_back_left_bottom_lf() -> ModuleDefinition:
    """Create a mock ModuleDefinition with back-left-bottom locating feature."""
    mock_module_def = MagicMock(spec=ModuleDefinition)
    mock_dimensions = MagicMock()
    mock_dimensions.labwareInterfaceXDimension = 17000.5
    mock_dimensions.labwareInterfaceYDimension = 18000.5
    mock_module_def.dimensions = mock_dimensions
    mock_module_def.locatingFeaturesAsParent = {"backLeftBottom": {}}

    return mock_module_def


def _create_mock_module_definition_with_right_center_bottom_lf() -> ModuleDefinition:
    """Create a mock ModuleDefinition with right-center-bottom locating feature."""
    mock_module_def = MagicMock(spec=ModuleDefinition)
    mock_dimensions = MagicMock()
    mock_dimensions.labwareInterfaceXDimension = 17000.5
    mock_dimensions.labwareInterfaceYDimension = 18000.5
    mock_module_def.dimensions = mock_dimensions
    mock_module_def.locatingFeaturesAsParent = {"rightCenterBottom": {}}

    return mock_module_def


def _create_loaded_labware(labware_id: str = "test-labware-id") -> LoadedLabware:
    """Create a LoadedLabware instance."""
    return LoadedLabware(
        id=labware_id,
        loadName="test_labware",
        definitionUri="test_uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
        offsetId=None,
    )


def test_labware_definition_2_offset() -> None:
    """Test that LabwareDefinition2 returns cornerOffsetFromSlot directly."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_2,
        lw_parent_location_info=_MOCK_ADDRESSABLE_AREA,
    )

    assert result == Point(100.5, 200.5, 300.5)


def test_labware_definition_2_parent_with_definition_3_child() -> None:
    """Test LabwareDefinition3 on LabwareDefinition2 parent."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_LABWARE_DEF_2,
    )

    assert result == Point(0, 0, 0)


def test_unsupported_parent_location_raises_error() -> None:
    """Test that unsupported parent location info raises ValueError."""
    loaded_labware = _create_loaded_labware()
    unsupported_parent = MagicMock()

    with pytest.raises(ValueError, match="Unsupported parent location info"):
        get_parent_origin_to_lw_origin(
            labware_data=loaded_labware,
            definition=_MOCK_LABWARE_DEF_3,
            lw_parent_location_info=unsupported_parent,
        )


def test_labware_definition_3_on_addressable_area_bottom_center() -> None:
    """Test LabwareDefinition3 on AddressableArea when the bottom-center locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_ADDRESSABLE_AREA,
    )

    assert result.x == pytest.approx(5000.0)
    assert result.y == pytest.approx(-5000)
    assert result.z == pytest.approx(0.0)


def test_labware_definition_3_on_module_bottom_center() -> None:
    """Test LabwareDefinition3 on ModuleDefinition when the bottom-center locating feature is used."""
    loaded_labware = _create_loaded_labware()
    module_def = _create_mock_module_definition()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=module_def,
    )

    assert result.x == pytest.approx(6500.0)
    assert result.y == pytest.approx(-6500)
    assert result.z == pytest.approx(0.0)


def test_labware_definition_3_on_labware_definition_3_bottom_center() -> None:
    """Test LabwareDefinition3 stacked on another LabwareDefinition3 when the bottom-center locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_PARENT_LABWARE_DEF_3,
    )

    assert result.x == pytest.approx(3000.0)
    assert result.y == pytest.approx(-3000)
    assert result.z == pytest.approx(0.0)


def test_labware_definition_3_with_offset_origin_bottom_center() -> None:
    """Test LabwareDefinition3 with non-zero back-left corner when the bottom-center locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3_WITH_OFFSET,
        lw_parent_location_info=_MOCK_ADDRESSABLE_AREA,
    )

    assert result.x == pytest.approx(3449.875)
    assert result.y == pytest.approx(-3350.125)
    assert result.z == pytest.approx(-300.125)


def test_labware_definition_3_on_addressable_area_back_left_bottom() -> None:
    """Test LabwareDefinition3 on AddressableArea when the back-left-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_ADDRESSABLE_AREA_WITH_BACK_LEFT_BOTTOM_LF,
    )

    assert result.x == pytest.approx(0.0)
    assert result.y == pytest.approx(15000.5)
    assert result.z == pytest.approx(0.0)


def test_labware_definition_3_on_module_back_left_bottom() -> None:
    """Test LabwareDefinition3 on ModuleDefinition when the back-left-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()
    module_def = _create_mock_module_definition_with_back_left_bottom_lf()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=module_def,
    )

    assert result.x == pytest.approx(0.0)
    assert result.y == pytest.approx(18000.5)
    assert result.z == pytest.approx(0.0)


def test_labware_definition_3_on_labware_definition_3_back_left_bottom() -> None:
    """Test LabwareDefinition3 stacked on another LabwareDefinition3 when the back-left-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_PARENT_LABWARE_DEF_3_WITH_BACK_LEFT_BOTTOM_LF,
    )

    assert result.x == pytest.approx(150.0)
    assert result.y == pytest.approx(250.0)
    assert result.z == pytest.approx(350.0)


def test_labware_definition_3_with_offset_on_labware_definition_3_back_left_bottom() -> (
    None
):
    """Test LabwareDefinition3 with offset on another LabwareDefinition3 when the back-left-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3_WITH_OFFSET,
        lw_parent_location_info=_MOCK_PARENT_LABWARE_DEF_3_WITH_BACK_LEFT_BOTTOM_LF,
    )

    assert result.x == pytest.approx(49.75)
    assert result.y == pytest.approx(49.25)
    assert result.z == pytest.approx(49.875)


def test_labware_definition_3_with_zero_offset_back_left_bottom() -> None:
    """Test LabwareDefinition3 with zero back-left-bottom offset when back-left-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_PARENT_LABWARE_DEF_3_WITH_BACK_LEFT_BOTTOM_LF,
    )

    assert result.x == pytest.approx(150.0)
    assert result.y == pytest.approx(250.0)
    assert result.z == pytest.approx(350.0)


# Right Center Bottom Locating Feature Tests


def test_labware_definition_3_on_addressable_area_right_center_bottom() -> None:
    """Test LabwareDefinition3 on AddressableArea when the right-center-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_ADDRESSABLE_AREA_WITH_RIGHT_CENTER_BOTTOM_LF,
    )

    assert result.x == pytest.approx(10000.0)
    assert result.y == pytest.approx(-5000.0)
    assert result.z == pytest.approx(0.0)


def test_labware_definition_3_on_module_right_center_bottom() -> None:
    """Test LabwareDefinition3 on ModuleDefinition when the right-center-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()
    module_def = _create_mock_module_definition_with_right_center_bottom_lf()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=module_def,
    )

    assert result.x == pytest.approx(13000.0)
    assert result.y == pytest.approx(-6500.0)
    assert result.z == pytest.approx(0.0)


def test_labware_definition_3_on_labware_definition_3_right_center_bottom() -> None:
    """Test LabwareDefinition3 stacked on another LabwareDefinition3 when the right-center-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_PARENT_LABWARE_DEF_3_WITH_RIGHT_CENTER_BOTTOM_LF,
    )

    assert result.x == pytest.approx(6200.0)
    assert result.y == pytest.approx(-2850.0)
    assert result.z == pytest.approx(400.0)


def test_labware_definition_3_with_offset_on_labware_definition_3_right_center_bottom() -> (
    None
):
    """Test LabwareDefinition3 with offset on another LabwareDefinition3 when the right-center-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3_WITH_OFFSET,
        lw_parent_location_info=_MOCK_PARENT_LABWARE_DEF_3_WITH_RIGHT_CENTER_BOTTOM_LF,
    )

    assert result.x == pytest.approx(3099.75)
    assert result.y == pytest.approx(-1200.125)
    assert result.z == pytest.approx(99.875)


def test_labware_definition_3_with_zero_offset_right_center_bottom() -> None:
    """Test LabwareDefinition3 with zero right-center-bottom offset when right-center-bottom locating feature is used."""
    loaded_labware = _create_loaded_labware()

    result = get_parent_origin_to_lw_origin(
        labware_data=loaded_labware,
        definition=_MOCK_LABWARE_DEF_3,
        lw_parent_location_info=_MOCK_PARENT_LABWARE_DEF_3_WITH_RIGHT_CENTER_BOTTOM_LF,
    )

    assert result.x == pytest.approx(6200.0)
    assert result.y == pytest.approx(-2850.0)
    assert result.z == pytest.approx(400.0)
