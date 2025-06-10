"""Utilities for calculating the labware origin offset position."""
from typing import Union, overload

from typing_extensions import assert_type

from opentrons.types import Point
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
    Vector3D,
)
from opentrons_shared_data.deck.types import DeckDefinitionV5
from ..types import (
    LabwareParentDefinition,
    ModuleDefinition,
    ModuleModel,
    AddressableArea,
    LabwareOffsetVector,
    DeckLocationDefinition,
)


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: ModuleDefinition,
    module_parent_to_child_offset: LabwareOffsetVector,
    deck_definition: DeckDefinitionV5,
) -> Point:
    ...


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: DeckLocationDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
) -> Point:
    ...


@overload
def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: LabwareDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
) -> Point:
    ...


def get_parent_placement_origin_to_lw_origin(
    child_labware: LabwareDefinition,
    parent_entity: LabwareParentDefinition,
    module_parent_to_child_offset: Union[LabwareOffsetVector, None],
    deck_definition: DeckDefinitionV5,
) -> Point:
    """Returns the offset from parent entity's placement origin to child labware origin.

    Placement origin varies depending on the parent entity type (labware v3 are the back left bottom, and
    labware v2, modules, & deck location types are the front left bottom).

    Only parent-child specific offsets are calculated. Offsets that apply to a single entity
    (ex., module cal) or the entire stackup (ex., LPC) are handled elsewhere.
    """
    if isinstance(child_labware, LabwareDefinition2):
        # For v2 definitions, cornerOffsetFromSlot is the parent entity placement origin to child labware origin offset.
        parent_entity_origin_to_child_labware_origin = Point(
            child_labware.cornerOffsetFromSlot.x,
            child_labware.cornerOffsetFromSlot.y,
            child_labware.cornerOffsetFromSlot.z,
        )
    else:
        # For v3 definitions, get the vector from the back left bottom to the front right bottom.
        assert_type(child_labware, LabwareDefinition3)
        parent_entity_origin_to_child_labware_origin = Point(
            x=-1 * child_labware.extents.footprint.backLeft.x,
            y=-1 * child_labware.extents.footprint.frontRight.y,
            z=-1 * child_labware.extents.total.backLeftBottom.z,
        )

    parent_entity_origin_to_child_labware_placement_origin = (
        _get_parent_entity_origin_to_child_labware_placement_origin(
            child_labware=child_labware,
            parent_entity=parent_entity,
            module_parent_to_child_offset=module_parent_to_child_offset,
            deck_definition=deck_definition,
        )
    )

    return (
        parent_entity_origin_to_child_labware_placement_origin
        + parent_entity_origin_to_child_labware_origin
    )


def _get_parent_entity_origin_to_child_labware_placement_origin(
    child_labware: LabwareDefinition,
    parent_entity: LabwareParentDefinition,
    module_parent_to_child_offset: Union[LabwareOffsetVector, None],
    deck_definition: DeckDefinitionV5,
) -> Point:
    """Get the offset vector from parent entity origin to child labware placement origin."""
    if isinstance(parent_entity, (LabwareDefinition2, LabwareDefinition3)):
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

    elif isinstance(parent_entity, ModuleDefinition):
        assert module_parent_to_child_offset is not None
        child_labware_overlap_with_parent_entity = (
            _get_child_labware_overlap_with_parent_module(
                child_labware=child_labware,
                parent_module_model=parent_entity.model,
                deck_definition=deck_definition,
            )
        )

        return Point(
            module_parent_to_child_offset.x
            - child_labware_overlap_with_parent_entity.x,
            module_parent_to_child_offset.y
            - child_labware_overlap_with_parent_entity.y,
            module_parent_to_child_offset.z
            - child_labware_overlap_with_parent_entity.z,
        )

    elif _is_deck_location(parent_entity):
        return Point(x=0, y=0, z=0)

    else:
        raise TypeError(f"Unsupported parent entity type: {parent_entity}")


def _get_child_labware_overlap_with_parent_labware(
    child_labware: LabwareDefinition, parent_labware_name: str
) -> Point:
    """Get the child labware's overlap with the parent labware's load name."""
    if parent_labware_name in child_labware.stackingOffsetWithLabware.keys():
        child_labware_overlap = child_labware.stackingOffsetWithLabware[
            parent_labware_name
        ]
    else:
        child_labware_overlap = child_labware.stackingOffsetWithLabware.get(
            "default", Vector3D(x=0, y=0, z=0)
        )
    return Point(
        x=child_labware_overlap.x, y=child_labware_overlap.y, z=child_labware_overlap.z
    )


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

    return Point(
        x=child_labware_overlap.x, y=child_labware_overlap.y, z=child_labware_overlap.z
    )


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


def _is_deck_location(parent_entity: LabwareParentDefinition) -> bool:
    """Check if parent entity is a deck location (AddressableArea or SlotDefV3)."""
    if isinstance(parent_entity, AddressableArea):
        return True

    elif (
        isinstance(parent_entity, dict)
        and "id" in parent_entity
        and "position" in parent_entity
        and "boundingBox" in parent_entity
        and "compatibleModuleTypes" in parent_entity
    ):
        return True

    return False
