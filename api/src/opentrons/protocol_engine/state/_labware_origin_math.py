"""Utilities for calculating the labware origin offset position."""
from typing_extensions import assert_type

from opentrons.types import Point
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
)


def get_parent_origin_to_lw_origin(
    definition: LabwareDefinition,
) -> Point:
    """Returns the offset from parent origin to labware origin."""
    if isinstance(definition, LabwareDefinition2):
        # For v2 definitions, cornerOffsetFromSlot is the parent origin to labware origin offset.
        return Point(
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

        return parent_origin_to_labware_origin
