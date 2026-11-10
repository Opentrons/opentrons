"""Tests for gripper moves that graze a north/south vacuum collar."""

from types import SimpleNamespace
from typing import cast

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.commands.move_labware import (
    _gripper_move_grazes_collar_neighbor,
    _has_vacuum_neighbor,
)
from opentrons.protocol_engine.errors import LabwareNotOnDeckError
from opentrons.protocol_engine.state.geometry import GeometryView
from opentrons.protocol_engine.state.labware import LabwareView
from opentrons.protocol_engine.state.modules import ModuleView
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    AddressableAreaLocation,
    DeckSlotLocation,
    LabwareLocation,
    LoadedLabware,
    LoadedModule,
    ModuleLocation,
    ModuleModel,
)
from opentrons.types import DeckSlotName, StagingSlotName


def _location_for_area(area: str) -> DeckSlotLocation | AddressableAreaLocation:
    try:
        return DeckSlotLocation(slotName=DeckSlotName.from_primitive(area))
    except ValueError:
        return AddressableAreaLocation(addressableAreaName=area)


def _slot_name(slot_id: str) -> DeckSlotName | StagingSlotName:
    try:
        return DeckSlotName.from_primitive(slot_id)
    except ValueError:
        return StagingSlotName.from_primitive(slot_id)


def _collar(slot: DeckSlotName | StagingSlotName) -> LoadedLabware:
    if isinstance(slot, StagingSlotName):
        location: LabwareLocation = AddressableAreaLocation(addressableAreaName=slot.id)
    else:
        location = DeckSlotLocation(slotName=slot)
    return LoadedLabware(
        id=f"collar-{slot.id}",
        loadName="opentrons_vacuum_manifold_collar_tall",
        definitionUri="opentrons/opentrons_vacuum_manifold_collar_tall/1",
        location=location,
    )


@pytest.mark.parametrize(
    ("move_slot", "collar_slot", "has_quirk", "expect_hit"),
    [
        ("B3", "A3", True, True),  # A3 is directly north of B3
        ("B4", "A4", True, True),  # A4 is directly north of B4
        ("B3", "C3", True, True),  # C3 is directly south of B3
        ("B4", "C4", True, True),  # C4 is directly south of B4
        ("B3", "A4", True, False),  # A4 is not a north/south neighbor of B3
        ("B4", "A3", True, False),  # A3 is not a north/south neighbor of B4
        ("B2", "A3", True, False),  # A3 is the corner of B2, not north or south
        ("A3", "A3", True, False),  # the collar's own slot is not a neighbor
        ("C3", "A3", True, False),  # A3 is two slots north of C3
        ("B3", "A3", False, False),  # labware without the collar quirk
    ],
)
def test_gripper_move_grazes_north_south_collar(
    decoy: Decoy,
    move_slot: str,
    collar_slot: str,
    has_quirk: bool,
    expect_hit: bool,
) -> None:
    """A vacuum collar on a north or south slot blocks a gripper pickup or drop."""
    geometry = decoy.mock(cls=GeometryView)
    labware = decoy.mock(cls=LabwareView)
    collar_name = _slot_name(collar_slot)
    collar = _collar(collar_name)
    location = _location_for_area(move_slot)
    decoy.when(geometry.get_parent_from_location(location)).then_return(move_slot)
    decoy.when(labware.get_all()).then_return([collar])
    decoy.when(geometry.get_ancestor_slot_name(collar.id)).then_return(collar_name)
    decoy.when(labware.get_has_quirk(collar.id, "vacuumModuleDock")).then_return(
        has_quirk
    )
    state = cast(
        StateView,
        SimpleNamespace(geometry=geometry, labware=labware),
    )

    result = _gripper_move_grazes_collar_neighbor(location, state)

    if expect_hit:
        assert result == (collar, collar_slot)
    else:
        assert result is None


def test_collar_loaded_on_module_blocks_neighbor(decoy: Decoy) -> None:
    """A collar loaded on the vacuum module in A3 blocks a gripper move at B3."""
    geometry = decoy.mock(cls=GeometryView)
    labware = decoy.mock(cls=LabwareView)
    collar = LoadedLabware(
        id="collar-id",
        loadName="opentrons_vacuum_manifold_collar_tall",
        definitionUri="opentrons/opentrons_vacuum_manifold_collar_tall/1",
        location=ModuleLocation(moduleId="vacuum-id"),
    )
    location = _location_for_area("B3")
    decoy.when(geometry.get_parent_from_location(location)).then_return("B3")
    decoy.when(labware.get_all()).then_return([collar])
    decoy.when(geometry.get_ancestor_slot_name("collar-id")).then_return(
        DeckSlotName.SLOT_A3
    )
    decoy.when(labware.get_has_quirk("collar-id", "vacuumModuleDock")).then_return(True)
    state = cast(
        StateView,
        SimpleNamespace(geometry=geometry, labware=labware),
    )

    assert _gripper_move_grazes_collar_neighbor(location, state) == (collar, "A3")


def test_waste_chute_labware_does_not_stop_the_check(decoy: Decoy) -> None:
    """A tiprack in the waste chute is skipped, and a collar neighbor still blocks."""
    geometry = decoy.mock(cls=GeometryView)
    labware = decoy.mock(cls=LabwareView)
    chute = LoadedLabware(
        id="tiprack-id",
        loadName="opentrons_flex_96_tiprack_200ul",
        definitionUri="opentrons/opentrons_flex_96_tiprack_200ul/1",
        location=OFF_DECK_LOCATION,
    )
    collar = _collar(DeckSlotName.SLOT_A3)
    location = _location_for_area("B3")
    decoy.when(geometry.get_parent_from_location(location)).then_return("B3")
    decoy.when(labware.get_all()).then_return([chute, collar])
    decoy.when(geometry.get_ancestor_slot_name(chute.id)).then_raise(
        LabwareNotOnDeckError()
    )
    decoy.when(geometry.get_ancestor_slot_name(collar.id)).then_return(
        DeckSlotName.SLOT_A3
    )
    decoy.when(labware.get_has_quirk(collar.id, "vacuumModuleDock")).then_return(True)
    state = cast(
        StateView,
        SimpleNamespace(geometry=geometry, labware=labware),
    )

    assert _gripper_move_grazes_collar_neighbor(location, state) == (collar, "A3")


def test_off_deck_location_does_not_graze(decoy: Decoy) -> None:
    """Locations that are not on a deck slot have no collar neighbor."""
    geometry = decoy.mock(cls=GeometryView)
    decoy.when(geometry.get_parent_from_location(OFF_DECK_LOCATION)).then_raise(
        LabwareNotOnDeckError()
    )
    state = cast(
        StateView,
        SimpleNamespace(geometry=geometry, labware=decoy.mock(cls=LabwareView)),
    )

    assert _gripper_move_grazes_collar_neighbor(OFF_DECK_LOCATION, state) is None


def _state_for_jaw_limit(
    decoy: Decoy, area: str, vacuum_slot: str | None
) -> tuple[DeckSlotLocation | AddressableAreaLocation, StateView]:
    geometry = decoy.mock(cls=GeometryView)
    module_view = decoy.mock(cls=ModuleView)
    location = _location_for_area(area)
    module = LoadedModule(id="vacuum-id", model=ModuleModel.VACUUM_MODULE_V1)
    decoy.when(geometry.get_parent_from_location(location)).then_return(area)
    decoy.when(module_view.get_by_slot(matchers.Anything())).then_do(
        lambda slot: module if slot.id == vacuum_slot else None
    )
    state = cast(
        StateView,
        SimpleNamespace(geometry=geometry, modules=module_view),
    )
    return location, state


def test_b3_limits_jaws_when_vacuum_module_is_north(decoy: Decoy) -> None:
    """A B3 gripper move keeps the jaws narrow while the vacuum module is on A3."""
    location, state = _state_for_jaw_limit(decoy, "B3", "A3")

    assert _has_vacuum_neighbor(location, state) is True


def test_b3_does_not_limit_jaws_without_vacuum_module(decoy: Decoy) -> None:
    """B3 uses a full jaw open when no vacuum module is north or south of it."""
    location, state = _state_for_jaw_limit(decoy, "B3", None)

    assert _has_vacuum_neighbor(location, state) is False


def test_slot_does_not_limit_jaws_when_vacuum_module_is_not_a_neighbor(
    decoy: Decoy,
) -> None:
    """An attached vacuum module only limits the slots directly north or south of it."""
    location, state = _state_for_jaw_limit(decoy, "C1", "A3")

    assert _has_vacuum_neighbor(location, state) is False
