"""Utilities for calculating the labware origin offset position."""
from typing_extensions import assert_type

from opentrons.types import Point
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
)
from opentrons_shared_data.labware.types import LocatingFeatureKeys

from ..types import (
    LoadedLabware,
    LabwareParentLocationInfo,
    AddressableArea,
    ModuleDefinition,
    OverlapOffset,
    ModuleModel,
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
        custom_offset = _get_custom_offset(definition, lw_parent_location_info)

        if custom_offset is not None:
            return custom_offset
        else:
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


def get_labware_overlap_offsets(
    definition: LabwareDefinition, below_labware_name: str
) -> OverlapOffset:
    """Get the labware's overlap with requested labware's load name."""
    if below_labware_name in definition.stackingOffsetWithLabware.keys():
        stacking_overlap = definition.stackingOffsetWithLabware.get(
            below_labware_name, OverlapOffset(x=0, y=0, z=0)
        )
    else:
        stacking_overlap = definition.stackingOffsetWithLabware.get(
            "default", OverlapOffset(x=0, y=0, z=0)
        )
    return OverlapOffset(
        x=stacking_overlap.x, y=stacking_overlap.y, z=stacking_overlap.z
    )


def get_module_overlap_offsets(
    definition: LabwareDefinition, module_model: ModuleModel
) -> OverlapOffset:
    """Get the labware's overlap with requested module model."""
    stacking_overlap = definition.stackingOffsetWithModule.get(str(module_model.value))
    if not stacking_overlap:
        if _is_thermocycler_on_ot2(module_model):
            return OverlapOffset(x=0, y=0, z=10.7)
        else:
            return OverlapOffset(x=0, y=0, z=0)

    return OverlapOffset(
        x=stacking_overlap.x, y=stacking_overlap.y, z=stacking_overlap.z
    )


def _get_custom_offset(
    definition: LabwareDefinition3,
    lw_parent_location_info: LabwareParentLocationInfo,
) -> Point | None:
    """Returns the custom offset that exists for the parent-child stackup, if any."""
    custom_offsets = definition.locatingFeaturesAsChild.get("custom")

    if custom_offsets is None:
        return None

    else:
        if isinstance(lw_parent_location_info, LabwareDefinition2):
            return Point(0, 0, 0)

        elif isinstance(lw_parent_location_info, LabwareDefinition3):
            key = lw_parent_location_info.parameters.loadName
            return custom_offsets.get(key)

        elif isinstance(lw_parent_location_info, ModuleDefinition):
            key = lw_parent_location_info.moduleType
            return custom_offsets.get(key)

        elif isinstance(lw_parent_location_info, AddressableArea):
            key = lw_parent_location_info.area_name
            return custom_offsets.get(key)

        else:
            raise ValueError(
                f"Unsupported parent location info: {lw_parent_location_info}"
            )


def _get_parent_origin_to_locating_feature(
    labware_data: LoadedLabware,
    definition: LabwareDefinition3,
    lw_parent_location_info: LabwareParentLocationInfo,
) -> Point:
    """Returns the offset from parent origin to the locating feature position.

    All utilities convert parent extents to a coordinate IV system (+x, -y, +z) if
    the parent does not actively utilize a coordinate IV system.
    """
    if isinstance(lw_parent_location_info, LabwareDefinition2):
        return Point(0, 0, 0)

    elif _is_back_left_bottom_locating_feature_valid(lw_parent_location_info):
        return _get_parent_origin_to_back_left_bottom(lw_parent_location_info)

    elif _is_right_center_bottom_locating_feature_valid(lw_parent_location_info):
        return _get_parent_origin_to_right_center_bottom(lw_parent_location_info)

    else:
        return _get_parent_origin_to_bottom_center(lw_parent_location_info)


def _get_locating_feature_to_lw_origin(
    labware_data: LoadedLabware,
    definition: LabwareDefinition3,
    lw_parent_location_info: LabwareParentLocationInfo,
) -> Point:
    """Returns the offset from the locating feature position to the labware origin."""
    if isinstance(lw_parent_location_info, LabwareDefinition2):
        return Point(0, 0, 0)

    elif _is_back_left_bottom_locating_feature_valid(lw_parent_location_info):
        return _get_back_left_bottom_to_lw_origin(definition)

    elif _is_right_center_bottom_locating_feature_valid(lw_parent_location_info):
        return _get_right_center_bottom_to_lw_origin(definition)

    else:
        return _get_bottom_center_to_lw_origin(definition)


def _is_back_left_bottom_locating_feature_valid(
    lw_parent_location_info: LabwareParentLocationInfo,
) -> bool:
    """Returns whether the back-bottom-left locating feature is valid given the parent entity."""
    assert not isinstance(lw_parent_location_info, LabwareDefinition2)

    if (
        lw_parent_location_info.locatingFeaturesAsParent is not None
        and LocatingFeatureKeys.BACK_LEFT_BOTTOM
        in lw_parent_location_info.locatingFeaturesAsParent
    ):
        return True
    else:
        return False


def _is_right_center_bottom_locating_feature_valid(
    lw_parent_location_info: LabwareParentLocationInfo,
) -> bool:
    """Returns whether the right-center-bottom locating feature is valid given the parent entity."""
    assert not isinstance(lw_parent_location_info, LabwareDefinition2)

    if (
        lw_parent_location_info.locatingFeaturesAsParent is not None
        and LocatingFeatureKeys.RIGHT_CENTER_BOTTOM
        in lw_parent_location_info.locatingFeaturesAsParent
    ):
        return True
    else:
        return False


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
            y=bounding_box.y / 2,
            z=0,
        )

    elif isinstance(lw_parent_location_info, ModuleDefinition):
        dimensions = lw_parent_location_info.dimensions
        return Point(
            x=dimensions.labwareInterfaceXDimension / 2,
            y=dimensions.labwareInterfaceYDimension / 2,
            z=0,
        )

    else:
        raise ValueError(f"Unsupported parent location info: {lw_parent_location_info}")


def _get_parent_origin_to_back_left_bottom(
    lw_parent_location_info: LabwareParentLocationInfo,
) -> Point:
    """Returns offset from parent origin to parent's back-left-bottom corner."""
    if isinstance(lw_parent_location_info, LabwareDefinition2):
        return Point(0, 0, 0)

    elif isinstance(lw_parent_location_info, LabwareDefinition3):
        return Point(
            x=lw_parent_location_info.extents.total.backLeftBottom.x,
            y=lw_parent_location_info.extents.total.backLeftBottom.y,
            z=lw_parent_location_info.extents.total.backLeftBottom.z,
        )

    elif isinstance(lw_parent_location_info, AddressableArea):
        return Point(x=0, y=lw_parent_location_info.bounding_box.y, z=0)

    elif isinstance(lw_parent_location_info, ModuleDefinition):
        return Point(
            x=0,
            y=lw_parent_location_info.dimensions.labwareInterfaceYDimension,
            z=0,
        )

    else:
        raise ValueError(f"Unsupported parent location info: {lw_parent_location_info}")


def _get_parent_origin_to_right_center_bottom(
    lw_parent_location_info: LabwareParentLocationInfo,
) -> Point:
    """Returns offset from parent origin to parent's right-center-bottom point."""
    if isinstance(lw_parent_location_info, LabwareDefinition2):
        return Point(0, 0, 0)

    elif isinstance(lw_parent_location_info, LabwareDefinition3):
        extents = lw_parent_location_info.extents.total
        return Point(
            x=extents.frontRightTop.x,
            y=extents.frontRightTop.y / 2,
            z=extents.backLeftBottom.z,
        )

    elif isinstance(lw_parent_location_info, AddressableArea):
        bounding_box = lw_parent_location_info.bounding_box
        return Point(
            x=bounding_box.x,
            y=bounding_box.y / 2,
            z=0,
        )

    elif isinstance(lw_parent_location_info, ModuleDefinition):
        dimensions = lw_parent_location_info.dimensions
        return Point(
            x=dimensions.labwareInterfaceXDimension,
            y=dimensions.labwareInterfaceYDimension / 2,
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


def _get_back_left_bottom_to_lw_origin(definition: LabwareDefinition3) -> Point:
    """Returns offset from labware's back-left-bottom corner to labware origin."""
    lw_origin_to_bottom_left = Point(
        x=definition.extents.total.backLeftBottom.x,
        y=definition.extents.total.backLeftBottom.y,
        z=definition.extents.total.backLeftBottom.z,
    )

    return -1 * lw_origin_to_bottom_left


def _get_right_center_bottom_to_lw_origin(definition: LabwareDefinition3) -> Point:
    """Returns offset from labware's right-center-bottom point to labware origin."""
    extents = definition.extents.total
    lw_origin_to_right_center_bottom = Point(
        x=extents.frontRightTop.x,
        y=extents.frontRightTop.y / 2,
        z=extents.backLeftBottom.z,
    )

    return -1 * lw_origin_to_right_center_bottom


def _is_thermocycler_on_ot2(self, module_model: ModuleModel) -> bool:
    """Whether the given module is a thermocycler with the current deck being an OT2 deck."""
    robot_model = self.get_deck_definition()["robot"]["model"]
    return (
        module_model
        in [ModuleModel.THERMOCYCLER_MODULE_V1, ModuleModel.THERMOCYCLER_MODULE_V2]
        and robot_model == "OT-2 Standard"
    )
