"""Utilities for calculating the labware origin offset position."""
from typing import Union, overload

from typing_extensions import assert_type

from opentrons.types import Point
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
)
from opentrons_shared_data.deck.types import DeckDefinitionV5, SlotDefV3
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
    definition: LabwareDefinition,
    parent_def: ModuleDefinition,
    module_parent_to_child_offset: LabwareOffsetVector,
    deck_definition: DeckDefinitionV5,
) -> Point:
    ...


@overload
def get_parent_placement_origin_to_lw_origin(
    definition: LabwareDefinition,
    parent_def: DeckLocationDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
) -> Point:
    ...


def get_parent_placement_origin_to_lw_origin(
    definition: LabwareDefinition,
    parent_def: LabwareDefinition,
    module_parent_to_child_offset: None,
    deck_definition: DeckDefinitionV5,
) -> Point:
    """Returns the offset from parent's placement origin to labware origin.

    Placement origin varies depending on the parent entity type (labware v3 are the back left bottom, and
    labware v2, modules, & deck location types are the front left bottom).

    Only parent-child specific offsets are calculated. Offsets that apply to a single entity
    (ex., module cal) or the entire stackup (ex., LPC) are handled elsewhere.
    """
    if isinstance(definition, LabwareDefinition2):
        # For v2 definitions, cornerOffsetFromSlot is the parent placement origin to labware origin offset.
        parent_origin_to_labware_origin = Point(
            definition.cornerOffsetFromSlot.x,
            definition.cornerOffsetFromSlot.y,
            definition.cornerOffsetFromSlot.z,
        )
    else:
        # For v3 definitions, get the vector from the back left bottom to the front right bottom.
        assert_type(definition, LabwareDefinition3)
        parent_origin_to_labware_origin = Point(
            x=-1 * definition.extents.footprint.backLeft.x,
            y=-1 * definition.extents.footprint.frontRight.y,
            z=-1 * definition.extents.total.backLeftBottom.z,
        )

    parent_origin_to_child_origin = _get_parent_origin_to_child_origin(
        child_def=definition,
        parent_def=parent_def,
        module_parent_to_child_offset=module_parent_to_child_offset,
        deck_definition=deck_definition,
    )

    return parent_origin_to_child_origin + parent_origin_to_labware_origin


def _get_parent_origin_to_child_origin(
    child_def: LabwareDefinition,
    parent_def: LabwareParentDefinition,
    module_parent_to_child_offset: Union[LabwareOffsetVector, None],
    deck_definition: DeckDefinitionV5,
) -> Point:
    """Get the offset vector of a labware placed on a given location."""
    if isinstance(parent_def, (LabwareDefinition2, LabwareDefinition3)):
        # TODO(jh, 06-05-25): This logic is slightly duplicative of LabwareView get_dimensions. Can we unify?
        if isinstance(parent_def, LabwareDefinition2):
            parent_dimension_z = parent_def.dimensions.zDimension
        else:
            assert_type(parent_def, LabwareDefinition3)
            parent_dimension_z = (
                parent_def.extents.total.frontRightTop.z
                - parent_def.extents.total.backLeftBottom.z
            )

        stacking_overlap = _get_labware_overlap_offsets(
            definition=child_def,
            below_labware_name=parent_def.parameters.loadName,
        )

        return Point(
            x=stacking_overlap.x,
            y=stacking_overlap.y,
            z=parent_dimension_z - stacking_overlap.z,
        )

    elif isinstance(parent_def, ModuleDefinition):
        stacking_overlap = _get_module_overlap_offsets(
            lw_def=child_def,
            module_model=parent_def.model,
            deck_definition=deck_definition,
        )

        return Point(
            module_parent_to_child_offset.x - stacking_overlap.x,
            module_parent_to_child_offset.y - stacking_overlap.y,
            module_parent_to_child_offset.z - stacking_overlap.z,
        )

    elif _is_deck_location(parent_def):
        return Point(x=0, y=0, z=0)

    else:
        raise TypeError(f"Unsupported parent location info: {parent_def}")


def _get_labware_overlap_offsets(
    definition: LabwareDefinition, below_labware_name: str
) -> Point:
    """Get the labware's overlap with requested labware's load name."""
    if below_labware_name in definition.stackingOffsetWithLabware.keys():
        stacking_overlap = definition.stackingOffsetWithLabware[below_labware_name]
    else:
        stacking_overlap = definition.stackingOffsetWithLabware.get(
            "default", Point(x=0, y=0, z=0)
        )
    return Point(x=stacking_overlap.x, y=stacking_overlap.y, z=stacking_overlap.z)


def _get_module_overlap_offsets(
    lw_def: LabwareDefinition,
    module_model: ModuleModel,
    deck_definition: DeckDefinitionV5,
) -> Point:
    """Get the labware's overlap with requested module model."""
    stacking_overlap = lw_def.stackingOffsetWithModule.get(str(module_model.value))
    if not stacking_overlap:
        if _is_thermocycler_on_ot2(module_model, deck_definition):
            return Point(x=0, y=0, z=10.7)
        else:
            return Point(x=0, y=0, z=0)

    return Point(x=stacking_overlap.x, y=stacking_overlap.y, z=stacking_overlap.z)


def _is_thermocycler_on_ot2(
    module_model: ModuleModel,
    deck_definition: DeckDefinitionV5,
) -> bool:
    """Whether the given module is a thermocycler with the current deck being an OT2 deck."""
    robot_model = deck_definition["robot"]["model"]
    return (
        module_model
        in [ModuleModel.THERMOCYCLER_MODULE_V1, ModuleModel.THERMOCYCLER_MODULE_V2]
        and robot_model == "OT-2 Standard"
    )


def _is_deck_location(parent_def: LabwareParentDefinition) -> bool:
    """Check if parent_def is a deck location (AddressableArea or SlotDefV3)."""
    if isinstance(parent_def, AddressableArea):
        return True

    elif (
        isinstance(parent_def, dict)
        and "id" in parent_def
        and "position" in parent_def
        and "position" in parent_def
        and "boundingBox" in parent_def
        and "compatibleModuleTypes" in parent_def
    ):
        return True

    return False
