"""Tests for 96-channel moves beside a vacuum collar."""

from types import SimpleNamespace
from typing import cast

import pytest
from decoy import Decoy

from opentrons.protocol_engine.errors import (
    LabwareNotOnDeckError,
    LocationNotAccessibleByPipetteError,
)
from opentrons.protocol_engine.execution.movement import (
    raise_if_96_channel_hits_vacuum_collar,
)
from opentrons.protocol_engine.state.geometry import GeometryView
from opentrons.protocol_engine.state.labware import LabwareView
from opentrons.protocol_engine.state.pipettes import PipetteView
from opentrons.protocol_engine.state.state import StateStore
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    AddressableAreaLocation,
    DeckSlotLocation,
    LabwareLocation,
    LoadedLabware,
    ModuleLocation,
)
from opentrons.types import DeckSlotName, StagingSlotName


def _slot_name(slot_id: str) -> DeckSlotName | StagingSlotName:
    try:
        return DeckSlotName.from_primitive(slot_id)
    except ValueError:
        return StagingSlotName.from_primitive(slot_id)


def _labware(
    labware_id: str,
    load_name: str,
    slot: DeckSlotName | StagingSlotName,
) -> LoadedLabware:
    if isinstance(slot, StagingSlotName):
        location: LabwareLocation = AddressableAreaLocation(addressableAreaName=slot.id)
    else:
        location = DeckSlotLocation(slotName=slot)
    return LoadedLabware(
        id=labware_id,
        loadName=load_name,
        definitionUri=f"opentrons/{load_name}/1",
        location=location,
    )


@pytest.mark.parametrize(
    ("destination", "collar_slot", "has_quirk", "channels", "expect_blocked"),
    [
        ("B3", "A3", True, 96, True),
        ("A2", "A3", True, 96, True),
        ("A4", "A3", True, 96, True),
        ("A3", "A4", True, 96, True),
        ("B4", "A4", True, 96, True),
        ("B2", "A3", True, 96, False),
        ("B3", "A4", True, 96, False),
        ("B4", "A3", True, 96, False),
        ("A3", "A3", True, 96, False),
        ("C3", "A3", True, 96, False),
        ("B3", "A3", False, 96, False),
        ("B3", "A3", True, 8, False),
        ("B3", "A3", True, 1, False),
    ],
)
def test_96_channel_hits_cardinal_vacuum_collar(
    decoy: Decoy,
    destination: str,
    collar_slot: str,
    has_quirk: bool,
    channels: int,
    expect_blocked: bool,
) -> None:
    """A 96-channel cannot pipette a slot orthogonally adjacent to a collar."""
    geometry = decoy.mock(cls=GeometryView)
    labware = decoy.mock(cls=LabwareView)
    pipettes = decoy.mock(cls=PipetteView)
    destination_slot = _slot_name(destination)
    collar_name = _slot_name(collar_slot)
    plate = _labware("plate-id", "fixture_96_plate", destination_slot)
    collar = _labware("collar-id", "opentrons_vacuum_manifold_collar_tall", collar_name)
    decoy.when(pipettes.get_channels("pipette-id")).then_return(channels)
    decoy.when(geometry.get_ancestor_slot_name(plate.id)).then_return(destination_slot)
    decoy.when(labware.get_all()).then_return([plate, collar])
    decoy.when(geometry.get_ancestor_slot_name(collar.id)).then_return(collar_name)
    decoy.when(labware.get_has_quirk(collar.id, "vacuumModuleDock")).then_return(
        has_quirk
    )
    decoy.when(labware.get(plate.id)).then_return(plate)
    state = cast(
        StateStore,
        SimpleNamespace(geometry=geometry, labware=labware, pipettes=pipettes),
    )

    if expect_blocked:
        with pytest.raises(
            LocationNotAccessibleByPipetteError,
            match=(
                "Cannot move the 96-channel pipette to fixture_96_plate "
                f"on {destination} while opentrons_vacuum_manifold_collar_tall "
                f"is on {collar_slot}."
            ),
        ):
            raise_if_96_channel_hits_vacuum_collar("pipette-id", plate.id, state)
    else:
        raise_if_96_channel_hits_vacuum_collar("pipette-id", plate.id, state)


def test_collar_on_module_blocks_neighbor(decoy: Decoy) -> None:
    """A collar loaded on the vacuum module in A3 blocks a 96-channel move at B3."""
    geometry = decoy.mock(cls=GeometryView)
    labware = decoy.mock(cls=LabwareView)
    pipettes = decoy.mock(cls=PipetteView)
    plate = _labware("plate-id", "fixture_96_plate", DeckSlotName.SLOT_B3)
    collar = LoadedLabware(
        id="collar-id",
        loadName="opentrons_vacuum_manifold_collar_short",
        definitionUri="opentrons/opentrons_vacuum_manifold_collar_short/1",
        location=ModuleLocation(moduleId="vacuum-id"),
    )
    decoy.when(pipettes.get_channels("pipette-id")).then_return(96)
    decoy.when(geometry.get_ancestor_slot_name(plate.id)).then_return(
        DeckSlotName.SLOT_B3
    )
    decoy.when(labware.get_all()).then_return([collar])
    decoy.when(geometry.get_ancestor_slot_name(collar.id)).then_return(
        DeckSlotName.SLOT_A3
    )
    decoy.when(labware.get_has_quirk(collar.id, "vacuumModuleDock")).then_return(True)
    decoy.when(labware.get(plate.id)).then_return(plate)
    state = cast(
        StateStore,
        SimpleNamespace(geometry=geometry, labware=labware, pipettes=pipettes),
    )

    with pytest.raises(LocationNotAccessibleByPipetteError, match="on A3"):
        raise_if_96_channel_hits_vacuum_collar("pipette-id", plate.id, state)


def test_waste_chute_labware_does_not_stop_the_check(decoy: Decoy) -> None:
    """A tiprack in the waste chute is skipped, and a collar neighbor still blocks."""
    geometry = decoy.mock(cls=GeometryView)
    labware = decoy.mock(cls=LabwareView)
    pipettes = decoy.mock(cls=PipetteView)
    plate = _labware("plate-id", "fixture_96_plate", DeckSlotName.SLOT_B3)
    chute = LoadedLabware(
        id="tiprack-id",
        loadName="opentrons_flex_96_tiprack_200ul",
        definitionUri="opentrons/opentrons_flex_96_tiprack_200ul/1",
        location=OFF_DECK_LOCATION,
    )
    collar = _labware(
        "collar-id",
        "opentrons_vacuum_manifold_collar_tall",
        DeckSlotName.SLOT_A3,
    )
    decoy.when(pipettes.get_channels("pipette-id")).then_return(96)
    decoy.when(geometry.get_ancestor_slot_name(plate.id)).then_return(
        DeckSlotName.SLOT_B3
    )
    decoy.when(labware.get_all()).then_return([chute, collar])
    decoy.when(geometry.get_ancestor_slot_name(chute.id)).then_raise(
        LabwareNotOnDeckError()
    )
    decoy.when(geometry.get_ancestor_slot_name(collar.id)).then_return(
        DeckSlotName.SLOT_A3
    )
    decoy.when(labware.get_has_quirk(collar.id, "vacuumModuleDock")).then_return(True)
    decoy.when(labware.get(plate.id)).then_return(plate)
    state = cast(
        StateStore,
        SimpleNamespace(geometry=geometry, labware=labware, pipettes=pipettes),
    )

    with pytest.raises(LocationNotAccessibleByPipetteError, match="on A3"):
        raise_if_96_channel_hits_vacuum_collar("pipette-id", plate.id, state)


def test_off_deck_destination_is_ignored(decoy: Decoy) -> None:
    """Labware that is not on a deck slot has no collar neighbor."""
    geometry = decoy.mock(cls=GeometryView)
    pipettes = decoy.mock(cls=PipetteView)
    decoy.when(pipettes.get_channels("pipette-id")).then_return(96)
    decoy.when(geometry.get_ancestor_slot_name("plate-id")).then_raise(
        LabwareNotOnDeckError()
    )
    state = cast(
        StateStore,
        SimpleNamespace(
            geometry=geometry,
            labware=decoy.mock(cls=LabwareView),
            pipettes=pipettes,
        ),
    )

    raise_if_96_channel_hits_vacuum_collar("pipette-id", "plate-id", state)
