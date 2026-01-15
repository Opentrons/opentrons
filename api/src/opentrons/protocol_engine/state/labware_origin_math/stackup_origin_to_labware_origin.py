"""Utilities for calculating the labware origin offset position."""

import dataclasses
import enum
from typing import Optional, Union, overload

from typing_extensions import assert_type

from opentrons_shared_data.deck.types import DeckDefinitionV5, SlotDefV3
from opentrons_shared_data.labware.labware_definition import (
    AxisAlignedBoundingBox3D,
    Extents,
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
    Vector3D,
)
from opentrons_shared_data.labware.types import (
    LocatingFeatures,
    SlotFootprintAsChildFeature,
    SlotFootprintAsParentFeature,
    SpringDirectionalForce,
)
from opentrons_shared_data.labware.types import (
    Vector3D as LabwareVector3D,
)
from opentrons_shared_data.module.types import ModuleOrientation

from .errors import (
    IncompatibleLocatingFeatureError,
    InvalidLabwarePlacementError,
    MissingLocatingFeatureError,
)
from opentrons.protocol_engine.errors import (
    InvalidModuleOrientation,
    LabwareNotOnDeckError,
    LabwareOffsetDoesNotExistError,
)
from opentrons.protocol_engine.resources.labware_validation import (
    is_absorbance_reader_lid,
    validate_definition_is_lid,
)
from opentrons.protocol_engine.types import (
    WASTE_CHUTE_LOCATION,
    AddressableArea,
    AddressableAreaLocation,
    DeckLocationDefinition,
    DeckSlotLocation,
    LabwareLocation,
    LabwareMovementOffsetData,
    LabwareOffsetVector,
    ModuleDefinition,
    ModuleLocation,
    ModuleModel,
    OnLabwareLocation,
)
from opentrons.types import DeckSlotName, Point

_OFFSET_ON_TC_OT2 = Point(x=0, y=0, z=10.7)

LabwareStackupAncestorDefinition = Union[
    DeckLocationDefinition,
    ModuleDefinition,
]
_LabwareStackupDefinition = Union[
    DeckLocationDefinition, ModuleDefinition, LabwareDefinition
]


class LabwareOriginContext(enum.Enum):
    """Context for labware origin calculations."""

    PIPETTING = enum.auto()
    GRIPPER_PICKING_UP = enum.auto()
    GRIPPER_DROPPING = enum.auto()


@dataclasses.dataclass
class _Labware3SupportedParentDefinition:
    features: LocatingFeatures
    extents: Extents


@dataclasses.dataclass
class _GripperOffsets:
    pick_up_offset: Point
    drop_offset: Point


def get_stackup_origin_to_labware_origin(
    context: LabwareOriginContext,
    stackup_lw_info_top_to_bottom: list[tuple[LabwareDefinition, LabwareLocation]],
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
    slot_name: DeckSlotName,
    module_parent_to_child_offset: Point | None,
    deck_definition: DeckDefinitionV5,
) -> Point:
    """Returns the offset from the stackup placement origin to child labware origin.

    Accounts for offset differences caused by context.
    """
    if context == LabwareOriginContext.PIPETTING:
        return _get_stackup_origin_to_lw_origin(
            stackup_lw_info_top_to_bottom=stackup_lw_info_top_to_bottom,
            underlying_ancestor_definition=underlying_ancestor_definition,
            module_parent_to_child_offset=module_parent_to_child_offset,
            deck_definition=deck_definition,
            slot_name=slot_name,
        )
    else:
        gripper_offsets = _total_nominal_gripper_offsets(
            stackup_lw_info_top_to_bottom=stackup_lw_info_top_to_bottom,
            underlying_ancestor_definition=underlying_ancestor_definition,
            slot_name=slot_name,
            deck_definition=deck_definition,
        )
        gripper_offset = (
            gripper_offsets.pick_up_offset
            if context == LabwareOriginContext.GRIPPER_PICKING_UP
            else gripper_offsets.drop_offset
        )

        return gripper_offset + _get_stackup_origin_to_lw_origin(
            stackup_lw_info_top_to_bottom=stackup_lw_info_top_to_bottom,
            underlying_ancestor_definition=underlying_ancestor_definition,
            module_parent_to_child_offset=module_parent_to_child_offset,
            deck_definition=deck_definition,
            slot_name=slot_name,
        )


def _get_stackup_origin_to_lw_origin(
    stackup_lw_info_top_to_bottom: list[tuple[LabwareDefinition, LabwareLocation]],
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
    module_parent_to_child_offset: Point | None,
    deck_definition: DeckDefinitionV5,
    slot_name: DeckSlotName,
    is_topmost_labware: bool = True,
) -> Point:
    """Returns the offset from the stackup placement origin to child labware origin."""
    definition, location = stackup_lw_info_top_to_bottom[0]
    underlying_ancestor_orientation = _get_underlying_ancestor_orientation(
        underlying_ancestor_definition, slot_name
    )

    if isinstance(
        location, (AddressableAreaLocation, DeckSlotLocation, ModuleLocation)
    ):
        return _get_parent_placement_origin_to_lw_origin_by_location(
            labware_location=location,
            labware_definition=definition,
            parent_definition=underlying_ancestor_definition,
            deck_definition=deck_definition,
            module_parent_to_child_offset=module_parent_to_child_offset,
            is_topmost_labware=is_topmost_labware,
            underlying_ancestor_orientation=underlying_ancestor_orientation,
        )
    elif isinstance(location, OnLabwareLocation):
        parent_definition = stackup_lw_info_top_to_bottom[1][0]

        parent_placement_origin_to_lw_origin = (
            _get_parent_placement_origin_to_lw_origin_by_location(
                labware_location=location,
                labware_definition=definition,
                parent_definition=parent_definition,
                deck_definition=deck_definition,
                module_parent_to_child_offset=module_parent_to_child_offset,
                is_topmost_labware=is_topmost_labware,
                underlying_ancestor_orientation=underlying_ancestor_orientation,
            )
        )
        remaining_lw_defs_locs_top_to_bottom = stackup_lw_info_top_to_bottom[1:]

        return parent_placement_origin_to_lw_origin + _get_stackup_origin_to_lw_origin(
            stackup_lw_info_top_to_bottom=remaining_lw_defs_locs_top_to_bottom,
            underlying_ancestor_definition=underlying_ancestor_definition,
            module_parent_to_child_offset=module_parent_to_child_offset,
            deck_definition=deck_definition,
            slot_name=slot_name,
            is_topmost_labware=False,
        )
    elif location == WASTE_CHUTE_LOCATION:
        raise LabwareNotOnDeckError(
            f"Cannot access {definition.metadata.displayName} because it is in the waste chute."
        )
    else:
        raise LabwareNotOnDeckError(
            f"Cannot access {definition.metadata.displayName} since it is not on the deck. "
            "Either it has been loaded off-deck or its been moved off-deck."
        )


def _get_underlying_ancestor_orientation(
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
    slot_id: DeckSlotName,
) -> ModuleOrientation:
    if isinstance(underlying_ancestor_definition, ModuleDefinition):
        orientation = underlying_ancestor_definition.orientation.get(slot_id.id)
        if orientation == "left":
            return ModuleOrientation.LEFT
        elif orientation == "right":
            return ModuleOrientation.RIGHT
        elif orientation == "center":
            return ModuleOrientation.CENTER
        else:
            raise InvalidModuleOrientation(
                f"Module {underlying_ancestor_definition.moduleType} does "
                f"not contain a valid orientation for slot {slot_id}."
            )

    elif isinstance(underlying_ancestor_definition, AddressableArea):
        return underlying_ancestor_definition.orientation
    else:
        return underlying_ancestor_definition["orientation"]


def _get_parent_placement_origin_to_lw_origin_by_location(
    labware_location: LabwareLocation,
    labware_definition: LabwareDefinition,
    parent_definition: _LabwareStackupDefinition,
    deck_definition: DeckDefinitionV5,
    module_parent_to_child_offset: Point | None,
    underlying_ancestor_orientation: ModuleOrientation,
    is_topmost_labware: bool,
) -> Point:
    if isinstance(labware_location, ModuleLocation):
        if module_parent_to_child_offset is None:
            raise ValueError(
                "Expected value for module_parent_to_child_offset, received None."
            )
        else:
            return _get_parent_placement_origin_to_lw_origin(
                child_labware=labware_definition,
                parent_deck_item=parent_definition,  # type: ignore[arg-type]
                module_parent_to_child_offset=module_parent_to_child_offset,
                deck_definition=deck_definition,
                is_topmost_labware=is_topmost_labware,
                labware_location=labware_location,
                underlying_ancestor_orientation=underlying_ancestor_orientation,
            )
    elif isinstance(labware_location, OnLabwareLocation):
        return _get_parent_placement_origin_to_lw_origin(
            child_labware=labware_definition,
            parent_deck_item=parent_definition,  # type: ignore[arg-type]
            module_parent_to_child_offset=None,
            deck_definition=deck_definition,
            is_topmost_labware=is_topmost_labware,
            labware_location=labware_location,
            underlying_ancestor_orientation=underlying_ancestor_orientation,
        )
    elif isinstance(labware_location, (DeckSlotLocation, AddressableAreaLocation)):
        return _get_parent_placement_origin_to_lw_origin(
            child_labware=labware_definition,
            parent_deck_item=parent_definition,  # type: ignore[arg-type]
            module_parent_to_child_offset=None,
            deck_definition=deck_definition,
            is_topmost_labware=is_topmost_labware,
            labware_location=labware_location,
            underlying_ancestor_orientation=underlying_ancestor_orientation,
        )
    else:
        raise ValueError(f"Invalid labware location: {labware_location}")


@overload
def _get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: ModuleDefinition,
    module_parent_to_child_offset: Point,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: ModuleLocation,
    underlying_ancestor_orientation: ModuleOrientation,
) -> Point: ...


@overload
def _get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: DeckLocationDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: Union[DeckSlotLocation, AddressableAreaLocation],
    underlying_ancestor_orientation: ModuleOrientation,
) -> Point: ...


@overload
def _get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: LabwareDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: OnLabwareLocation,
    underlying_ancestor_orientation: ModuleOrientation,
) -> Point: ...


def _get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: _LabwareStackupDefinition,
    module_parent_to_child_offset: Point | None,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: LabwareLocation,
    underlying_ancestor_orientation: ModuleOrientation,
) -> Point:
    """Returns the offset from parent entity's placement origin to child labware origin.

    Placement origin varies depending on the parent entity type (labware v3 are the back left bottom, and
    labware v2, modules, & deck location types are the front left bottom).

    Only parent-child specific offsets are calculated. Offsets that apply to a single entity
    (ex., module cal) or the entire stackup (ex., LPC) are handled elsewhere.
    """
    if isinstance(child_labware, LabwareDefinition2) or isinstance(
        parent_deck_item, LabwareDefinition2
    ):
        parent_deck_item_origin_to_child_labware_placement_origin = (
            _get_parent_deck_item_origin_to_child_labware_placement_origin(
                child_labware=child_labware,
                parent_deck_item=parent_deck_item,
                module_parent_to_child_offset=module_parent_to_child_offset,
                deck_definition=deck_definition,
                labware_location=labware_location,
            )
        )

        # For v2 definitions, cornerOffsetFromSlot is the parent entity placement origin to child labware origin offset.
        # For compatibility with historical (buggy?) behavior,
        # we only consider it when the child labware is the topmost labware in a stackup.
        if isinstance(child_labware, LabwareDefinition2):
            parent_deck_item_to_child_labware_offset = (
                Point.from_xyz_attrs(child_labware.cornerOffsetFromSlot)
                if is_topmost_labware
                else Point(0, 0, 0)
            )

            return (
                parent_deck_item_origin_to_child_labware_placement_origin
                + parent_deck_item_to_child_labware_offset
            )
        else:
            assert isinstance(child_labware, LabwareDefinition3)
            parent_deck_item_to_child_labware_back_left = Point(
                x=0, y=child_labware.extents.total.frontRightTop.y * -1, z=0
            )
            child_labware_back_left_to_child_labware_origin = (
                _get_corner_offset_from_extents(child_labware)
                if is_topmost_labware
                else Point(0, 0, 0)
            )

            return (
                parent_deck_item_origin_to_child_labware_placement_origin  # Only the Z-offset in this case.
                + parent_deck_item_to_child_labware_back_left
                + child_labware_back_left_to_child_labware_origin
            )
    else:
        # For v3 definitions, get the vector from the back left bottom to the front right bottom.
        assert_type(child_labware, LabwareDefinition3)

        # TODO(jh, 06-25-25): This code is entirely temporary and only exists for the purposes of more useful
        #  snapshot testing. This code should exist in NO capacity after features are implemented outside of the
        #  module_parent_to_child_offset.
        if _shim_does_locating_feature_pair_exist(
            child_labware=child_labware,
            parent_deck_item=_get_standardized_parent_deck_item(parent_deck_item),
        ):
            parent_deck_item_origin_to_child_labware_placement_origin = (
                _module_parent_to_child_offset(
                    module_parent_to_child_offset, labware_location
                )
            )
        else:
            parent_deck_item_origin_to_child_labware_placement_origin = (
                _get_parent_deck_item_origin_to_child_labware_placement_origin(
                    child_labware=child_labware,
                    parent_deck_item=parent_deck_item,
                    module_parent_to_child_offset=module_parent_to_child_offset,
                    deck_definition=deck_definition,
                    labware_location=labware_location,
                )
            )

        parent_deck_item_to_child_labware_feature_offset = (
            _parent_deck_item_to_child_labware_feature_offset(
                child_labware=child_labware,
                parent_deck_item=_get_standardized_parent_deck_item(parent_deck_item),
                underlying_ancestor_orientation=underlying_ancestor_orientation,
            )
        ) + _feature_exception_offsets(
            deck_definition=deck_definition, parent_deck_item=parent_deck_item
        )

        return (
            parent_deck_item_origin_to_child_labware_placement_origin
            + parent_deck_item_to_child_labware_feature_offset
        )


def _get_parent_deck_item_origin_to_child_labware_placement_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: _LabwareStackupDefinition,
    module_parent_to_child_offset: Point | None,
    deck_definition: DeckDefinitionV5,
    labware_location: LabwareLocation,
) -> Point:
    """Get the offset vector from parent entity origin to child labware placement origin."""
    if isinstance(labware_location, (DeckSlotLocation, AddressableAreaLocation)):
        return Point(x=0, y=0, z=0)

    elif isinstance(labware_location, ModuleLocation):
        assert isinstance(parent_deck_item, ModuleDefinition)

        child_labware_overlap_with_parent_deck_item = (
            _get_child_labware_overlap_with_parent_module(
                child_labware=child_labware,
                parent_module_model=parent_deck_item.model,
                deck_definition=deck_definition,
            )
        )
        module_parent_to_child_offset = _module_parent_to_child_offset(
            module_parent_to_child_offset, labware_location
        )

        return (
            module_parent_to_child_offset - child_labware_overlap_with_parent_deck_item
        )

    elif isinstance(labware_location, OnLabwareLocation):
        assert isinstance(parent_deck_item, (LabwareDefinition2, LabwareDefinition3))

        # TODO(jh, 06-05-25): This logic is slightly duplicative of LabwareView get_dimensions. Can we unify?
        if isinstance(parent_deck_item, LabwareDefinition2):
            parent_deck_item_height = parent_deck_item.dimensions.zDimension
        else:
            assert_type(parent_deck_item, LabwareDefinition3)
            parent_deck_item_height = (
                parent_deck_item.extents.total.frontRightTop.z
                - parent_deck_item.extents.total.backLeftBottom.z
            )

        child_labware_overlap_with_parent_deck_item = (
            _get_child_labware_overlap_with_parent_labware(
                child_labware=child_labware,
                parent_labware_name=parent_deck_item.parameters.loadName,
            )
        )

        return Point(
            x=child_labware_overlap_with_parent_deck_item.x,
            y=child_labware_overlap_with_parent_deck_item.y,
            z=parent_deck_item_height - child_labware_overlap_with_parent_deck_item.z,
        )

    else:
        raise TypeError(f"Unsupported labware location type: {labware_location}")


def _get_corner_offset_from_extents(child_labware: LabwareDefinition3) -> Point:
    """Derive the corner offset from slot from a LabwareDefinition3's extents."""
    back_left_bottom = child_labware.extents.total.backLeftBottom

    x = back_left_bottom.x
    y = back_left_bottom.y * -1
    z = back_left_bottom.z

    return Point(x, y, z)


def _module_parent_to_child_offset(
    module_parent_to_child_offset: Point | None,
    labware_location: LabwareLocation,
) -> Point:
    """Returns the module offset if applicable."""
    if (
        isinstance(labware_location, ModuleLocation)
        and module_parent_to_child_offset is not None
    ):
        return Point.from_xyz_attrs(module_parent_to_child_offset)
    else:
        return Point(0, 0, 0)


def _shim_does_locating_feature_pair_exist(
    child_labware: LabwareDefinition3,
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> bool:
    """Temporary util."""
    slot_footprint_exists = (
        parent_deck_item.features.get("slotFootprintAsParent") is not None
        and child_labware.features.get("slotFootprintAsChild") is not None
    )
    flex_tiprack_lid_exists = (
        parent_deck_item.features.get("opentronsFlexTipRackLidAsParent") is not None
        and child_labware.features.get("opentronsFlexTipRackLidAsChild") is not None
    )
    hs_universal_flat_adapter_exists = (
        parent_deck_item.features.get("heaterShakerUniversalFlatAdapter") is not None
        and child_labware.features.get("flatSupportThermalCouplingAsChild") is not None
    )
    hs_universal_flat_adapter_screw_anchored_exists = (
        parent_deck_item.features.get("screwAnchoredAsParent") is not None
        and child_labware.features.get("heaterShakerUniversalFlatAdapter") is not None
    )
    screw_anchored_exists = (
        parent_deck_item.features.get("screwAnchoredAsParent") is not None
        and child_labware.features.get("screwAnchoredAsChild") is not None
    )

    return (
        slot_footprint_exists
        or flex_tiprack_lid_exists
        or hs_universal_flat_adapter_exists
        or hs_universal_flat_adapter_screw_anchored_exists
        or screw_anchored_exists
    )


def _get_standardized_parent_deck_item(
    parent_deck_item: Union[
        LabwareDefinition3, DeckLocationDefinition, ModuleDefinition
    ],
) -> _Labware3SupportedParentDefinition:
    """Returns a standardized parent deck item interface."""
    if isinstance(parent_deck_item, ModuleDefinition):
        slot_footprint_as_parent = _module_slot_footprint_as_parent(parent_deck_item)
        if slot_footprint_as_parent is not None:
            return _Labware3SupportedParentDefinition(
                features={
                    **parent_deck_item.features,
                    "slotFootprintAsParent": slot_footprint_as_parent,
                },
                extents=parent_deck_item.extents,
            )
        else:
            return _Labware3SupportedParentDefinition(
                features=parent_deck_item.features, extents=parent_deck_item.extents
            )
    elif isinstance(parent_deck_item, AddressableArea):
        extents = Extents(
            total=AxisAlignedBoundingBox3D(
                backLeftBottom=Vector3D(x=0, y=0, z=0),
                frontRightTop=Vector3D(
                    x=parent_deck_item.bounding_box.x,
                    y=parent_deck_item.bounding_box.y * 1,
                    z=parent_deck_item.bounding_box.z,
                ),
            )
        )

        slot_footprint_as_parent = _aa_slot_footprint_as_parent(parent_deck_item)
        if slot_footprint_as_parent is not None:
            return _Labware3SupportedParentDefinition(
                features={
                    **parent_deck_item.features,
                    "slotFootprintAsParent": slot_footprint_as_parent,
                },
                extents=extents,
            )
        else:
            return _Labware3SupportedParentDefinition(
                parent_deck_item.features, extents=extents
            )
    elif isinstance(parent_deck_item, LabwareDefinition3):
        return _Labware3SupportedParentDefinition(
            features=parent_deck_item.features, extents=parent_deck_item.extents
        )
    # The slotDefV3 case.
    else:
        extents = Extents(
            total=AxisAlignedBoundingBox3D(
                backLeftBottom=Vector3D(x=0, y=0, z=0),
                frontRightTop=Vector3D(
                    x=parent_deck_item["boundingBox"]["xDimension"],
                    y=parent_deck_item["boundingBox"]["yDimension"] * 1,
                    z=parent_deck_item["boundingBox"]["zDimension"],
                ),
            )
        )
        slot_footprint_as_parent = _slot_def_slot_footprint_as_parent(parent_deck_item)
        return _Labware3SupportedParentDefinition(
            features={
                **parent_deck_item["features"],
                "slotFootprintAsParent": slot_footprint_as_parent,
            },
            extents=extents,
        )


def _module_slot_footprint_as_parent(
    parent_deck_item: ModuleDefinition,
) -> SlotFootprintAsParentFeature | None:
    """Returns the slot footprint as parent feature if inherently supported by the module definition.

    This utility is a normalization shim until labwareOffset + labwareInterfaceX/YDimension is deleted in module defs
    and replaced with the same slotFootprintAsParent that exists in labware def v3.
    """
    dimensions = parent_deck_item.dimensions
    if (
        dimensions.labwareInterfaceYDimension is None
        or dimensions.labwareInterfaceXDimension is None
    ):
        return None
    else:
        # Modules with springs would require special mating types and therefore are not handled here.
        return SlotFootprintAsParentFeature(
            z=0,
            backLeft={"x": 0, "y": dimensions.labwareInterfaceYDimension},
            frontRight={"x": dimensions.labwareInterfaceXDimension, "y": 0},
        )


def _aa_slot_footprint_as_parent(
    parent_deck_item: AddressableArea,
) -> SlotFootprintAsParentFeature | None:
    """Returns the slot footprint as parent feature for addressable areas.

    This utility is a normalization shim until bounding box in deck defs and
    replaced with the same slotFootprintAsParent that exists in labware def v3.
    """
    bb = parent_deck_item.bounding_box

    if parent_deck_item.mating_surface_unit_vector is not None:
        if parent_deck_item.mating_surface_unit_vector == [-1, 1, -1]:
            return SlotFootprintAsParentFeature(
                z=0,
                backLeft={"x": 0, "y": bb.y},
                frontRight={"x": bb.x, "y": 0},
                springDirectionalForce="backLeftBottom",
            )
        else:
            raise NotImplementedError(
                "Slot footprint as parent does not support mating surface unit vector."
            )
    else:
        return SlotFootprintAsParentFeature(
            z=0,
            backLeft={"x": 0, "y": bb.y},
            frontRight={"x": bb.x, "y": 0},
        )


def _slot_def_slot_footprint_as_parent(
    parent_deck_item: SlotDefV3,
) -> SlotFootprintAsParentFeature:
    """Returns the slot footprint as parent feature for slot definitions.

    This utility is a normalization shim until bounding box in deck defs and
    replaced with the same slotFootprintAsParent that exists in labware def v3.
    """
    bb = parent_deck_item["boundingBox"]
    return SlotFootprintAsParentFeature(
        z=0,
        backLeft={"x": 0, "y": bb["yDimension"]},
        frontRight={"x": bb["xDimension"], "y": 0},
        springDirectionalForce="backLeftBottom",
    )


def _parent_deck_item_to_child_labware_feature_offset(
    child_labware: LabwareDefinition3,
    parent_deck_item: _Labware3SupportedParentDefinition,
    underlying_ancestor_orientation: ModuleOrientation,
) -> Point:
    """Get the offset vector from the parent entity origin to the child labware origin."""
    if parent_deck_item.features.get("heaterShakerUniversalFlatAdapter") is not None:
        if child_labware.features.get("flatSupportThermalCouplingAsChild") is not None:
            return _parent_origin_to_heater_shaker_universal_flat_adapter_feature(
                parent_deck_item=parent_deck_item,
                underlying_ancestor_orientation=underlying_ancestor_orientation,
            ) + _heater_shaker_universal_flat_adapter_feature_to_child_origin(
                child_labware=child_labware,
                underlying_ancestor_orientation=underlying_ancestor_orientation,
            )
        else:
            raise MissingLocatingFeatureError(
                labware_name=child_labware.metadata.displayName,
                required_feature="flatSupportThermalCouplingAsChild",
            )

    elif (
        parent_deck_item.features.get("opentronsFlexTipRackLidAsParent") is not None
        and child_labware.features.get("opentronsFlexTipRackLidAsChild") is not None
    ):
        # TODO(jh, 07-29-25): Support center X/Y calculation after addressing grip point
        # calculations. See #18929 discussion.
        return _parent_origin_to_flex_tip_rack_lid_feature(
            parent_deck_item
        ) + _flex_tip_rack_lid_feature_to_child_origin(child_labware)
    elif (
        parent_deck_item.features.get("screwAnchoredAsParent") is not None
        and _get_screw_anchored_center_for_child(
            child_labware, underlying_ancestor_orientation
        )
        is not None
    ):
        return _parent_origin_to_screw_anchored_feature(
            parent_deck_item
        ) + _screw_anchored_feature_to_child_origin(
            child_labware, underlying_ancestor_orientation
        )
    elif (
        parent_deck_item.features.get("slotFootprintAsParent") is not None
        and child_labware.features.get("slotFootprintAsChild") is not None
    ):
        spring_force = _get_spring_force(child_labware, parent_deck_item)

        if spring_force is not None:
            if spring_force == "backLeftBottom":
                return _parent_origin_to_slot_back_left_bottom(
                    parent_deck_item
                ) + _slot_back_left_bottom_to_child_origin(child_labware)
            else:
                raise NotImplementedError(f"Spring force: {spring_force}")
        else:
            return _parent_origin_to_slot_bottom_center(
                parent_deck_item
            ) + slot_bottom_center_to_child_origin(child_labware)
    else:
        # TODO(jh, 06-25-25): This is a temporary shim to unblock FE usage with LW Def3 and more accurately diff
        #  ongoing positioning snapshot changes, but we should throw an error  after adding all locating features
        #  if no appropriate LF pair is found.
        return Point(0, 0, 0)


def _get_spring_force(
    child_labware: LabwareDefinition3,
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> SpringDirectionalForce | None:
    """Returns whether the parent-child stackup has a spring that affects positioning."""
    assert parent_deck_item.features.get("slotFootprintAsParent") is not None
    assert child_labware.features.get("slotFootprintAsChild") is not None

    parent_spring_force = parent_deck_item.features["slotFootprintAsParent"].get(
        "springDirectionalForce"
    )
    child_spring_force = child_labware.features["slotFootprintAsChild"].get(
        "springDirectionalForce"
    )

    if parent_spring_force is not None and child_spring_force is not None:
        if parent_spring_force != child_spring_force:
            raise IncompatibleLocatingFeatureError(
                parent_feature=f"slotFootprintAsParent spring force: {parent_spring_force}",
                child_feature=f"slotFootprintAsChild spring force: {child_spring_force}",
            )

    return parent_spring_force or child_spring_force


def _get_screw_anchored_center_for_child(
    child_labware: LabwareDefinition3,
    underlying_ancestor_orientation: ModuleOrientation,
) -> LabwareVector3D | None:
    """Returns the screw center if it exists in any locating feature that supports screw anchoring."""
    hs_universal_flat_adapter_feature = child_labware.features.get(
        "heaterShakerUniversalFlatAdapter"
    )
    screw_anchored_as_child_feature = child_labware.features.get("screwAnchoredAsChild")

    if hs_universal_flat_adapter_feature is not None:
        if underlying_ancestor_orientation == ModuleOrientation.LEFT:
            x = hs_universal_flat_adapter_feature["deckLeft"]["screwCenter"]["x"]
            y = hs_universal_flat_adapter_feature["deckLeft"]["screwCenter"]["y"]
            return LabwareVector3D(x=x, y=y, z=0)
        elif underlying_ancestor_orientation == ModuleOrientation.RIGHT:
            x = hs_universal_flat_adapter_feature["deckRight"]["screwCenter"]["x"]
            y = hs_universal_flat_adapter_feature["deckRight"]["screwCenter"]["y"]
            return LabwareVector3D(x=x, y=y, z=0)
        else:
            raise InvalidLabwarePlacementError(
                feature_name="heaterShakerUniversalFlatAdapter",
                invalid_placement=ModuleOrientation.CENTER.value,
            )
    elif screw_anchored_as_child_feature is not None:
        return screw_anchored_as_child_feature["screwCenter"]
    else:
        return None


def _parent_origin_to_flex_tip_rack_lid_feature(
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> Point:
    """Returns the offset from a deck item's origin to the Flex tip rack lid locating feature."""
    flex_tip_rack_lid_as_parent = parent_deck_item.features.get(
        "opentronsFlexTipRackLidAsParent"
    )
    assert flex_tip_rack_lid_as_parent is not None

    return Point(x=0, y=0, z=flex_tip_rack_lid_as_parent["matingZ"])


def _parent_origin_to_slot_bottom_center(
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> Point:
    """Returns the offset from a deck item's origin to the bottom center of the slot that it provides."""
    slot_footprint_as_parent = parent_deck_item.features.get("slotFootprintAsParent")
    assert slot_footprint_as_parent is not None

    x = (
        slot_footprint_as_parent["frontRight"]["x"]
        + slot_footprint_as_parent["backLeft"]["x"]
    ) / 2
    y = (
        slot_footprint_as_parent["frontRight"]["y"]
        + slot_footprint_as_parent["backLeft"]["y"]
    ) / 2
    z = slot_footprint_as_parent["z"]

    return Point(x, y, z)


def _parent_origin_to_slot_back_left_bottom(
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> Point:
    """Returns the offset from a deck item's origin to the back left bottom of the slot that it provides."""
    slot_footprint_as_parent = parent_deck_item.features.get("slotFootprintAsParent")
    assert slot_footprint_as_parent is not None

    x = slot_footprint_as_parent["backLeft"]["x"]
    y = slot_footprint_as_parent["backLeft"]["y"]
    z = slot_footprint_as_parent["z"]

    return Point(x, y, z)


def _parent_origin_to_heater_shaker_universal_flat_adapter_feature(
    parent_deck_item: _Labware3SupportedParentDefinition,
    underlying_ancestor_orientation: ModuleOrientation,
) -> Point:
    """Returns the offset from a deck item's origin to the Heater Shaker Universal Flat Adapter locating feature."""
    flat_adapter_feature = parent_deck_item.features.get(
        "heaterShakerUniversalFlatAdapter"
    )
    assert flat_adapter_feature is not None

    flat_well_support_z = flat_adapter_feature["flatSupportThermalCouplingZ"]
    extents = parent_deck_item.extents.total

    if underlying_ancestor_orientation == ModuleOrientation.LEFT:
        left_wall_x = flat_adapter_feature["deckLeft"]["wallX"]
        left_side_center_x = extents.backLeftBottom.x + left_wall_x
        left_side_center_y = (extents.backLeftBottom.y + extents.frontRightTop.y) / 2

        return Point(left_side_center_x, left_side_center_y, flat_well_support_z)
    elif underlying_ancestor_orientation == ModuleOrientation.RIGHT:
        right_wall_x = flat_adapter_feature["deckRight"]["wallX"]
        right_side_center_x = extents.frontRightTop.x + right_wall_x
        right_side_center_y = (extents.backLeftBottom.y + extents.frontRightTop.y) / 2

        return Point(right_side_center_x, right_side_center_y, flat_well_support_z)

    else:
        raise InvalidLabwarePlacementError(
            feature_name="heaterShakerUniversalFlatAdapter",
            invalid_placement=ModuleOrientation.CENTER.value,
        )


def _parent_origin_to_screw_anchored_feature(
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> Point:
    """Returns the offset from a deck item's origin to the `screwAnchoredAsParent` locating feature."""
    feature = parent_deck_item.features.get("screwAnchoredAsParent")
    assert feature is not None

    screw_center_x = feature["screwCenter"]["x"]
    screw_center_y = feature["screwCenter"]["y"]
    screw_center_z = feature["screwCenter"]["z"]

    return Point(x=screw_center_x, y=screw_center_y, z=screw_center_z)


def _flex_tip_rack_lid_feature_to_child_origin(
    child_labware: LabwareDefinition3,
) -> Point:
    """Returns the offset from a Flex tip rack lid locating feature to the child origin."""
    flex_tip_rack_lid_as_child = child_labware.features.get(
        "opentronsFlexTipRackLidAsChild"
    )
    assert flex_tip_rack_lid_as_child is not None

    return Point(x=0, y=0, z=flex_tip_rack_lid_as_child["matingZ"])


def slot_bottom_center_to_child_origin(
    child_labware: LabwareDefinition3,
) -> Point:
    """Returns offset from a parent slot's bottom center to the child origin."""
    slot_footprint_as_child = child_labware.features.get("slotFootprintAsChild")
    assert slot_footprint_as_child is not None

    x = (
        slot_footprint_as_child["frontRight"]["x"]
        + slot_footprint_as_child["backLeft"]["x"]
    ) / 2
    y = (
        slot_footprint_as_child["frontRight"]["y"]
        + slot_footprint_as_child["backLeft"]["y"]
    ) / 2
    z = slot_footprint_as_child["z"]

    return Point(x, y, z) * -1


def _slot_back_left_bottom_to_child_origin(
    child_labware: LabwareDefinition3,
) -> Point:
    """Returns offset from a parent slot's back left bottom to the child's origin."""
    slot_footprint_as_child = child_labware.features.get("slotFootprintAsChild")
    assert slot_footprint_as_child is not None

    x = slot_footprint_as_child["backLeft"]["x"]
    y = slot_footprint_as_child["backLeft"]["y"]
    z = slot_footprint_as_child["z"]

    return Point(x, y, z) * -1


def _child_back_left_bottom_position(child_labware: LabwareDefinition3) -> Point:
    """Get the back left bottom position from a v3 labware definition."""
    footprint_as_child = _get_labware_footprint_as_child(child_labware)

    return Point(
        x=footprint_as_child["backLeft"]["x"],
        y=footprint_as_child["frontRight"]["y"],
        z=footprint_as_child["z"],
    )


def _heater_shaker_universal_flat_adapter_feature_to_child_origin(
    child_labware: LabwareDefinition3,
    underlying_ancestor_orientation: ModuleOrientation,
) -> Point:
    """Returns the offset from a Heater Shaker Universal Flat Adapter locating feature to the child origin."""
    flat_well_support_as_child = child_labware.features.get(
        "flatSupportThermalCouplingAsChild"
    )

    assert flat_well_support_as_child is not None

    well_exterior_bottom_z = flat_well_support_as_child["wellExteriorBottomZ"]
    extents = child_labware.extents.total

    if underlying_ancestor_orientation == ModuleOrientation.LEFT:
        left_side_center_x = extents.backLeftBottom.x
        left_side_center_y = (extents.backLeftBottom.y + extents.frontRightTop.y) / 2

        return (
            Point(left_side_center_x, left_side_center_y, well_exterior_bottom_z) * -1
        )
    elif underlying_ancestor_orientation == ModuleOrientation.RIGHT:
        right_side_center_x = extents.frontRightTop.x
        right_side_center_y = (extents.backLeftBottom.y + extents.frontRightTop.y) / 2

        return (
            Point(right_side_center_x, right_side_center_y, well_exterior_bottom_z) * -1
        )

    else:
        raise InvalidLabwarePlacementError(
            feature_name="heaterShakerUniversalFlatAdapter",
            invalid_placement=ModuleOrientation.CENTER.value,
        )


def _screw_anchored_feature_to_child_origin(
    child_labware: LabwareDefinition3,
    underlying_ancestor_orientation: ModuleOrientation,
) -> Point:
    """Returns the offset from a `screwAnchoredAsChild` locating feature to the child origin."""
    screw_center = _get_screw_anchored_center_for_child(
        child_labware, underlying_ancestor_orientation
    )
    assert screw_center is not None

    screw_center_x = screw_center["x"]
    screw_center_y = screw_center["y"]
    screw_center_z = screw_center["z"]

    return Point(x=screw_center_x, y=screw_center_y, z=screw_center_z) * -1


def _get_child_labware_overlap_with_parent_labware(
    child_labware: LabwareDefinition, parent_labware_name: str
) -> Point:
    """Get the child labware's overlap with the parent labware's load name."""
    if isinstance(child_labware, LabwareDefinition3) and not hasattr(
        child_labware, "legacyStackingOffsetWithLabware"
    ):
        raise NotImplementedError(
            f"Labware {child_labware.metadata.displayName} contains no legacyStackingOffsetWithLabware. "
            f"Either add this property explictly on the definition or update your protocol's API Level."
        )

    overlap = (
        child_labware.stackingOffsetWithLabware.get(parent_labware_name)
        if isinstance(child_labware, LabwareDefinition2)
        else child_labware.legacyStackingOffsetWithLabware.get(parent_labware_name)
    )

    if overlap is None:
        overlap = (
            child_labware.stackingOffsetWithLabware.get("default")
            if isinstance(child_labware, LabwareDefinition2)
            else child_labware.legacyStackingOffsetWithLabware.get("default")
        )

    if overlap is None:
        if isinstance(child_labware, LabwareDefinition3):
            raise ValueError(
                f"No default labware overlap specified for parent labware: {parent_labware_name} "
                f"in legacyStackingOffsetWithLabware."
            )
        else:
            raise ValueError(
                f"No default labware overlap specified for parent labware: {parent_labware_name} "
                f"in stackingOffsetWithLabware."
            )
    else:
        return Point.from_xyz_attrs(overlap)


def _get_child_labware_overlap_with_parent_module(
    child_labware: LabwareDefinition,
    parent_module_model: ModuleModel,
    deck_definition: DeckDefinitionV5,
) -> Point:
    """Get the child labware's overlap with the parent module model."""
    child_labware_overlap = child_labware.stackingOffsetWithModule.get(
        str(parent_module_model.value)
    )
    if not child_labware_overlap:
        if _is_thermocycler_on_ot2(parent_module_model, deck_definition):
            return _OFFSET_ON_TC_OT2
        else:
            return Point(x=0, y=0, z=0)

    return Point.from_xyz_attrs(child_labware_overlap)


def _feature_exception_offsets(
    parent_deck_item: _LabwareStackupDefinition,
    deck_definition: DeckDefinitionV5,
) -> Point:
    """These offsets are intended for legacy reasons only and should generally be avoided post labware schema 2.

    If you need to make exceptions for a parent-child stackup, use the `custom` locating feature.
    """
    if isinstance(parent_deck_item, ModuleDefinition) and _is_thermocycler_on_ot2(
        parent_deck_item.model, deck_definition
    ):
        return _OFFSET_ON_TC_OT2
    else:
        return Point(x=0, y=0, z=0)


def _is_thermocycler_on_ot2(
    parent_module_model: ModuleModel,
    deck_definition: DeckDefinitionV5,
) -> bool:
    """Whether the given parent module is a thermocycler with the current deck being an OT2 deck."""
    robot_model = deck_definition["robot"]["model"]
    return (
        parent_module_model
        in [ModuleModel.THERMOCYCLER_MODULE_V1, ModuleModel.THERMOCYCLER_MODULE_V2]
        and robot_model == "OT-2 Standard"
    )


def _get_labware_footprint_as_child(
    labware: LabwareDefinition3,
) -> SlotFootprintAsChildFeature:
    """Get the SlotFootprintAsChildFeature for labware definitions."""
    footprint_as_child = labware.features.get("slotFootprintAsChild")
    if footprint_as_child is None:
        raise MissingLocatingFeatureError(
            labware_name=labware.metadata.displayName,
            required_feature="slotFootprintAsChild",
        )
    else:
        return footprint_as_child


def _total_nominal_gripper_offsets(
    stackup_lw_info_top_to_bottom: list[tuple[LabwareDefinition, LabwareLocation]],
    slot_name: DeckSlotName,
    deck_definition: DeckDefinitionV5,
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
) -> _GripperOffsets:
    """Get the total of the offsets to be used to pick up and drop labware."""
    top_most_lw_definition, top_most_lw_location = stackup_lw_info_top_to_bottom[0]
    special_offsets = _get_special_gripper_offsets(
        stackup_lw_info_top_to_bottom, underlying_ancestor_definition
    )

    if isinstance(
        top_most_lw_location,
        (ModuleLocation, DeckSlotLocation, AddressableAreaLocation),
    ):
        offsets = _nominal_gripper_offsets_for_location(
            labware_location=top_most_lw_location,
            labware_definition=top_most_lw_definition,
            slot_name=slot_name,
            deck_definition=deck_definition,
            underlying_ancestor_definition=underlying_ancestor_definition,
        )

        pick_up_offset = Point.from_xyz_attrs(offsets.pickUpOffset)
        drop_offset = Point.from_xyz_attrs(offsets.dropOffset)

        return _GripperOffsets(
            pick_up_offset=pick_up_offset + special_offsets.pick_up_offset,
            drop_offset=drop_offset + special_offsets.drop_offset,
        )
    else:
        # If it's a labware on a labware (most likely an adapter),
        # we calculate the offset as sum of offsets for the direct parent labware
        # and the underlying non-labware parent location.
        direct_parent_def, direct_parent_loc = stackup_lw_info_top_to_bottom[1]
        direct_parent_offsets = _nominal_gripper_offsets_for_location(
            labware_location=direct_parent_loc,
            labware_definition=direct_parent_def,
            slot_name=slot_name,
            deck_definition=deck_definition,
            underlying_ancestor_definition=underlying_ancestor_definition,
        )

        top_most_offsets = _nominal_gripper_offsets_for_location(
            labware_location=top_most_lw_location,
            labware_definition=top_most_lw_definition,
            slot_name=slot_name,
            deck_definition=deck_definition,
            underlying_ancestor_definition=underlying_ancestor_definition,
        )

        pick_up_offset = Point.from_xyz_attrs(
            direct_parent_offsets.pickUpOffset
        ) + Point.from_xyz_attrs(top_most_offsets.pickUpOffset)
        drop_offset = Point.from_xyz_attrs(
            direct_parent_offsets.dropOffset
        ) + Point.from_xyz_attrs(top_most_offsets.dropOffset)

        return _GripperOffsets(
            pick_up_offset=pick_up_offset + special_offsets.pick_up_offset,
            drop_offset=drop_offset + special_offsets.drop_offset,
        )


# TODO(jh, 08-15-25): Return _GripperOffsets instead of LabwareMovementOffsetData.
def _nominal_gripper_offsets_for_location(
    labware_location: LabwareLocation,
    labware_definition: LabwareDefinition,
    slot_name: DeckSlotName,
    deck_definition: DeckDefinitionV5,
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
) -> LabwareMovementOffsetData:
    """Provide the default gripper offset data for the given location type."""
    if isinstance(labware_location, (DeckSlotLocation, AddressableAreaLocation)):
        offsets = _get_deck_default_gripper_offsets(deck_definition)
    elif isinstance(labware_location, ModuleLocation):
        offsets = _get_module_default_gripper_offsets(underlying_ancestor_definition)  # type: ignore[arg-type]
    else:
        offsets = _labware_gripper_offsets(
            top_most_lw_definition=labware_definition, slot_name=slot_name
        )
    return offsets or LabwareMovementOffsetData(
        pickUpOffset=LabwareOffsetVector(x=0, y=0, z=0),
        dropOffset=LabwareOffsetVector(x=0, y=0, z=0),
    )


def _get_deck_default_gripper_offsets(
    deck_definition: DeckDefinitionV5,
) -> Optional[LabwareMovementOffsetData]:
    """Get the deck's default gripper offsets."""
    parsed_offsets = deck_definition.get("gripperOffsets", {}).get("default")
    return (
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(
                x=parsed_offsets["pickUpOffset"]["x"],
                y=parsed_offsets["pickUpOffset"]["y"],
                z=parsed_offsets["pickUpOffset"]["z"],
            ),
            dropOffset=LabwareOffsetVector(
                x=parsed_offsets["dropOffset"]["x"],
                y=parsed_offsets["dropOffset"]["y"],
                z=parsed_offsets["dropOffset"]["z"],
            ),
        )
        if parsed_offsets
        else None
    )


def _get_module_default_gripper_offsets(
    module_definition: ModuleDefinition,
) -> Optional[LabwareMovementOffsetData]:
    """Get the deck's default gripper offsets."""
    offsets = module_definition.gripperOffsets
    return offsets.get("default") if offsets else None


def _labware_gripper_offsets(
    top_most_lw_definition: LabwareDefinition, slot_name: DeckSlotName
) -> Optional[LabwareMovementOffsetData]:
    """Provide the most appropriate gripper offset data for the specified labware.

    We check the types of gripper offsets available for the labware ("default" or slot-based)
    and return the most appropriate one for the overall location of the labware.
    Currently, only module adapters (specifically, the H/S universal flat adapter)
    have non-default offsets that are specific to location of the module on deck,
    so, this code only checks for the presence of those known offsets.
    """
    slot_based_offset = _get_child_gripper_offsets(
        top_most_lw_definition=top_most_lw_definition, slot_name=slot_name
    )
    return slot_based_offset or _get_child_gripper_offsets(
        top_most_lw_definition=top_most_lw_definition, slot_name=None
    )


def _get_child_gripper_offsets(
    top_most_lw_definition: LabwareDefinition,
    slot_name: DeckSlotName | None,
) -> Optional[LabwareMovementOffsetData]:
    """Get the grip offsets that a labware says should be applied to children stacked atop it.

    If `slot_name` is provided, returns the gripper offsets that the parent labware definition
    specifies just for that slot, or `None` if the labware definition doesn't have an
    exact match.

    If `slot_name` is `None`, returns the gripper offsets that the parent labware
    definition designates as "default," or `None` if it doesn't designate any as such.
    """
    parsed_offsets = top_most_lw_definition.gripperOffsets
    offset_key = slot_name.id if slot_name else "default"

    if parsed_offsets is None or offset_key not in parsed_offsets:
        return None
    else:
        return LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector.model_construct(
                x=parsed_offsets[offset_key].pickUpOffset.x,
                y=parsed_offsets[offset_key].pickUpOffset.y,
                z=parsed_offsets[offset_key].pickUpOffset.z,
            ),
            dropOffset=LabwareOffsetVector.model_construct(
                x=parsed_offsets[offset_key].dropOffset.x,
                y=parsed_offsets[offset_key].dropOffset.y,
                z=parsed_offsets[offset_key].dropOffset.z,
            ),
        )


def _get_special_gripper_offsets(
    stackup_lw_info_top_to_bottom: list[tuple[LabwareDefinition, LabwareLocation]],
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
) -> _GripperOffsets:
    """Handles all special-cased gripper offsets."""
    tc_lid_offsets = (
        _get_tc_lid_gripper_offsets(
            stackup_lw_info_top_to_bottom, underlying_ancestor_definition
        )
    ) or _GripperOffsets(drop_offset=Point(), pick_up_offset=Point())

    ar_lid_offsets = (
        _get_absorbance_reader_lid_gripper_offsets(stackup_lw_info_top_to_bottom)
    ) or _GripperOffsets(drop_offset=Point(), pick_up_offset=Point())

    return _GripperOffsets(
        pick_up_offset=tc_lid_offsets.pick_up_offset + ar_lid_offsets.pick_up_offset,
        drop_offset=tc_lid_offsets.pick_up_offset + ar_lid_offsets.drop_offset,
    )


def _get_tc_lid_gripper_offsets(
    stackup_lw_info_top_to_bottom: list[tuple[LabwareDefinition, LabwareLocation]],
    underlying_ancestor_definition: LabwareStackupAncestorDefinition,
) -> _GripperOffsets | None:
    top_most_lw_def, top_most_lw_loc = stackup_lw_info_top_to_bottom[0]

    if isinstance(top_most_lw_loc, OnLabwareLocation):
        bottom_most_lw_location = stackup_lw_info_top_to_bottom[-1][1]

        # This is done as a workaround for some TC geometry inaccuracies.
        # See PLAT-579 for context.
        if (
            isinstance(bottom_most_lw_location, ModuleLocation)
            and getattr(underlying_ancestor_definition, "model", None)
            == ModuleModel.THERMOCYCLER_MODULE_V2
            and validate_definition_is_lid(top_most_lw_def)
        ):
            # It is intentional to use the `pickUpOffset` in both the gripper pick up and drop cases.
            if "lidOffsets" in top_most_lw_def.gripperOffsets.keys():
                offset = Point(
                    x=top_most_lw_def.gripperOffsets["lidOffsets"].pickUpOffset.x,
                    y=top_most_lw_def.gripperOffsets["lidOffsets"].pickUpOffset.y,
                    z=top_most_lw_def.gripperOffsets["lidOffsets"].pickUpOffset.z,
                )
                return _GripperOffsets(pick_up_offset=offset, drop_offset=offset)
            else:
                raise LabwareOffsetDoesNotExistError(
                    f"Labware Definition {top_most_lw_def.parameters.loadName} does not contain required field 'lidOffsets' of 'gripperOffsets'."
                )

    return None


def _get_absorbance_reader_lid_gripper_offsets(
    stackup_lw_info_top_to_bottom: list[tuple[LabwareDefinition, LabwareLocation]],
) -> _GripperOffsets | None:
    top_most_lw_definition = stackup_lw_info_top_to_bottom[0][0]
    load_name = top_most_lw_definition.parameters.loadName

    if is_absorbance_reader_lid(load_name):
        # todo(mm, 2024-11-06): This is only correct in the special case of an
        # absorbance reader lid. Its definition currently puts the offsets for *itself*
        # in the property that's normally meant for offsets for its *children.*
        offsets = _get_child_gripper_offsets(top_most_lw_definition, slot_name=None)

        if offsets is None:
            raise ValueError(
                "Expected gripper offsets for absorbance reader lid to be defined."
            )
        else:
            return _GripperOffsets(
                pick_up_offset=Point.from_xyz_attrs(offsets.pickUpOffset),
                drop_offset=Point.from_xyz_attrs(offsets.dropOffset),
            )

    else:
        return None
