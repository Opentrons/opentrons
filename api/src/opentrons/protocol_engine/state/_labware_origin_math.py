"""Utilities for calculating the labware origin offset position."""
from typing import Union

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
)


def get_parent_origin_to_lw_origin(
    definition: LabwareDefinition,
    parent_def: LabwareParentDefinition,
    parent_as_module_to_child_offset: Union[Point, None],
    deck_definition: DeckDefinitionV5,
) -> Point:
    """Returns the offset from parent origin to labware origin.

    Only parent-child specific offsets are calculated. Offsets that apply to a single entity
    (ex., module cal) or the entire stackup (ex., LPC) are handled elsewhere.
    """
    if isinstance(definition, LabwareDefinition2):
        # For v2 definitions, cornerOffsetFromSlot is the parent origin to labware origin offset.
        parent_origin_to_labware_origin = Point(
            definition.cornerOffsetFromSlot.x,
            definition.cornerOffsetFromSlot.y,
            definition.cornerOffsetFromSlot.z,
        )
    else:
        assert_type(definition, LabwareDefinition3)
        labware_origin_to_parent_origin = Point(
            x=definition.extents.footprint.backLeft.x,
            y=definition.extents.footprint.frontRight.y,
            z=definition.extents.total.backLeftBottom.z,
        )
        parent_origin_to_labware_origin = -1 * labware_origin_to_parent_origin

    parent_to_child_offset = _get_parent_to_child_offset(
        child_def=definition,
        parent_def=parent_def,
        parent_as_module_to_child_offset=parent_as_module_to_child_offset,
        deck_definition=deck_definition,
    )

    return parent_origin_to_labware_origin + parent_to_child_offset


def _get_parent_to_child_offset(
    child_def: LabwareDefinition,
    parent_def: LabwareParentDefinition,
    parent_as_module_to_child_offset: Union[Point, None],
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
        if parent_as_module_to_child_offset is None:
            raise ValueError("Expected parent_as_module_to_child_offset")
        else:
            stacking_overlap = _get_module_overlap_offsets(
                lw_def=child_def,
                module_model=parent_def.model,
                deck_definition=deck_definition,
            )

            return parent_as_module_to_child_offset - stacking_overlap

    elif _is_deck_location(parent_def):
        return Point(x=0, y=0, z=0)

    else:
        raise ValueError(f"Unsupported parent location info: {parent_def}")


def _get_labware_overlap_offsets(
    definition: LabwareDefinition, below_labware_name: str
) -> Point:
    """Get the labware's overlap with requested labware's load name."""
    if below_labware_name in definition.stackingOffsetWithLabware.keys():
        stacking_overlap = definition.stackingOffsetWithLabware.get(
            below_labware_name, Point(x=0, y=0, z=0)
        )
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
