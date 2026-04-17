from opentrons_shared_data.labware.labware_definition import (
    ContainedSpace,
    LabwareDefinition,
    LabwareDefinition2,
)


def is_fully_contained(
    resident_def: LabwareDefinition, boundary_space: ContainedSpace
) -> bool:
    """Validates that the resident fits entirely within the boundary_space box.

    All coordinates are relative to the parent's (0,0,0).
    """
    # TODO: Add LabwareSchemaV3 support
    if not isinstance(resident_def, LabwareDefinition2):
        return True
    # Resident Extents (Standard labware starts at 0,0,0 relative to parent)
    res_min_x, res_max_x = 0.0, resident_def.dimensions.xDimension
    res_min_y, res_max_y = 0.0, resident_def.dimensions.yDimension
    res_min_z, res_max_z = 0.0, resident_def.dimensions.zDimension

    # Boundary Extents (The 'hole' defined in the JSON)
    bound_min_x = boundary_space.origin.x
    bound_max_x = bound_min_x + boundary_space.dimensions.xDimension

    bound_min_y = boundary_space.origin.y
    bound_max_y = bound_min_y + boundary_space.dimensions.yDimension

    bound_min_z = boundary_space.origin.z
    bound_max_z = bound_min_z + boundary_space.dimensions.zDimension

    # Logical Check: Resident must be bounded by the boundary planes
    return (
        res_min_x >= bound_min_x
        and res_max_x <= bound_max_x
        and res_min_y >= bound_min_y
        and res_max_y <= bound_max_y
        and res_min_z >= bound_min_z
        and res_max_z <= bound_max_z
    )
