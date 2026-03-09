"""Test suite for _labware_origin_math.py module."""

from typing import List, NamedTuple, Optional

import pytest

from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.types import DeckDefinitionV5
from opentrons_shared_data.labware.labware_definition import (
    AxisAlignedBoundingBox3D,
    Dimensions,
    Extents,
    GripperOffsets,
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
    LabwareRole,
    Parameters2,
    Parameters3,
    Vector3D,
)
from opentrons_shared_data.labware.types import (
    FlatSupportThermalCouplingAsChildFeature,
    HeaterShakerUniversalFlatAdapterFeature,
    LocatingFeatures,
    OpentronsFlexTipRackLidAsChildFeature,
    OpentronsFlexTipRackLidAsParentFeature,
    ScrewAnchoredAsChildFeature,
    ScrewAnchoredAsParentFeature,
    SlotFootprintAsChildFeature,
    SlotFootprintAsParentFeature,
    Vector2D,
)
from opentrons_shared_data.module.types import ModuleOrientation

from opentrons.protocol_engine.state.labware_origin_math.errors import (
    InvalidLabwarePlacementError,
)
from opentrons.protocol_engine.state.labware_origin_math.stackup_origin_to_labware_origin import (
    LabwareOriginContext,
    LabwareStackupAncestorDefinition,
    get_stackup_origin_to_labware_origin,
)
from opentrons.protocol_engine.types import (
    AddressableArea,
    AddressableAreaLocation,
    AddressableOffsetVector,
    AreaType,
    DeckSlotLocation,
    LabwareLocation,
    LabwareMovementOffsetData,
    LabwareOffsetVector,
    ModuleDefinition,
    ModuleDimensions,
    ModuleLocation,
    ModuleModel,
    OnLabwareLocation,
)
from opentrons.protocol_engine.types import (
    Dimensions as AddressableAreaDimensions,
)
from opentrons.protocols.api_support.deck_type import (
    STANDARD_OT2_DECK,
    STANDARD_OT3_DECK,
)
from opentrons.types import DeckSlotName, Point

# Test fixtures for labware definitions
_LW_V2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=150, y=250, z=350),
    stackingOffsetWithModule={},
    gripperOffsets={
        "default": GripperOffsets(
            pickUpOffset=Vector3D(x=100, y=200, z=300),
            dropOffset=Vector3D(x=300, y=200, z=100),
        ),
    },
    stackingOffsetWithLabware={
        "labware-name": Vector3D(x=0, y=0, z=0),
        "default": Vector3D(x=0, y=0, z=0),
        "adapter-labware": Vector3D(x=0, y=0, z=0),
    },
    dimensions=Dimensions(xDimension=1000, yDimension=1200, zDimension=750),
    parameters=Parameters2.model_construct(loadName="labware-name"),  # type: ignore[call-arg]
)

_LW_V2_WITH_MODULE_STACKING = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=150, y=250, z=350),
    stackingOffsetWithModule={
        str(ModuleModel.TEMPERATURE_MODULE_V2.value): Vector3D(x=50, y=100, z=150),
        str(ModuleModel.THERMOCYCLER_MODULE_V1.value): Vector3D(x=200, y=300, z=400),
        str(ModuleModel.THERMOCYCLER_MODULE_V2.value): Vector3D(x=500, y=600, z=700),
    },
    gripperOffsets={},
)

_LW_V2_WITH_LABWARE_STACKING = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=200, y=300, z=400),
    stackingOffsetWithLabware={
        "labware-name": Vector3D(x=50, y=100, z=150),
        "default": Vector3D(x=250, y=350, z=450),
    },
    gripperOffsets={},
)

_LW_V2_WITH_DEFAULT_GRIPPER_OFFSETS = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=0, y=0, z=0),
    stackingOffsetWithModule={},
    dimensions=Dimensions(xDimension=1000, yDimension=1200, zDimension=750),
    gripperOffsets={
        "default": GripperOffsets(
            pickUpOffset=Vector3D(x=10, y=20, z=30),
            dropOffset=Vector3D(x=40, y=50, z=60),
        )
    },
    stackingOffsetWithLabware={
        "labware-name": Vector3D(x=50, y=100, z=150),
        "default": Vector3D(x=250, y=350, z=450),
    },
    parameters=Parameters2.model_construct(loadName="labware-name"),  # type: ignore[call-arg]
)

_LW_V2_WITH_SLOT_SPECIFIC_GRIPPER_OFFSETS = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=0, y=0, z=0),
    stackingOffsetWithLabware={"default": Vector3D(x=0, y=0, z=0)},
    stackingOffsetWithModule={},
    dimensions=Dimensions(xDimension=1000, yDimension=1200, zDimension=750),
    gripperOffsets={
        "A1": GripperOffsets(
            pickUpOffset=Vector3D(x=111, y=222, z=333),
            dropOffset=Vector3D(x=333, y=222, z=111),
        ),
    },
    parameters=Parameters2.model_construct(loadName="adapter-labware"),  # type: ignore[call-arg]
)

_LW_V2_2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    dimensions=Dimensions(xDimension=1000, yDimension=1200, zDimension=750),
    parameters=Parameters2.model_construct(loadName="labware-name"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V2_3 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    dimensions=Dimensions(
        xDimension=800,
        yDimension=900,
        zDimension=1000,
    ),
    parameters=Parameters3.model_construct(loadName="unknown-labware-name"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_TC_LID_V2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=0, y=0, z=0),
    stackingOffsetWithLabware={"default": Vector3D(x=0, y=0, z=0)},
    dimensions=Dimensions(xDimension=1000, yDimension=1200, zDimension=750),
    stackingOffsetWithModule={},
    parameters=Parameters2.model_construct(loadName="tc_lid"),  # type: ignore[call-arg]
    allowedRoles=[LabwareRole.lid],
    gripperOffsets={
        "lidOffsets": GripperOffsets(
            pickUpOffset=Vector3D(x=5, y=10, z=15),
            dropOffset=Vector3D(x=5, y=10, z=15),  # Intentionally same as pickup
        )
    },
)

_AR_LID_V2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    cornerOffsetFromSlot=Vector3D(x=0, y=0, z=0),
    stackingOffsetWithLabware={"default": Vector3D(x=0, y=0, z=0)},
    dimensions=Dimensions(xDimension=1000, yDimension=1200, zDimension=750),
    stackingOffsetWithModule={},
    parameters=Parameters2.model_construct(
        loadName="opentrons_flex_lid_absorbance_plate_reader_module"
    ),  # type: ignore[call-arg]
    gripperOffsets={
        "default": GripperOffsets(
            pickUpOffset=Vector3D(x=7, y=14, z=21),
            dropOffset=Vector3D(x=28, y=35, z=42),
        )
    },
)

_LW_V3 = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=100, y=200, z=300),
            frontRightTop=Vector3D(x=1100, y=-800, z=1300),
        ),
    ),
    features=LocatingFeatures(
        slotFootprintAsChild=SlotFootprintAsChildFeature(
            backLeft=Vector2D(x=-10, y=5), frontRight=Vector2D(x=30, y=-20), z=0
        )
    ),
    parameters=Parameters3.model_construct(loadName="labware-v3-basic"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_SLOT_FP_AS_CHILD_FEATURE = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=50, y=100, z=150),
            frontRightTop=Vector3D(x=850, y=-500, z=950),
        ),
    ),
    features=LocatingFeatures(
        slotFootprintAsChild=SlotFootprintAsChildFeature(
            backLeft=Vector2D(x=0, y=0), frontRight=Vector2D(x=80, y=60), z=5
        )
    ),
    legacyStackingOffsetWithLabware={
        "default": Vector3D(x=0, y=0, z=0),
    },
    parameters=Parameters3.model_construct(loadName="labware-v3-child"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_SLOT_FP_AS_PARENT_FEATURE = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=1000, y=800, z=200),
        ),
    ),
    features=LocatingFeatures(
        slotFootprintAsParent=SlotFootprintAsParentFeature(
            backLeft=Vector2D(x=0, y=0), frontRight=Vector2D(x=120, y=90), z=10
        )
    ),
    parameters=Parameters3.model_construct(loadName="parent-labware-v3"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_SLOT_AS_PARENT_CHILD_FEATURES = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=20, y=30, z=40),
            frontRightTop=Vector3D(x=820, y=-470, z=840),
        ),
    ),
    features=LocatingFeatures(
        slotFootprintAsChild=SlotFootprintAsChildFeature(
            backLeft=Vector2D(x=10, y=15), frontRight=Vector2D(x=70, y=45), z=8
        ),
        slotFootprintAsParent=SlotFootprintAsParentFeature(
            backLeft=Vector2D(x=0, y=0), frontRight=Vector2D(x=100, y=80), z=12
        ),
    ),
    parameters=Parameters3.model_construct(loadName="dual-feature-labware"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_FLEX_TIP_RACK_LID_AS_PARENT = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=1000, y=800, z=50),
        ),
    ),
    features=LocatingFeatures(
        opentronsFlexTipRackLidAsParent=OpentronsFlexTipRackLidAsParentFeature(
            matingZ=25
        )
    ),
    parameters=Parameters3.model_construct(loadName="flex-tip-rack-lid-parent"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_FLEX_TIP_RACK_LID_AS_CHILD = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=10, y=20, z=30),
            frontRightTop=Vector3D(x=810, y=-580, z=830),
        ),
    ),
    features=LocatingFeatures(
        opentronsFlexTipRackLidAsChild=OpentronsFlexTipRackLidAsChildFeature(matingZ=15)
    ),
    stackingOffsetWithLabware={
        "default": Vector3D(x=0, y=0, z=0),
    },
    parameters=Parameters3.model_construct(loadName="flex-tip-rack-lid-child"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_HS_FLAT_ADAPTER = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=1000, y=800, z=100),
        ),
    ),
    features=LocatingFeatures(
        heaterShakerUniversalFlatAdapter=HeaterShakerUniversalFlatAdapterFeature(
            flatSupportThermalCouplingZ=50,
            deckLeft={"wallX": 10, "screwCenter": {"x": 100, "y": 300, "z": 10}},
            deckRight={"wallX": -10, "screwCenter": {"x": 500, "y": 700, "z": 50}},
        )
    ),
    parameters=Parameters3.model_construct(loadName="hs-flat-adapter-parent"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_FLAT_WELL_SUPPORT = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=800, y=600, z=200),
        ),
    ),
    features=LocatingFeatures(
        flatSupportThermalCouplingAsChild=FlatSupportThermalCouplingAsChildFeature(
            wellExteriorBottomZ=25
        )
    ),
    stackingOffsetWithLabware={
        "default": Vector3D(x=0, y=0, z=0),
    },
    parameters=Parameters3.model_construct(loadName="flat-well-support-child"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_SCREW_ANCHORED_AS_PARENT = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=1000, y=800, z=100),
        ),
    ),
    features=LocatingFeatures(
        screwAnchoredAsParent=ScrewAnchoredAsParentFeature(
            screwCenter={"x": 500, "y": 400, "z": 20}
        )
    ),
    parameters=Parameters3.model_construct(loadName="screw-anchored-parent"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_SCREW_ANCHORED_AS_CHILD = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=800, y=600, z=200),
        ),
    ),
    features=LocatingFeatures(
        screwAnchoredAsChild=ScrewAnchoredAsChildFeature(
            screwCenter={"x": 400, "y": 300, "z": 10}
        )
    ),
    stackingOffsetWithLabware={
        "default": Vector3D(x=0, y=0, z=0),
    },
    parameters=Parameters3.model_construct(loadName="screw-anchored-child"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_LEGACY_STACKING = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=75, y=125, z=175),
            frontRightTop=Vector3D(x=875, y=-475, z=975),
        ),
    ),
    features=LocatingFeatures(
        slotFootprintAsChild=SlotFootprintAsChildFeature(
            backLeft=Vector2D(x=5, y=10), frontRight=Vector2D(x=85, y=50), z=3
        )
    ),
    legacyStackingOffsetWithLabware={
        "labware-name": Vector3D(x=25, y=35, z=45),
        "default": Vector3D(x=125, y=225, z=325),
    },
    parameters=Parameters3.model_construct(loadName="labware-v3-with-legacy-stacking"),  # type: ignore[call-arg]
    gripperOffsets={},
)

_LW_V3_WITH_GRIPPER_OFFSETS = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=75, y=125, z=175),
            frontRightTop=Vector3D(x=875, y=-475, z=975),
        ),
    ),
    features=LocatingFeatures(
        slotFootprintAsChild=SlotFootprintAsChildFeature(
            backLeft=Vector2D(x=5, y=10), frontRight=Vector2D(x=85, y=50), z=3
        )
    ),
    legacyStackingOffsetWithLabware={
        "default": Vector3D(x=125, y=225, z=325),
    },
    gripperOffsets={
        "default": GripperOffsets(
            pickUpOffset=Vector3D(x=15, y=25, z=35),
            dropOffset=Vector3D(x=45, y=55, z=65),
        )
    },
    parameters=Parameters3.model_construct(loadName="labware-v3-with-gripper"),  # type: ignore[call-arg]
)

# Module definitions
_MODULE_DEF_TEMP_V2 = ModuleDefinition.model_construct(  # type: ignore[call-arg]
    schemaVersion=2,
    model=ModuleModel.TEMPERATURE_MODULE_V2,
    dimensions=ModuleDimensions(
        bareOverallHeight=500,
        overLabwareHeight=600,
        labwareInterfaceXDimension=1000,
        labwareInterfaceYDimension=700,
    ),
    gripperOffsets={},
    orientation={
        "3": "right",
        "6": "right",
        "9": "right",
        "A1": "left",
        "A3": "right",
        "B1": "left",
        "B3": "right",
        "C1": "left",
        "C3": "right",
        "D1": "left",
        "D3": "right",
    },
)

_MODULE_DEF_HS = ModuleDefinition.model_construct(  # type: ignore[call-arg]
    schemaVersion=2,
    model=ModuleModel.HEATER_SHAKER_MODULE_V1,
    dimensions=ModuleDimensions(
        bareOverallHeight=500,
        overLabwareHeight=600,
        labwareInterfaceXDimension=1000,
        labwareInterfaceYDimension=700,
    ),
    gripperOffsets={},
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=-18, y=1.8, z=0),
            frontRightTop=Vector3D(x=138.25, y=-89.95, z=82),
        )
    ),
    orientation={
        "3": "right",
        "6": "right",
        "9": "right",
        "A1": "left",
        "A3": "right",
        "B1": "left",
        "B3": "right",
        "C1": "left",
        "C3": "right",
        "D1": "left",
        "D3": "right",
    },
    features={"screwAnchoredAsParent": {"screwCenter": {"x": 64, "y": 43, "z": 0}}},
)

_MODULE_DEF_WITH_GRIPPER_OFFSETS = ModuleDefinition.model_construct(  # type: ignore[call-arg]
    schemaVersion=2,
    model=ModuleModel.HEATER_SHAKER_MODULE_V1,
    dimensions=ModuleDimensions(
        bareOverallHeight=500,
        overLabwareHeight=600,
        labwareInterfaceXDimension=1000,
        labwareInterfaceYDimension=700,
    ),
    gripperOffsets={
        "default": LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=11, y=22, z=33),
            dropOffset=LabwareOffsetVector(x=33, y=22, z=11),
        )
    },
    orientation={
        "3": "right",
        "6": "right",
        "9": "right",
        "A1": "left",
        "A3": "right",
        "B1": "left",
        "B3": "right",
        "C1": "left",
        "C3": "right",
        "D1": "left",
        "D3": "right",
    },
)

_MODULE_DEF_TC_V2 = ModuleDefinition.model_construct(  # type: ignore[call-arg]
    schemaVersion=2,
    model=ModuleModel.THERMOCYCLER_MODULE_V2,
    dimensions=ModuleDimensions(
        bareOverallHeight=1000,
        overLabwareHeight=1100,
    ),
    gripperOffsets={},
    orientation={"B1": "left"},
)

_ADDRESSABLE_AREA = AddressableArea(
    area_name="test_area",
    area_type=AreaType.SLOT,
    base_slot=DeckSlotName.SLOT_A1,
    display_name="Test Area",
    bounding_box=AddressableAreaDimensions(x=1000, y=1500, z=2000),
    position=AddressableOffsetVector(x=0, y=0, z=0),
    compatible_module_types=[],
    features=LocatingFeatures(),
    mating_surface_unit_vector=[-1, 1, -1],
    orientation=ModuleOrientation.NOT_APPLICABLE,
)

_ADDRESSABLE_AREA_WITH_PARENT_FEATURES = AddressableArea(
    area_name="test_area_with_parent",
    area_type=AreaType.SLOT,
    base_slot=DeckSlotName.SLOT_A2,
    display_name="Test Area with Parent Features",
    bounding_box=AddressableAreaDimensions(x=1200, y=1600, z=2200),
    position=AddressableOffsetVector(x=100, y=200, z=300),
    compatible_module_types=[],
    features=LocatingFeatures(
        slotFootprintAsParent=SlotFootprintAsParentFeature(
            backLeft=Vector2D(x=0, y=0), frontRight=Vector2D(x=150, y=120), z=15
        )
    ),
    mating_surface_unit_vector=[-1, 1, -1],
    orientation=ModuleOrientation.NOT_APPLICABLE,
)

_ADDRESSABLE_AREA_WITH_FLEX_TIP_RACK_LID = AddressableArea(
    area_name="test_area_with_flex_lid",
    area_type=AreaType.SLOT,
    base_slot=DeckSlotName.SLOT_A3,
    display_name="Test Area with Flex Tip Rack Lid",
    bounding_box=AddressableAreaDimensions(x=1100, y=1400, z=2100),
    position=AddressableOffsetVector(x=50, y=100, z=150),
    compatible_module_types=[],
    features=LocatingFeatures(
        opentronsFlexTipRackLidAsParent=OpentronsFlexTipRackLidAsParentFeature(
            matingZ=30
        )
    ),
    mating_surface_unit_vector=[-1, 1, -1],
    orientation=ModuleOrientation.NOT_APPLICABLE,
)


class ModuleOverlapSpec(NamedTuple):
    """Spec data to test module overlap behavior."""

    spec_deck_definition: DeckDefinitionV5
    module_definition: ModuleDefinition
    child_definition: LabwareDefinition2
    module_parent_to_child_offset: Point
    labware_location: ModuleLocation
    expected_total_offset: Point


class LabwareOverlapSpec(NamedTuple):
    """Spec data to test labware stacking behavior."""

    child_definition: LabwareDefinition
    parent_definition: LabwareDefinition
    labware_location: OnLabwareLocation
    expected_total_offset: Point


class AddressableAreaSpec(NamedTuple):
    """Spec data to test addressable area behavior."""

    child_definition: LabwareDefinition2
    addressable_area: AddressableArea
    labware_location: AddressableAreaLocation
    expected_total_offset: Point


class LabwareV3Spec(NamedTuple):
    """Spec data to test LabwareDefinition3 behavior."""

    child_definition: LabwareDefinition3
    parent_definition: object
    labware_location: object
    slot_name: DeckSlotName
    expected_total_offset: Point
    underlying_ancestor_definition: LabwareStackupAncestorDefinition


class GripperOffsetSpec(NamedTuple):
    """Spec data to test gripper offset behavior."""

    stackup_lw_info_top_to_bottom: List[tuple[LabwareDefinition, object]]
    underlying_ancestor_definition: object
    slot_name: DeckSlotName
    deck_definition: DeckDefinitionV5
    module_parent_to_child_offset: Optional[Point]
    expected_pick_up_offset: Point
    expected_drop_offset: Point


MODULE_OVERLAP_SPECS: List[ModuleOverlapSpec] = [
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT2_DECK, 5),
        module_definition=_MODULE_DEF_TEMP_V2,
        child_definition=_LW_V2_WITH_MODULE_STACKING,
        module_parent_to_child_offset=Point(x=450, y=550, z=650),
        labware_location=ModuleLocation(moduleId="module-1"),
        expected_total_offset=Point(x=550, y=700, z=850),
    ),
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT2_DECK, 5),
        module_definition=_MODULE_DEF_TC_V2,
        child_definition=_LW_V2,
        module_parent_to_child_offset=Point(x=450, y=550, z=650),
        labware_location=ModuleLocation(moduleId="module-1"),
        expected_total_offset=Point(x=600, y=800, z=989.3),
    ),
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_definition=_MODULE_DEF_TC_V2,
        child_definition=_LW_V2,
        module_parent_to_child_offset=Point(x=450, y=550, z=650),
        labware_location=ModuleLocation(moduleId="module-1"),
        expected_total_offset=Point(x=600, y=800, z=1000),
    ),
    ModuleOverlapSpec(
        spec_deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_definition=_MODULE_DEF_TC_V2,
        child_definition=_LW_V2_WITH_MODULE_STACKING,
        module_parent_to_child_offset=Point(x=450, y=550, z=650),
        labware_location=ModuleLocation(moduleId="module-1"),
        expected_total_offset=Point(x=100, y=200, z=300),
    ),
]

LABWARE_OVERLAP_SPECS: List[LabwareOverlapSpec] = [
    LabwareOverlapSpec(
        child_definition=_LW_V2_WITH_LABWARE_STACKING,
        parent_definition=_LW_V2_2,
        labware_location=OnLabwareLocation(labwareId="parent-labware-1"),
        expected_total_offset=Point(x=250, y=400, z=1000),
    ),
    LabwareOverlapSpec(
        child_definition=_LW_V2_WITH_LABWARE_STACKING,
        parent_definition=_LW_V2_3,
        labware_location=OnLabwareLocation(labwareId="parent-labware-2"),
        expected_total_offset=Point(x=450, y=650, z=950),
    ),
    LabwareOverlapSpec(
        child_definition=_LW_V2_WITH_LABWARE_STACKING,
        parent_definition=_LW_V3_WITH_SLOT_AS_PARENT_CHILD_FEATURES,
        labware_location=OnLabwareLocation(labwareId="parent-labware-3"),
        expected_total_offset=Point(x=440, y=2135, z=742),
    ),
    LabwareOverlapSpec(
        child_definition=_LW_V3_WITH_LEGACY_STACKING,
        parent_definition=_LW_V2_2,
        labware_location=OnLabwareLocation(labwareId="parent-v2-labware"),
        expected_total_offset=Point(x=100, y=385, z=880),
    ),
]

ADDRESSABLE_AREA_SPECS: List[AddressableAreaSpec] = [
    AddressableAreaSpec(
        child_definition=_LW_V2,
        addressable_area=_ADDRESSABLE_AREA,
        labware_location=AddressableAreaLocation(addressableAreaName="test_area"),
        expected_total_offset=Point(x=150, y=250, z=350),
    ),
]

LW_V3_SPECS_ON_NON_LW: List[LabwareV3Spec] = [
    LabwareV3Spec(
        child_definition=_LW_V3,
        parent_definition=_ADDRESSABLE_AREA,
        slot_name=DeckSlotName.SLOT_A1,
        labware_location=AddressableAreaLocation(addressableAreaName="test_area"),
        expected_total_offset=Point(x=10, y=1495, z=0),
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_SLOT_FP_AS_CHILD_FEATURE,
        parent_definition=_ADDRESSABLE_AREA_WITH_PARENT_FEATURES,
        slot_name=DeckSlotName.SLOT_A1,
        labware_location=AddressableAreaLocation(
            addressableAreaName="test_area_with_parent"
        ),
        expected_total_offset=Point(x=0, y=1600, z=-5),
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_FLEX_TIP_RACK_LID_AS_CHILD,
        parent_definition=_ADDRESSABLE_AREA_WITH_FLEX_TIP_RACK_LID,
        slot_name=DeckSlotName.SLOT_A1,
        labware_location=AddressableAreaLocation(
            addressableAreaName="test_area_with_flex_lid"
        ),
        expected_total_offset=Point(x=0, y=0, z=45),
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
    ),
]

LW_V3_SPECS_ON_LW: List[LabwareV3Spec] = [
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_SLOT_FP_AS_CHILD_FEATURE,
        parent_definition=_LW_V3_WITH_SLOT_FP_AS_PARENT_FEATURE,
        slot_name=DeckSlotName.SLOT_A1,
        labware_location=OnLabwareLocation(labwareId="parent-labware-v3"),
        expected_total_offset=Point(x=20.0, y=15, z=5),
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_SLOT_FP_AS_CHILD_FEATURE,
        parent_definition=_LW_V3,
        slot_name=DeckSlotName.SLOT_A1,
        labware_location=OnLabwareLocation(labwareId="labware-v3-basic"),
        expected_total_offset=Point(x=10, y=1495, z=1000),
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_FLEX_TIP_RACK_LID_AS_CHILD,
        parent_definition=_LW_V3_WITH_FLEX_TIP_RACK_LID_AS_PARENT,
        slot_name=DeckSlotName.SLOT_A1,
        labware_location=OnLabwareLocation(labwareId="flex-tip-rack-lid-parent"),
        expected_total_offset=Point(x=0, y=0, z=40),
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_FLAT_WELL_SUPPORT,
        parent_definition=_LW_V3_WITH_HS_FLAT_ADAPTER,
        labware_location=OnLabwareLocation(labwareId="hs-flat-adapter-parent"),
        slot_name=DeckSlotName.SLOT_D1,
        expected_total_offset=Point(x=-26, y=-157.0, z=25),
        underlying_ancestor_definition=_MODULE_DEF_HS,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_FLAT_WELL_SUPPORT,
        parent_definition=_LW_V3_WITH_HS_FLAT_ADAPTER,
        labware_location=OnLabwareLocation(labwareId="hs-flat-adapter-parent"),
        slot_name=DeckSlotName.SLOT_D3,
        expected_total_offset=Point(x=-246, y=-557.0, z=25),
        underlying_ancestor_definition=_MODULE_DEF_HS,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_SCREW_ANCHORED_AS_CHILD,
        parent_definition=_LW_V3_WITH_SCREW_ANCHORED_AS_PARENT,
        labware_location=OnLabwareLocation(labwareId="screw-anchored-parent"),
        slot_name=DeckSlotName.SLOT_A1,
        expected_total_offset=Point(x=100, y=100, z=10),
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_HS_FLAT_ADAPTER,
        parent_definition=_LW_V3_WITH_SCREW_ANCHORED_AS_PARENT,
        labware_location=OnLabwareLocation(labwareId="screw-anchored-parent"),
        slot_name=DeckSlotName.SLOT_D1,
        expected_total_offset=Point(x=400, y=100, z=20),
        underlying_ancestor_definition=_MODULE_DEF_HS,
    ),
    LabwareV3Spec(
        child_definition=_LW_V3_WITH_HS_FLAT_ADAPTER,
        parent_definition=_LW_V3_WITH_SCREW_ANCHORED_AS_PARENT,
        labware_location=OnLabwareLocation(labwareId="screw-anchored-parent"),
        slot_name=DeckSlotName.SLOT_D3,
        expected_total_offset=Point(x=0, y=-300, z=20),
        underlying_ancestor_definition=_MODULE_DEF_HS,
    ),
]


GRIPPER_OFFSET_SPECS: List[GripperOffsetSpec] = [
    GripperOffsetSpec(
        stackup_lw_info_top_to_bottom=[
            (_LW_V2, DeckSlotLocation(slotName=DeckSlotName.SLOT_3)),
        ],
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
        slot_name=DeckSlotName.SLOT_3,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_parent_to_child_offset=None,
        expected_pick_up_offset=Point(x=0, y=0, z=0),
        expected_drop_offset=Point(x=0, y=0, z=-0.75),
    ),
    GripperOffsetSpec(
        stackup_lw_info_top_to_bottom=[
            (_LW_V2, ModuleLocation(moduleId="module-id")),
        ],
        underlying_ancestor_definition=_MODULE_DEF_WITH_GRIPPER_OFFSETS,
        slot_name=DeckSlotName.SLOT_A1,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_parent_to_child_offset=Point(x=0, y=0, z=0),
        expected_pick_up_offset=Point(x=11, y=22, z=33),
        expected_drop_offset=Point(x=33, y=22, z=11),
    ),
    GripperOffsetSpec(
        stackup_lw_info_top_to_bottom=[
            (
                _LW_V2_WITH_DEFAULT_GRIPPER_OFFSETS,
                OnLabwareLocation(labwareId="parent-id"),
            ),
            (_LW_V2, DeckSlotLocation(slotName=DeckSlotName.SLOT_1)),
        ],
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
        slot_name=DeckSlotName.SLOT_1,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_parent_to_child_offset=None,
        expected_pick_up_offset=Point(x=10, y=20, z=30),
        expected_drop_offset=Point(x=40, y=50, z=59.25),
    ),
    GripperOffsetSpec(
        stackup_lw_info_top_to_bottom=[
            (_LW_V2, OnLabwareLocation(labwareId="adapter-id")),
            (
                _LW_V2_WITH_SLOT_SPECIFIC_GRIPPER_OFFSETS,
                ModuleLocation(moduleId="module-id"),
            ),
        ],
        underlying_ancestor_definition=_MODULE_DEF_WITH_GRIPPER_OFFSETS,
        slot_name=DeckSlotName.SLOT_C1,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_parent_to_child_offset=Point(x=0, y=0, z=0),
        expected_pick_up_offset=Point(x=111, y=222, z=333),
        expected_drop_offset=Point(x=333, y=222, z=111),
    ),
    GripperOffsetSpec(
        stackup_lw_info_top_to_bottom=[
            (_TC_LID_V2, OnLabwareLocation(labwareId="adapter-id")),
            (_LW_V2, ModuleLocation(moduleId="module-id")),
        ],
        underlying_ancestor_definition=_MODULE_DEF_TC_V2,
        slot_name=DeckSlotName.SLOT_B1,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_parent_to_child_offset=Point(x=0, y=0, z=0),
        expected_pick_up_offset=Point(x=5, y=10, z=15),
        expected_drop_offset=Point(x=5, y=10, z=15),
    ),
    GripperOffsetSpec(
        stackup_lw_info_top_to_bottom=[
            (_AR_LID_V2, DeckSlotLocation(slotName=DeckSlotName.SLOT_3)),
        ],
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
        slot_name=DeckSlotName.SLOT_3,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_parent_to_child_offset=None,
        expected_pick_up_offset=Point(x=7, y=14, z=21),
        expected_drop_offset=Point(x=28, y=35, z=41.25),
    ),
    GripperOffsetSpec(
        stackup_lw_info_top_to_bottom=[
            (_LW_V3_WITH_GRIPPER_OFFSETS, OnLabwareLocation(labwareId="parent-id")),
            (
                _LW_V2_WITH_DEFAULT_GRIPPER_OFFSETS,
                DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            ),
        ],
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
        slot_name=DeckSlotName.SLOT_1,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        module_parent_to_child_offset=None,
        expected_pick_up_offset=Point(x=15.0, y=25.0, z=35.0),
        expected_drop_offset=Point(x=45.0, y=55.0, z=64.25),
    ),
]


@pytest.mark.parametrize(
    argnames=ModuleOverlapSpec._fields,
    argvalues=MODULE_OVERLAP_SPECS,
)
def test_get_parent_placement_origin_to_lw_origin_with_module(
    spec_deck_definition: DeckDefinitionV5,
    module_definition: ModuleDefinition,
    child_definition: LabwareDefinition2,
    module_parent_to_child_offset: Point,
    labware_location: ModuleLocation,
    expected_total_offset: Point,
) -> None:
    """It should calculate the correct offset from module parent to labware origin."""
    result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=[
            (child_definition, labware_location),
        ],
        underlying_ancestor_definition=module_definition,
        slot_name=DeckSlotName.SLOT_B1,
        module_parent_to_child_offset=module_parent_to_child_offset,
        deck_definition=spec_deck_definition,
    )

    assert result == expected_total_offset


@pytest.mark.parametrize(
    argnames=LabwareOverlapSpec._fields,
    argvalues=LABWARE_OVERLAP_SPECS,
)
def test_get_parent_placement_origin_to_lw_origin_with_labware(
    child_definition: LabwareDefinition2,
    parent_definition: LabwareDefinition2,
    labware_location: OnLabwareLocation,
    expected_total_offset: Point,
) -> None:
    """It should calculate the correct offset from labware parent to labware origin for v2_schema_labware."""
    result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=[
            (child_definition, labware_location),
            (
                parent_definition,
                AddressableAreaLocation(addressableAreaName="test_area"),
            ),
        ],
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
        slot_name=DeckSlotName.SLOT_A1,
        module_parent_to_child_offset=None,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
    )

    assert result == expected_total_offset


@pytest.mark.parametrize(
    argnames=AddressableAreaSpec._fields,
    argvalues=ADDRESSABLE_AREA_SPECS,
)
def test_get_parent_placement_origin_to_lw_origin_with_addressable_area(
    child_definition: LabwareDefinition2,
    addressable_area: AddressableArea,
    labware_location: AddressableAreaLocation,
    expected_total_offset: Point,
) -> None:
    """It should calculate the correct offset from addressable area to labware origin."""
    result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=[
            (child_definition, labware_location),
        ],
        underlying_ancestor_definition=addressable_area,
        slot_name=DeckSlotName.SLOT_A1,
        module_parent_to_child_offset=None,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
    )

    assert result == expected_total_offset


@pytest.mark.parametrize(
    argnames=LabwareV3Spec._fields,
    argvalues=LW_V3_SPECS_ON_NON_LW,
)
def test_get_parent_placement_origin_to_lw_origin_v3_definitions_non_lw(
    child_definition: LabwareDefinition3,
    parent_definition: AddressableArea,
    labware_location: AddressableAreaLocation,
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
    slot_name: DeckSlotName,
    expected_total_offset: Point,
) -> None:
    """It should handle LabwareDefinition3 correctly with various parent configurations (that are not labware)."""
    result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=[
            (child_definition, labware_location),
        ],
        underlying_ancestor_definition=parent_definition,
        slot_name=slot_name,
        module_parent_to_child_offset=None,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
    )

    assert result == expected_total_offset


@pytest.mark.parametrize(
    argnames=LabwareV3Spec._fields,
    argvalues=LW_V3_SPECS_ON_LW,
)
def test_get_parent_placement_origin_to_lw_origin_v3_definitions(
    child_definition: LabwareDefinition3,
    parent_definition: LabwareDefinition3,
    labware_location: OnLabwareLocation,
    expected_total_offset: Point,
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
    slot_name: DeckSlotName,
) -> None:
    """It should handle LabwareDefinition3 correctly with various labware configurations."""
    result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=[
            (child_definition, labware_location),
            (
                parent_definition,
                AddressableAreaLocation(addressableAreaName="test_area"),
            ),
        ],
        underlying_ancestor_definition=underlying_ancestor_definition,
        slot_name=slot_name,
        module_parent_to_child_offset=None,
        deck_definition=load_deck(STANDARD_OT3_DECK, 5),
    )

    assert result == expected_total_offset


def test_v3_child_on_v2_parent_labware() -> None:
    """Test that v3 labware can stack on v2 labware correctly."""
    deck_def = load_deck(STANDARD_OT3_DECK, 5)

    # Top-most labware case
    result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=[
            (_LW_V3_WITH_LEGACY_STACKING, OnLabwareLocation(labwareId="parent-id")),
            (_LW_V2_2, AddressableAreaLocation(addressableAreaName="test_area")),
        ],
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
        slot_name=DeckSlotName.SLOT_A1,
        module_parent_to_child_offset=None,
        deck_definition=deck_def,
    )

    assert result == Point(x=100, y=385, z=880)

    # Non-topmost labware case
    result_non_topmost = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=[
            (_LW_V2, OnLabwareLocation(labwareId="adapter-id")),
            (_LW_V3_WITH_LEGACY_STACKING, OnLabwareLocation(labwareId="parent-id")),
            (_LW_V2_2, AddressableAreaLocation(addressableAreaName="test_area")),
        ],
        underlying_ancestor_definition=_ADDRESSABLE_AREA,
        slot_name=DeckSlotName.SLOT_A1,
        module_parent_to_child_offset=None,
        deck_definition=deck_def,
    )

    expected_total = Point(x=175, y=760, z=1855)

    assert result_non_topmost == expected_total


@pytest.mark.parametrize(
    argnames=GripperOffsetSpec._fields,
    argvalues=GRIPPER_OFFSET_SPECS,
)
def test_gripper_offsets_for_pickup(
    stackup_lw_info_top_to_bottom: List[tuple[LabwareDefinition, LabwareLocation]],
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
    slot_name: DeckSlotName,
    deck_definition: DeckDefinitionV5,
    module_parent_to_child_offset: Optional[Point],
    expected_pick_up_offset: Point,
    expected_drop_offset: Point,
) -> None:
    """It should calculate the correct gripper offsets for pick up context."""
    pick_up_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.GRIPPER_PICKING_UP,
        stackup_lw_info_top_to_bottom=stackup_lw_info_top_to_bottom,
        underlying_ancestor_definition=underlying_ancestor_definition,
        slot_name=slot_name,
        module_parent_to_child_offset=module_parent_to_child_offset,
        deck_definition=deck_definition,
    )

    # Baseline without gripper offsets
    pipetting_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=stackup_lw_info_top_to_bottom,
        underlying_ancestor_definition=underlying_ancestor_definition,
        slot_name=slot_name,
        module_parent_to_child_offset=module_parent_to_child_offset,
        deck_definition=deck_definition,
    )

    actual_pick_up_offset = pick_up_result - pipetting_result

    assert actual_pick_up_offset == expected_pick_up_offset


@pytest.mark.parametrize(
    argnames=GripperOffsetSpec._fields,
    argvalues=GRIPPER_OFFSET_SPECS,
)
def test_gripper_offsets_for_drop(
    stackup_lw_info_top_to_bottom: List[tuple[LabwareDefinition, LabwareLocation]],
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
    slot_name: DeckSlotName,
    deck_definition: DeckDefinitionV5,
    module_parent_to_child_offset: Optional[Point],
    expected_drop_offset: Point,
    expected_pick_up_offset: Point,
) -> None:
    """It should calculate the correct gripper offsets for drop context."""
    drop_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.GRIPPER_DROPPING,
        stackup_lw_info_top_to_bottom=stackup_lw_info_top_to_bottom,
        underlying_ancestor_definition=underlying_ancestor_definition,
        slot_name=slot_name,
        module_parent_to_child_offset=module_parent_to_child_offset,
        deck_definition=deck_definition,
    )

    # Baseline without gripper offsets
    pipetting_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=stackup_lw_info_top_to_bottom,
        underlying_ancestor_definition=underlying_ancestor_definition,
        slot_name=slot_name,
        module_parent_to_child_offset=module_parent_to_child_offset,
        deck_definition=deck_definition,
    )

    actual_drop_offset = drop_result - pipetting_result

    assert actual_drop_offset == expected_drop_offset


def test_gripper_offsets_stacked_labware_with_module() -> None:
    """Test labware on adapter on module with slot-specific offsets."""
    deck_def = load_deck(STANDARD_OT3_DECK, 5)

    stackup_lw_info: list[tuple[LabwareDefinition, LabwareLocation]] = [
        (_LW_V2, OnLabwareLocation(labwareId="adapter-id")),
        (
            _LW_V2_WITH_SLOT_SPECIFIC_GRIPPER_OFFSETS,
            ModuleLocation(moduleId="module-id"),
        ),
    ]

    pick_up_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.GRIPPER_PICKING_UP,
        stackup_lw_info_top_to_bottom=stackup_lw_info,
        underlying_ancestor_definition=_MODULE_DEF_WITH_GRIPPER_OFFSETS,
        slot_name=DeckSlotName.SLOT_C1,
        module_parent_to_child_offset=Point(x=0, y=0, z=0),
        deck_definition=deck_def,
    )

    pipetting_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=stackup_lw_info,
        underlying_ancestor_definition=_MODULE_DEF_WITH_GRIPPER_OFFSETS,
        slot_name=DeckSlotName.SLOT_C1,
        module_parent_to_child_offset=Point(x=0, y=0, z=0),
        deck_definition=deck_def,
    )

    expected_pick_up_offset = Point(x=111, y=222, z=333)
    actual_pick_up_offset = pick_up_result - pipetting_result

    assert actual_pick_up_offset == expected_pick_up_offset

    drop_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.GRIPPER_DROPPING,
        stackup_lw_info_top_to_bottom=stackup_lw_info,
        underlying_ancestor_definition=_MODULE_DEF_WITH_GRIPPER_OFFSETS,
        slot_name=DeckSlotName.SLOT_C1,
        module_parent_to_child_offset=Point(x=0, y=0, z=0),
        deck_definition=deck_def,
    )

    expected_drop_offset = Point(x=333, y=222, z=111)
    actual_drop_offset = drop_result - pipetting_result

    assert actual_drop_offset == expected_drop_offset


def test_gripper_offsets_fallback_to_default() -> None:
    """Test that gripper offsets fall back to default when slot-specific not available."""
    deck_def = load_deck(STANDARD_OT3_DECK, 5)

    stackup_lw_info: list[tuple[LabwareDefinition, LabwareLocation]] = [
        (_LW_V2, OnLabwareLocation(labwareId="adapter-id")),
        (
            _LW_V2_WITH_DEFAULT_GRIPPER_OFFSETS,
            ModuleLocation(moduleId="module-id"),
        ),
    ]

    pick_up_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.GRIPPER_PICKING_UP,
        stackup_lw_info_top_to_bottom=stackup_lw_info,
        underlying_ancestor_definition=_MODULE_DEF_WITH_GRIPPER_OFFSETS,
        slot_name=DeckSlotName.SLOT_D1,
        module_parent_to_child_offset=Point(x=0, y=0, z=0),
        deck_definition=deck_def,
    )

    # Baseline without gripper offsets
    pipetting_result = get_stackup_origin_to_labware_origin(
        context=LabwareOriginContext.PIPETTING,
        stackup_lw_info_top_to_bottom=stackup_lw_info,
        underlying_ancestor_definition=_MODULE_DEF_WITH_GRIPPER_OFFSETS,
        slot_name=DeckSlotName.SLOT_D1,
        module_parent_to_child_offset=Point(x=0, y=0, z=0),
        deck_definition=deck_def,
    )

    expected_pick_up_offset = Point(x=111, y=222, z=333)
    actual_pick_up_offset = pick_up_result - pipetting_result

    assert actual_pick_up_offset == expected_pick_up_offset


def test_hs_flat_adapter_center_slot_raises_error() -> None:
    """Test that heater shaker flat adapter raises error for center slot."""
    with pytest.raises(
        InvalidLabwarePlacementError,
        match="heaterShakerUniversalFlatAdapter.*center",
    ):
        get_stackup_origin_to_labware_origin(
            context=LabwareOriginContext.PIPETTING,
            stackup_lw_info_top_to_bottom=[
                (
                    _LW_V3_WITH_FLAT_WELL_SUPPORT,
                    OnLabwareLocation(labwareId="hs-flat-adapter-parent"),
                ),
                (
                    _LW_V3_WITH_HS_FLAT_ADAPTER,
                    AddressableAreaLocation(addressableAreaName="test_area"),
                ),
            ],
            underlying_ancestor_definition=_ADDRESSABLE_AREA,
            slot_name=DeckSlotName.SLOT_A2,
            module_parent_to_child_offset=None,
            deck_definition=load_deck(STANDARD_OT3_DECK, 5),
        )
