"""Utilities for labware containment math."""

from opentrons_shared_data.labware.labware_definition import (
    ContainedSpace,
    LabwareDefinition,
    LabwareDefinition2,
)


def is_fully_contained(
    resident_def: LabwareDefinition, boundary_space: ContainedSpace
) -> bool:
    """Return True if the resident labware fits entirely inside the contained space."""
    # TODO: Add LabwareSchemaV3 support
    if not isinstance(resident_def, LabwareDefinition2):
        return True

    resident = resident_def.dimensions

    # Resident occupies [0, resident.xDimension] etc. in its own frame
    res_max_x = resident.xDimension
    res_max_y = resident.yDimension
    res_max_z = resident.zDimension

    # Boundary (the "hole") extents
    bound_min_x = boundary_space.origin.x
    bound_max_x = bound_min_x + boundary_space.dimensions.xDimension

    bound_min_y = boundary_space.origin.y
    bound_max_y = bound_min_y + boundary_space.dimensions.yDimension

    bound_min_z = boundary_space.origin.z
    bound_max_z = bound_min_z + boundary_space.dimensions.zDimension

    # Resident must be completely inside the boundary box
    return (
        res_max_x <= bound_max_x
        and res_max_y <= bound_max_y
        and res_max_z <= bound_max_z
        and res_max_x > 0
        and res_max_y > 0
        and res_max_z > 0
    )
