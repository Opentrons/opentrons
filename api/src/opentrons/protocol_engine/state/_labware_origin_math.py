"""Utilities for calculating the labware origin offset position."""
import dataclasses
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
    LocatingFeatures,
    SpringDirectionalForce,
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

_OFFSET_ON_TC_OT2 = Point(x=0, y=0, z=10.7)


@dataclasses.dataclass
class _Labware3SupportedParentDefinition:
    features: LocatingFeatures


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
    if isinstance(child_labware, LabwareDefinition2):
        parent_deck_item_origin_to_child_labware_placement_origin = (
            _get_parent_deck_item_origin_to_child_labware_placement_origin(
                child_labware=child_labware,
                parent_deck_item=parent_deck_item,
                module_parent_to_child_offset=module_parent_to_child_offset,
                deck_definition=deck_definition,
                labware_location=labware_location,
            )
        )

        # For v2 definitions, cornerOffsetFromSlot is the parent entity placement origin to child labware origin offset.
        # For compatibility with historical (buggy?) behavior,
        # we only consider it when the child labware is the topmost labware in a stackup.
        parent_deck_item_to_child_labware_offset = (
            Point.from_xyz_attrs(child_labware.cornerOffsetFromSlot)
            if is_topmost_labware
            else Point(0, 0, 0)
        )

        return (
            parent_deck_item_origin_to_child_labware_placement_origin
            + parent_deck_item_to_child_labware_offset
        )
    else:
        # For v3 definitions, get the vector from the back left bottom to the front right bottom.
        assert_type(child_labware, LabwareDefinition3)

        if isinstance(parent_deck_item, LabwareDefinition2):
            raise NotImplementedError()

        # TODO(jh, 06-25-25): This code is entirely temporary and only exists for the purposes of more useful
        #  snapshot testing. This code should exist in NO capacity after features are implemented outside of the
        #  module_parent_to_child_offset.
        if _shim_does_locating_feature_pair_exist(
            child_labware=child_labware,
            parent_deck_item=_parent_deck_item_with_features(parent_deck_item),
        ):
            parent_deck_item_origin_to_child_labware_placement_origin = (
                _module_parent_to_child_offset(
                    module_parent_to_child_offset, labware_location
                )
            )
        else:
            parent_deck_item_origin_to_child_labware_placement_origin = (
                _get_parent_deck_item_origin_to_child_labware_placement_origin(
                    child_labware=child_labware,
                    parent_deck_item=parent_deck_item,
                    module_parent_to_child_offset=module_parent_to_child_offset,
                    deck_definition=deck_definition,
                    labware_location=labware_location,
                )
            )

        parent_deck_item_to_child_labware_feature_offset = (
            _parent_deck_item_to_child_labware_feature_offset(
                child_labware=child_labware,
                parent_deck_item=_parent_deck_item_with_features(parent_deck_item),
            )
        ) + _feature_exception_offsets(
            deck_definition=deck_definition, parent_deck_item=parent_deck_item
        )

        return (
            parent_deck_item_origin_to_child_labware_placement_origin
            + parent_deck_item_to_child_labware_feature_offset
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

        child_labware_overlap_with_parent_deck_item = (
            _get_child_labware_overlap_with_parent_module(
                child_labware=child_labware,
                parent_module_model=parent_deck_item.model,
                deck_definition=deck_definition,
            )
        )
        module_parent_to_child_offset = _module_parent_to_child_offset(
            module_parent_to_child_offset, labware_location
        )

        return (
            module_parent_to_child_offset - child_labware_overlap_with_parent_deck_item
        )

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


def _module_parent_to_child_offset(
    module_parent_to_child_offset: Union[Point, None],
    labware_location: LabwareLocation,
) -> Point:
    """Returns the module offset if applicable."""
    if (
        isinstance(labware_location, ModuleLocation)
        and module_parent_to_child_offset is not None
    ):
        return Point.from_xyz_attrs(module_parent_to_child_offset)
    else:
        return Point(0, 0, 0)


def _shim_does_locating_feature_pair_exist(
    child_labware: LabwareDefinition3,
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> bool:
    """Temporary util."""
    return (
        parent_deck_item.features.get("slotFootprintAsParent") is not None
        and child_labware.features.get("slotFootprintAsChild") is not None
    )


def _shim_is_tc_or_mag_block(parent_deck_item: LabwareParentDefinition) -> bool:
    """Temporary util."""
    model = None
    if hasattr(parent_deck_item, "model"):
        model = parent_deck_item.model  # type: ignore[union-attr]
    elif isinstance(parent_deck_item, dict):
        model = parent_deck_item.get("model")
    return model in [
        ModuleModel.THERMOCYCLER_MODULE_V2,
        ModuleModel.THERMOCYCLER_MODULE_V1,
        ModuleModel.MAGNETIC_BLOCK_V1,
    ]


def _parent_deck_item_with_features(
    parent_deck_item: Union[
        LabwareDefinition3, DeckLocationDefinition, ModuleDefinition
    ],
) -> _Labware3SupportedParentDefinition:
    """Returns a standardized parent deck item interface."""
    if hasattr(parent_deck_item, "features"):
        return _Labware3SupportedParentDefinition(parent_deck_item.features)  # type: ignore[union-attr]
    elif (
        hasattr(parent_deck_item, "get")
        and parent_deck_item.get("features") is not None
    ):
        return _Labware3SupportedParentDefinition(parent_deck_item.get("features"))  # type: ignore[arg-type]
    else:
        raise ValueError("Expected parent deck item to have features.")


def _parent_deck_item_to_child_labware_feature_offset(
    child_labware: LabwareDefinition3,
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> Point:
    """Get the offset vector from the parent entity origin to the child labware origin."""
    if (
        parent_deck_item.features.get("slotFootprintAsParent") is not None
        and child_labware.features.get("slotFootprintAsChild") is not None
    ):
        spring_force = _get_spring_force(child_labware, parent_deck_item)

        if spring_force is not None:
            if spring_force == "backLeftBottom":
                return _parent_origin_to_mate_plane_spring_back_left_bottom(
                    parent_deck_item
                ) + _mate_plane_spring_back_left_bottom_to_lw_origin(child_labware)
            else:
                raise NotImplementedError(f"Spring force: {spring_force}")
        else:
            return _parent_origin_to_mate_plane_bottom_center(
                parent_deck_item
            ) + mate_plane_bottom_center_to_child_origin(child_labware)
    else:
        # TODO(jh, 06-25-25): This is a temporary shim to unblock FE usage with LW Def3 and more accurately diff
        #  ongoing positioning snapshot changes, but we should throw an error  after adding all locating features
        #  if no appropriate LF pair is found.
        return Point(0, 0, 0)


def _get_spring_force(
    child_labware: LabwareDefinition3,
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> SpringDirectionalForce | None:
    """Returns whether the parent-child stackup has a spring that affects positioning."""
    assert parent_deck_item.features.get("slotFootprintAsParent") is not None
    assert child_labware.features.get("slotFootprintAsChild") is not None

    parent_spring_force = parent_deck_item.features["slotFootprintAsParent"].get(
        "springDirectionalForce"
    )
    child_spring_force = child_labware.features["slotFootprintAsChild"].get(
        "springDirectionalForce"
    )

    if parent_spring_force is not None and child_spring_force is not None:
        if parent_spring_force != child_spring_force:
            raise ValueError(
                f"Parent spring force: {parent_spring_force} does not match child spring force: {child_spring_force}"
            )

    return parent_spring_force or child_spring_force


def _parent_origin_to_mate_plane_bottom_center(
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> Point:
    """Returns offset from the parent deck item's origin to the bottom-center point of the mating plane."""
    slot_footprint_as_parent = parent_deck_item.features.get("slotFootprintAsParent")
    assert slot_footprint_as_parent is not None

    x = (
        slot_footprint_as_parent["frontRight"]["x"]
        + slot_footprint_as_parent["backLeft"]["x"]
    ) / 2
    y = (
        slot_footprint_as_parent["frontRight"]["y"]
        + slot_footprint_as_parent["backLeft"]["y"]
    ) / 2
    z = slot_footprint_as_parent["z"]

    return Point(x, y, z)


def _parent_origin_to_mate_plane_spring_back_left_bottom(
    parent_deck_item: _Labware3SupportedParentDefinition,
) -> Point:
    """Returns offset from the parent origin to the mating plane, accounting for back left bottom spring force."""
    slot_footprint_as_parent = parent_deck_item.features.get("slotFootprintAsParent")
    assert slot_footprint_as_parent is not None

    x = slot_footprint_as_parent["backLeft"]["x"]
    y = slot_footprint_as_parent["backLeft"]["y"]
    z = slot_footprint_as_parent["z"]

    return Point(x, y, z)


def mate_plane_bottom_center_to_child_origin(
    child_labware: LabwareDefinition3,
) -> Point:
    """Returns offset from the child labware's bottom-center point of the mating plane to the labware origin."""
    slot_footprint_as_child = child_labware.features.get("slotFootprintAsChild")
    assert slot_footprint_as_child is not None

    x = (
        slot_footprint_as_child["frontRight"]["x"]
        + slot_footprint_as_child["backLeft"]["x"]
    ) / 2
    y = (
        slot_footprint_as_child["frontRight"]["y"]
        + slot_footprint_as_child["backLeft"]["y"]
    ) / 2
    z = slot_footprint_as_child["z"]

    return Point(x, y, z) * -1


def _mate_plane_spring_back_left_bottom_to_lw_origin(
    child_labware: LabwareDefinition3,
) -> Point:
    """Returns offset from the mating plane to the child's origin, accounting for back left bottom spring force."""
    slot_footprint_as_child = child_labware.features.get("slotFootprintAsChild")
    assert slot_footprint_as_child is not None

    x = slot_footprint_as_child["backLeft"]["x"]
    y = slot_footprint_as_child["backLeft"]["y"]
    z = slot_footprint_as_child["z"]

    return Point(x, y, z) * -1


def _child_back_left_bottom_position(child_labware: LabwareDefinition3) -> Point:
    """Get the back left bottom position from a v3 labware definition."""
    footprint_as_child = _get_labware_footprint_as_child(child_labware)

    return Point(
        x=footprint_as_child["backLeft"]["x"],
        y=footprint_as_child["frontRight"]["y"],
        z=footprint_as_child["z"],
    )


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
            return _OFFSET_ON_TC_OT2
        else:
            return Point(x=0, y=0, z=0)

    return Point.from_xyz_attrs(child_labware_overlap)


def _feature_exception_offsets(
    parent_deck_item: LabwareParentDefinition,
    deck_definition: DeckDefinitionV5,
) -> Point:
    """These offsets are intended for legacy reasons only and should generally be avoided post labware schema 2.

    If you need to make exceptions for a parent-child stackup, use the `custom` locating feature.
    """
    if isinstance(parent_deck_item, ModuleDefinition) and _is_thermocycler_on_ot2(
        parent_deck_item.model, deck_definition
    ):
        return _OFFSET_ON_TC_OT2
    else:
        return Point(x=0, y=0, z=0)


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
