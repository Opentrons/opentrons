"""Utilities for calculating the labware origin offset position."""
from dataclasses import dataclass
from typing import Union, overload

from typing_extensions import assert_type

from opentrons.types import Point
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
    Vector3D,
)
from opentrons_shared_data.labware.types import LocatingFeatures
from opentrons_shared_data.deck.types import DeckDefinitionV5, SlotDefV3
from ..types import (
    LabwareParentDefinition,
    ModuleDefinition,
    ModuleModel,
    LabwareOffsetVector,
    ModuleLocation,
    DeckSlotLocation,
    AddressableAreaLocation,
    OnLabwareLocation,
    AddressableArea,
)

_LabwareOriginLocation = Union[
    ModuleLocation, DeckSlotLocation, AddressableAreaLocation, OnLabwareLocation
]


@dataclass()
class _Point2D:
    x: float = 0.0
    y: float = 0.0


@dataclass()
class _BoundingBox2D:
    back_left: _Point2D
    front_right: _Point2D


@dataclass()
class _ParentEntityInfo:
    locating_features_as_parent: LocatingFeatures
    child_contact_plane: Union[_BoundingBox2D, None] = None
    """The parent entity's 2D plane on which the labware resides."""


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: ModuleDefinition,
    module_parent_to_child_offset: LabwareOffsetVector,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: ModuleLocation,
) -> Point:
    ...


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: SlotDefV3,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: DeckSlotLocation,
) -> Point:
    ...


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: AddressableArea,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: AddressableAreaLocation,
) -> Point:
    ...


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: LabwareDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: OnLabwareLocation,
) -> Point:
    ...


def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: LabwareParentDefinition,
    module_parent_to_child_offset: Union[LabwareOffsetVector, None],
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: _LabwareOriginLocation,
) -> Point:
    """Returns the offset from parent entity's placement origin to child labware origin.

    Placement origin varies depending on the parent entity type (labware v3 are the back left bottom, and
    labware v2, modules, & deck location types are the front left bottom).

    Only parent-child specific offsets are calculated. Offsets that apply to a single entity
    (ex., module cal) or the entire stackup (ex., LPC) are handled elsewhere.
    """
    parent_entity_origin_to_child_labware_placement_origin = (
        _get_parent_entity_origin_to_child_labware_placement_origin(
            child_labware=child_labware,
            parent_entity=parent_entity,
            module_parent_to_child_offset=module_parent_to_child_offset,
            deck_definition=deck_definition,
            labware_location=labware_location,
        )
    )

    if isinstance(child_labware, LabwareDefinition2):
        # For v2 definitions, cornerOffsetFromSlot is the parent entity placement origin to child labware origin offset.
        # For compatibility with historical (buggy?) behavior,
        # we only consider it when the child labware is the topmost labware in a stackup.
        parent_entity_origin_to_child_labware_origin = (
            _to_point(child_labware.cornerOffsetFromSlot)
            if is_topmost_labware
            else Point(0, 0, 0)
        )

        return (
            parent_entity_origin_to_child_labware_placement_origin
            + parent_entity_origin_to_child_labware_origin
        )
    else:
        # For v3 definitions, get the vector from the back left bottom to the front right bottom.
        assert_type(child_labware, LabwareDefinition3)

        parent_origin_to_locating_feature = _get_parent_origin_to_locating_feature(
            parent_entity_info=_get_parent_entity_info(parent_entity, labware_location),  # type: ignore[arg-type]
        )
        locating_feature_to_lw_origin = _get_locating_feature_to_lw_origin(
            child_labware,
        )

        return (
            parent_entity_origin_to_child_labware_placement_origin
            + parent_origin_to_locating_feature
            + locating_feature_to_lw_origin
        )


def _get_parent_entity_origin_to_child_labware_placement_origin(
    child_labware: LabwareDefinition,
    parent_entity: LabwareParentDefinition,
    module_parent_to_child_offset: Union[LabwareOffsetVector, None],
    deck_definition: DeckDefinitionV5,
    labware_location: _LabwareOriginLocation,
) -> Point:
    """Get the offset vector from parent entity origin to child labware placement origin."""
    if isinstance(labware_location, (DeckSlotLocation, AddressableAreaLocation)):
        return Point(x=0, y=0, z=0)

    elif isinstance(labware_location, ModuleLocation):
        assert isinstance(parent_entity, ModuleDefinition)
        assert module_parent_to_child_offset is not None

        child_labware_overlap_with_parent_entity = (
            _get_child_labware_overlap_with_parent_module(
                child_labware=child_labware,
                parent_module_model=parent_entity.model,
                deck_definition=deck_definition,
            )
        )

        module_offset_point = _to_point_from_lw_offset_vector(
            module_parent_to_child_offset
        )
        return module_offset_point - child_labware_overlap_with_parent_entity

    elif isinstance(labware_location, OnLabwareLocation):
        assert isinstance(parent_entity, (LabwareDefinition2, LabwareDefinition3))

        # TODO(jh, 06-05-25): This logic is slightly duplicative of LabwareView get_dimensions. Can we unify?
        if isinstance(parent_entity, LabwareDefinition2):
            parent_entity_height = parent_entity.dimensions.zDimension
        else:
            assert_type(parent_entity, LabwareDefinition3)
            parent_entity_height = (
                parent_entity.extents.total.frontRightTop.z
                - parent_entity.extents.total.backLeftBottom.z
            )

        child_labware_overlap_with_parent_entity = (
            _get_child_labware_overlap_with_parent_labware(
                child_labware=child_labware,
                parent_labware_name=parent_entity.parameters.loadName,
            )
        )

        return Point(
            x=child_labware_overlap_with_parent_entity.x,
            y=child_labware_overlap_with_parent_entity.y,
            z=parent_entity_height - child_labware_overlap_with_parent_entity.z,
        )

    else:
        raise TypeError(f"Unsupported labware location type: {labware_location}")


def _get_parent_origin_to_locating_feature(
    parent_entity_info: _ParentEntityInfo,
) -> Point:
    """Returns the offset from parent origin to the locating feature position."""
    return _get_parent_origin_to_bottom_center(parent_entity_info)


def _get_locating_feature_to_lw_origin(
    child_labware: LabwareDefinition3,
) -> Point:
    """Returns the offset from the locating feature position to the labware origin."""
    return _get_bottom_center_to_lw_origin(child_labware)


@overload
def _get_parent_entity_info(
    parent_entity: ModuleDefinition,
    labware_location: ModuleLocation,
) -> _ParentEntityInfo:
    ...


@overload
def _get_parent_entity_info(
    parent_entity: Union[LabwareDefinition2, LabwareDefinition3],
    labware_location: OnLabwareLocation,
) -> _ParentEntityInfo:
    ...


@overload
def _get_parent_entity_info(
    parent_entity: SlotDefV3,
    labware_location: DeckSlotLocation,
) -> _ParentEntityInfo:
    ...


@overload
def _get_parent_entity_info(
    parent_entity: AddressableArea,
    labware_location: DeckSlotLocation,
) -> _ParentEntityInfo:
    ...


def _get_parent_entity_info(
    parent_entity: LabwareParentDefinition,
    labware_location: _LabwareOriginLocation,
) -> _ParentEntityInfo:
    """Returns a standardized interface of relevant parent entity information given various parent entity types."""
    if isinstance(labware_location, OnLabwareLocation):
        assert isinstance(parent_entity, (LabwareDefinition2, LabwareDefinition3))

        if isinstance(parent_entity, LabwareDefinition2):
            raise NotImplementedError()
        else:
            total = parent_entity.extents.total
            back_left = _Point2D(x=total.backLeftBottom.x, y=total.backLeftBottom.y)
            front_right = _Point2D(x=total.frontRightTop.x, y=total.frontRightTop.y)
            contact_plane = _BoundingBox2D(back_left=back_left, front_right=front_right)

            return _ParentEntityInfo(
                child_contact_plane=contact_plane,
                locating_features_as_parent=parent_entity.locatingFeaturesAsParent,
            )

    elif isinstance(labware_location, ModuleLocation):
        assert isinstance(parent_entity, ModuleDefinition)

        dimensions = parent_entity.dimensions
        x_dim = dimensions.labwareInterfaceXDimension
        y_dim = dimensions.labwareInterfaceYDimension

        if x_dim is None or y_dim is None:
            return _ParentEntityInfo(
                locating_features_as_parent=parent_entity.locatingFeaturesAsParent
            )
        else:
            back_left = _Point2D(0, 0)
            front_right = _Point2D(x=x_dim, y=y_dim * -1)
            contact_plane = _BoundingBox2D(back_left=back_left, front_right=front_right)

            return _ParentEntityInfo(
                child_contact_plane=contact_plane,
                locating_features_as_parent=parent_entity.locatingFeaturesAsParent,
            )

    elif isinstance(labware_location, AddressableAreaLocation):
        assert isinstance(parent_entity, AddressableArea)
        back_left = _Point2D(0, 0)
        front_right = _Point2D(
            x=parent_entity.bounding_box.x,
            y=parent_entity.bounding_box.y * -1,
        )
        contact_plane = _BoundingBox2D(back_left=back_left, front_right=front_right)

        return _ParentEntityInfo(
            child_contact_plane=contact_plane,
            locating_features_as_parent=parent_entity.locating_features_as_parent,
        )

    elif isinstance(labware_location, DeckSlotLocation):
        definition_bounding_box = _Point2D(
            parent_entity["boundingBox"]["xDimension"],  # type: ignore[index]
            parent_entity["boundingBox"]["yDimension"],  # type: ignore[index]
        )

        back_left = _Point2D(0, 0)
        front_right = _Point2D(
            x=definition_bounding_box.x,
            y=definition_bounding_box.y * -1,
        )
        contact_plane = _BoundingBox2D(back_left=back_left, front_right=front_right)
        locating_features_as_parent = parent_entity["locatingFeaturesAsParent"]  # type: ignore[index]

        return _ParentEntityInfo(
            child_contact_plane=contact_plane,
            locating_features_as_parent=locating_features_as_parent,
        )
    else:
        raise TypeError(f"Unsupported labware location type: {labware_location}")


def _get_parent_origin_to_bottom_center(
    parent_entity_info: _ParentEntityInfo,
) -> Point:
    """Returns offset from parent origin to parent's bottom-center point."""
    child_contact_plane = parent_entity_info.child_contact_plane

    if child_contact_plane is None:
        raise ValueError(
            "Bottom center locating feature is not supported when no child labware contact plane is defined."
        )
    else:
        x = child_contact_plane.front_right.x / 2
        y = child_contact_plane.front_right.y / 2
        z = 0

        return Point(x, y, z)


def _get_child_labware_overlap_with_parent_labware(
    child_labware: LabwareDefinition, parent_labware_name: str
) -> Point:
    """Get the child labware's overlap with the parent labware's load name."""
    overlap = child_labware.stackingOffsetWithLabware.get(parent_labware_name)

    if overlap is None:
        overlap = child_labware.stackingOffsetWithLabware.get("default")

    if overlap is None:
        raise ValueError(
            f"No default labware overlap specified for parent labware: {parent_labware_name}"
        )
    else:
        return _to_point(overlap)


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
            return Point(x=0, y=0, z=10.7)
        else:
            return Point(x=0, y=0, z=0)

    return _to_point(child_labware_overlap)


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


def _get_bottom_center_to_lw_origin(child_labware: LabwareDefinition3) -> Point:
    """Returns offset from labware's bottom-center point to labware origin."""
    extents = child_labware.extents.total
    lw_origin_to_bottom_center = Point(
        x=extents.frontRightTop.x / 2,
        y=extents.frontRightTop.y / 2,
        z=extents.backLeftBottom.z,
    )

    return -1 * lw_origin_to_bottom_center


def _to_point(vector: Vector3D) -> Point:
    """Convert a Vector3D to a Point."""
    return Point(x=vector.x, y=vector.y, z=vector.z)


def _to_point_from_lw_offset_vector(offset_vector: LabwareOffsetVector) -> Point:
    """Convert a LabwareOffsetVector to a Point."""
    return Point(x=offset_vector.x, y=offset_vector.y, z=offset_vector.z)
