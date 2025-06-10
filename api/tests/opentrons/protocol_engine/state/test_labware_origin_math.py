"""Test suite for _labware_origin_math.py module."""
from typing import NamedTuple, List
import pytest

from opentrons.protocols.api_support.deck_type import (
    STANDARD_OT2_DECK,
    STANDARD_OT3_DECK,
)
from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition2,
    LabwareDefinition3,
    Vector3D,
    Extents,
    AxisAlignedBoundingBox3D,
    AxisAlignedBoundingBox2D,
    Vector2D,
    Dimensions,
)
from opentrons_shared_data.deck.types import DeckDefinitionV5

from opentrons.types import Point
from opentrons.protocol_engine.state._labware_origin_math import (
    get_parent_origin_to_lw_origin,
)
from opentrons.protocol_engine.types import (
    ModuleModel,
    ModuleDefinition,
    ModuleDimensions,
    AddressableArea,
    AreaType,
    AddressableOffsetVector,
    Dimensions as AddressableAreaDimensions,
)
from opentrons.types import DeckSlotName


_LABWARE_DEF_V2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=150, y=250, z=350),
    stackingOffsetWithModule={},
)

_LABWARE_DEF_V2_WITH_MODULE_STACKING = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=150, y=250, z=350),
    stackingOffsetWithModule={
        str(ModuleModel.TEMPERATURE_MODULE_V2.value): Vector3D(x=50, y=100, z=150),
        str(ModuleModel.THERMOCYCLER_MODULE_V1.value): Vector3D(x=200, y=300, z=400),
        str(ModuleModel.THERMOCYCLER_MODULE_V2.value): Vector3D(x=500, y=600, z=700),
    },
)

_LABWARE_DEF_V2_WITH_LABWARE_STACKING = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=200, y=300, z=400),
    stackingOffsetWithLabware={
        "labware-name": Vector3D(x=50, y=100, z=150),
        "default": Vector3D(x=250, y=350, z=450),
    },
)

_LABWARE_DEF_V3 = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=100, y=200, z=300),
            frontRightTop=Vector3D(x=1100, y=-800, z=1300),
        ),
        footprint=AxisAlignedBoundingBox2D(
            backLeft=Vector2D(x=100, y=200),
            frontRight=Vector2D(x=1100, y=-800),
        ),
    ),
)

_LABWARE_DEF_V2_2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    dimensions=Dimensions(xDimension=1000, yDimension=1200, zDimension=750),
    parameters=type("MockParams", (), {"loadName": "labware-name"})(),
)

_LABWARE_DEF_V2_UNKNOWN = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    dimensions=Dimensions(xDimension=800, yDimension=900, zDimension=1000),
    parameters=type("MockParams", (), {"loadName": "unknown-labware-name"})(),
)

_MODULE_DEF_TEMP_V2 = ModuleDefinition.model_construct(  # type: ignore[call-arg]
    schemaVersion=2,
    model=ModuleModel.TEMPERATURE_MODULE_V2,
    dimensions=ModuleDimensions(
        bareOverallHeight=500,
        overLabwareHeight=600,
    ),
)

_MODULE_DEF_TC_V1 = ModuleDefinition.model_construct(  # type: ignore[call-arg]
    schemaVersion=2,
    model=ModuleModel.THERMOCYCLER_MODULE_V1,
    dimensions=ModuleDimensions(
        bareOverallHeight=800,
        overLabwareHeight=900,
    ),
)

_MODULE_DEF_TC_V2 = ModuleDefinition.model_construct(  # type: ignore[call-arg]
    schemaVersion=2,
    model=ModuleModel.THERMOCYCLER_MODULE_V2,
    dimensions=ModuleDimensions(
        bareOverallHeight=1000,
        overLabwareHeight=1100,
    ),
)

_ADDRESSABLE_AREA = AddressableArea(
    area_name="test_area",
    area_type=AreaType.SLOT,
    base_slot=DeckSlotName.SLOT_A1,
    display_name="Test Area",
    bounding_box=AddressableAreaDimensions(x=1000, y=1500, z=2000),
    position=AddressableOffsetVector(x=0, y=0, z=0),
    compatible_module_types=[],
)


class ModuleOverlapSpec(NamedTuple):
    """Spec data to test module overlap behavior through get_parent_origin_to_lw_origin."""

    spec_deck_definition: DeckDefinitionV5
    module_definition: ModuleDefinition
    child_definition: LabwareDefinition2
    parent_as_module_to_child_offset: Point
    expected_total_offset: Point


class LabwareOverlapSpec(NamedTuple):
    """Spec data to test labware stacking behavior through get_parent_origin_to_lw_origin."""

    child_definition: LabwareDefinition2
    parent_definition: LabwareDefinition2
    expected_total_offset: Point


class AddressableAreaSpec(NamedTuple):
    """Spec data to test addressable area behavior through get_parent_origin_to_lw_origin."""

    child_definition: LabwareDefinition2
    addressable_area: AddressableArea
    expected_total_offset: Point


MODULE_OVERLAP_SPECS: List[ModuleOverlapSpec] = [
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT2_DECK, 5),
        module_definition=_MODULE_DEF_TEMP_V2,
        child_definition=_LABWARE_DEF_V2_WITH_MODULE_STACKING,
        parent_as_module_to_child_offset=Point(x=450, y=550, z=650),
        expected_total_offset=Point(x=550, y=700, z=850),
    ),
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT2_DECK, 5),
        module_definition=_MODULE_DEF_TC_V1,
        child_definition=_LABWARE_DEF_V2_WITH_MODULE_STACKING,
        parent_as_module_to_child_offset=Point(x=450, y=550, z=650),
        expected_total_offset=Point(x=400, y=500, z=600),
    ),
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT2_DECK, 5),
        module_definition=_MODULE_DEF_TC_V2,
        child_definition=_LABWARE_DEF_V2,
        parent_as_module_to_child_offset=Point(x=450, y=550, z=650),
        expected_total_offset=Point(x=600, y=800, z=989.3),
    ),
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_definition=_MODULE_DEF_TC_V2,
        child_definition=_LABWARE_DEF_V2,
        parent_as_module_to_child_offset=Point(x=450, y=550, z=650),
        expected_total_offset=Point(x=600, y=800, z=1000),
    ),
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_definition=_MODULE_DEF_TC_V2,
        child_definition=_LABWARE_DEF_V2_WITH_MODULE_STACKING,
        parent_as_module_to_child_offset=Point(x=450, y=550, z=650),
        expected_total_offset=Point(x=100, y=200, z=300),
    ),
]

LABWARE_OVERLAP_SPECS: List[LabwareOverlapSpec] = [
    LabwareOverlapSpec(
        child_definition=_LABWARE_DEF_V2_WITH_LABWARE_STACKING,
        parent_definition=_LABWARE_DEF_V2_2,
        expected_total_offset=Point(x=250, y=400, z=1000),
    ),
    LabwareOverlapSpec(
        child_definition=_LABWARE_DEF_V2_WITH_LABWARE_STACKING,
        parent_definition=_LABWARE_DEF_V2_UNKNOWN,
        expected_total_offset=Point(x=450, y=650, z=950),
    ),
]

ADDRESSABLE_AREA_SPECS: List[AddressableAreaSpec] = [
    AddressableAreaSpec(
        child_definition=_LABWARE_DEF_V2,
        addressable_area=_ADDRESSABLE_AREA,
        expected_total_offset=Point(x=150, y=250, z=350),
    ),
]


@pytest.mark.parametrize(
    argnames=ModuleOverlapSpec._fields,
    argvalues=MODULE_OVERLAP_SPECS,
)
def test_get_parent_origin_to_lw_origin_with_module(
    spec_deck_definition: DeckDefinitionV5,
    module_definition: ModuleDefinition,
    child_definition: LabwareDefinition2,
    parent_as_module_to_child_offset: Point,
    expected_total_offset: Point,
) -> None:
    """It should calculate the correct offset from module parent to labware origin."""
    result = get_parent_origin_to_lw_origin(
        definition=child_definition,
        parent_def=module_definition,
        default_module_stacking_offset=parent_as_module_to_child_offset,
        deck_definition=spec_deck_definition,
    )

    assert result == expected_total_offset


@pytest.mark.parametrize(
    argnames=LabwareOverlapSpec._fields,
    argvalues=LABWARE_OVERLAP_SPECS,
)
def test_get_parent_origin_to_lw_origin_with_labware(
    child_definition: LabwareDefinition2,
    parent_definition: LabwareDefinition2,
    expected_total_offset: Point,
) -> None:
    """It should calculate the correct offset from labware parent to labware origin."""
    result = get_parent_origin_to_lw_origin(
        definition=child_definition,
        parent_def=parent_definition,
        default_module_stacking_offset=None,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
    )

    assert result == expected_total_offset


@pytest.mark.parametrize(
    argnames=AddressableAreaSpec._fields,
    argvalues=ADDRESSABLE_AREA_SPECS,
)
def test_get_parent_origin_to_lw_origin_with_addressable_area(
    child_definition: LabwareDefinition2,
    addressable_area: AddressableArea,
    expected_total_offset: Point,
) -> None:
    """It should calculate the correct offset from addressable area to labware origin."""
    result = get_parent_origin_to_lw_origin(
        definition=child_definition,
        parent_def=addressable_area,
        default_module_stacking_offset=None,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
    )

    assert result == expected_total_offset


def test_get_parent_origin_to_lw_origin_v3_definition() -> None:
    """It should handle LabwareDefinition3 correctly."""
    result = get_parent_origin_to_lw_origin(
        definition=_LABWARE_DEF_V3,
        parent_def=_ADDRESSABLE_AREA,
        default_module_stacking_offset=None,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
    )

    expected_offset = Point(x=-100, y=800, z=-300)
    assert result == expected_offset


def test_get_parent_origin_to_lw_origin_module_without_offset_raises_error() -> None:
    """It should raise ValueError when module parent is provided without parent_as_module_to_child_offset."""
    with pytest.raises(ValueError, match="Expected parent_as_module_to_child_offset"):
        get_parent_origin_to_lw_origin(
            definition=_LABWARE_DEF_V2,
            parent_def=_MODULE_DEF_TEMP_V2,
            default_module_stacking_offset=None,
            deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        )
