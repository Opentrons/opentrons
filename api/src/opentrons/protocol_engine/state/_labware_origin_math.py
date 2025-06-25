"""Utilities for calculating the labware origin offset position."""
from typing import Union, overload

from typing_extensions import assert_type

from opentrons.types import Point
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
)
from opentrons_shared_data.labware.types import (
    SlotFootprintAsChildFeature,
)
from opentrons_shared_data.deck.types import DeckDefinitionV5
from ..types import (
    LabwareParentDefinition,
    ModuleDefinition,
    ModuleModel,
    DeckLocationDefinition,
    LabwareLocation,
    ModuleLocation,
    DeckSlotLocation,
    AddressableAreaLocation,
    OnLabwareLocation,
)


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: ModuleDefinition,
    module_parent_to_child_offset: Point,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: ModuleLocation,
) -> Point:
    ...


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: DeckLocationDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: Union[DeckSlotLocation, AddressableAreaLocation],
) -> Point:
    ...


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: LabwareDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: OnLabwareLocation,
) -> Point:
    ...


def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: LabwareParentDefinition,
    module_parent_to_child_offset: Union[Point, None],
    deck_definition: DeckDefinitionV5,
    is_topmost_labware: bool,
    labware_location: LabwareLocation,
) -> Point:
    """Returns the offset from parent entity's placement origin to child labware origin.

    Placement origin varies depending on the parent entity type (labware v3 are the back left bottom, and
    labware v2, modules, & deck location types are the front left bottom).

    Only parent-child specific offsets are calculated. Offsets that apply to a single entity
    (ex., module cal) or the entire stackup (ex., LPC) are handled elsewhere.
    """
    parent_deck_item_origin_to_child_labware_placement_origin = (
        _get_parent_deck_item_origin_to_child_labware_placement_origin(
            child_labware=child_labware,
            parent_deck_item=parent_deck_item,
            module_parent_to_child_offset=module_parent_to_child_offset,
            deck_definition=deck_definition,
            labware_location=labware_location,
        )
    )

    if isinstance(child_labware, LabwareDefinition2):
        # For v2 definitions, cornerOffsetFromSlot is the parent entity placement origin to child labware origin offset.
        # For compatibility with historical (buggy?) behavior,
        # we only consider it when the child labware is the topmost labware in a stackup.
        parent_deck_item_origin_to_child_labware_origin = (
            Point.from_xyz_attrs(child_labware.cornerOffsetFromSlot)
            if is_topmost_labware
            else Point(0, 0, 0)
        )

        return (
            parent_deck_item_origin_to_child_labware_placement_origin
            + parent_deck_item_origin_to_child_labware_origin
        )
    else:
        # For v3 definitions, get the vector from the back left bottom to the front right bottom.
        assert_type(child_labware, LabwareDefinition3)

        if isinstance(parent_deck_item, LabwareDefinition2):
            raise NotImplementedError()

        parent_deck_item_origin_to_child_labware_origin = (
            _get_back_left_bottom_position(child_labware) * -1
        )

        return (
            parent_deck_item_origin_to_child_labware_placement_origin
            + parent_deck_item_origin_to_child_labware_origin
        )


def _get_parent_deck_item_origin_to_child_labware_placement_origin(
    child_labware: LabwareDefinition,
    parent_deck_item: LabwareParentDefinition,
    module_parent_to_child_offset: Union[Point, None],
    deck_definition: DeckDefinitionV5,
    labware_location: LabwareLocation,
) -> Point:
    """Get the offset vector from parent entity origin to child labware placement origin."""
    if isinstance(labware_location, (DeckSlotLocation, AddressableAreaLocation)):
        return Point(x=0, y=0, z=0)

    elif isinstance(labware_location, ModuleLocation):
        assert isinstance(parent_deck_item, ModuleDefinition)
        assert module_parent_to_child_offset is not None

        child_labware_overlap_with_parent_deck_item = (
            _get_child_labware_overlap_with_parent_module(
                child_labware=child_labware,
                parent_module_model=parent_deck_item.model,
                deck_definition=deck_definition,
            )
        )

        module_offset_point = Point.from_xyz_attrs(module_parent_to_child_offset)
        return module_offset_point - child_labware_overlap_with_parent_deck_item

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
            return Point(x=0, y=0, z=10.7)
        else:
            return Point(x=0, y=0, z=0)

    return Point.from_xyz_attrs(child_labware_overlap)


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


def _get_back_left_bottom_position(labware: LabwareDefinition3) -> Point:
    """Get the back left bottom position from a v3 labware definition."""
    footprint_as_child = _get_labware_footprint_as_child(labware)

    return Point(
        x=footprint_as_child["backLeft"]["x"],
        y=footprint_as_child["frontRight"]["y"],
        z=footprint_as_child["z"],
    )


def _get_labware_footprint_as_child(
    labware: LabwareDefinition3,
) -> SlotFootprintAsChildFeature:
    """Get the SlotFootprintAsChildFeature for labware definitions."""
    footprint_as_child = labware.features.get("slotFootprintAsChild")
    if footprint_as_child is None:
        raise ValueError(
            f"Expected labware {labware.metadata.displayName} to have a SlotFootprintAsChild feature"
        )
    else:
        return footprint_as_child
