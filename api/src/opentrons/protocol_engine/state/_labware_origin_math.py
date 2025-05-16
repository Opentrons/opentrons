"""Utilities for calculating the labware origin offset position."""
from typing_extensions import assert_type

from opentrons.types import Point
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
)

from ..types import (
    LoadedLabware,
    LabwareParentLocationInfo,
    AddressableArea,
    ModuleDefinition,
)


def get_parent_origin_to_lw_origin(
    labware_data: LoadedLabware,
    definition: LabwareDefinition,
    lw_parent_location_info: LabwareParentLocationInfo,
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

        parent_origin_to_locating_feature = _get_parent_origin_to_locating_feature(
            labware_data=labware_data,
            definition=definition,
            lw_parent_location_info=lw_parent_location_info,
        )

        locating_feature_to_lw_origin = _get_locating_feature_to_lw_origin(
            labware_data=labware_data,
            definition=definition,
            lw_parent_location_info=lw_parent_location_info,
        )

        return parent_origin_to_locating_feature + locating_feature_to_lw_origin


def _get_parent_origin_to_locating_feature(
    labware_data: LoadedLabware,
    definition: LabwareDefinition3,
    lw_parent_location_info: LabwareParentLocationInfo,
) -> Point:
    """Returns the offset from parent origin to the locating feature position."""
    if isinstance(lw_parent_location_info, LabwareDefinition2):
        return Point(0, 0, 0)

    # TOME TODO: Determine locating feature type from labware/parent definitions
    return _get_parent_origin_to_bottom_center(lw_parent_location_info)


def _get_locating_feature_to_lw_origin(
    labware_data: LoadedLabware,
    definition: LabwareDefinition3,
    lw_parent_location_info: LabwareParentLocationInfo,
) -> Point:
    """Returns the offset from the locating feature position to the labware origin."""
    if isinstance(lw_parent_location_info, LabwareDefinition2):
        return Point(0, 0, 0)

    # TOME TODO: Determine locating feature type from labware/parent definitions
    return _get_bottom_center_to_lw_origin(definition)


def _get_parent_origin_to_bottom_center(
    lw_parent_location_info: LabwareParentLocationInfo,
) -> Point:
    """Returns offset from parent origin to parent's bottom-center point."""
    if isinstance(lw_parent_location_info, LabwareDefinition2):
        return Point(0, 0, 0)

    elif isinstance(lw_parent_location_info, LabwareDefinition3):
        extents = lw_parent_location_info.extents.total
        return Point(
            x=extents.frontRightTop.x / 2,
            y=extents.frontRightTop.y / 2,
            z=extents.backLeftBottom.z,
        )

    # TODO(jh, 05-21-25): Ideally, we support extents in module/AA definitions, and we don't need an adapter.
    elif isinstance(lw_parent_location_info, AddressableArea):
        bounding_box = lw_parent_location_info.bounding_box
        return Point(
            x=bounding_box.x / 2,
            y=-1 * bounding_box.y / 2,
            z=0,
        )

    elif isinstance(lw_parent_location_info, ModuleDefinition):
        dimensions = lw_parent_location_info.dimensions
        return Point(
            x=dimensions.labwareInterfaceXDimension / 2,
            y=-1 * dimensions.labwareInterfaceYDimension / 2,
            z=0,
        )

    else:
        raise ValueError(f"Unsupported parent location info: {lw_parent_location_info}")


def _get_bottom_center_to_lw_origin(definition: LabwareDefinition3) -> Point:
    """Returns offset from labware's bottom-center point to labware origin."""
    extents = definition.extents.total
    lw_origin_to_bottom_center = Point(
        x=extents.frontRightTop.x / 2,
        y=extents.frontRightTop.y / 2,
        z=extents.backLeftBottom.z,
    )

    return -1 * lw_origin_to_bottom_center
