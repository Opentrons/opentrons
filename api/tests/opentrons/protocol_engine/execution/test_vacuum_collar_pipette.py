"""Tests for partial nozzle layouts beside a vacuum collar."""

from collections import OrderedDict

import pytest
from decoy import Decoy

from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_engine.errors import (
    LabwareNotOnDeckError,
    LocationNotAccessibleByPipetteError,
)
from opentrons.protocol_engine.execution.movement import (
    raise_if_nozzle_configuration_hits_vacuum_collar,
)
from opentrons.protocol_engine.state.state import StateStore
from opentrons.protocol_engine.types import DeckSlotLocation, LoadedLabware
from opentrons.types import DeckSlotName, NozzleConfigurationType, StagingSlotName


def _nozzle_map(starting: str, key: str, *, eight: bool = False) -> NozzleMap:
    letters = "ABCDEFGH"
    if eight:
        rows = OrderedDict((letter, [f"{letter}1"]) for letter in letters)
        columns = OrderedDict([("1", [f"{letter}1" for letter in letters])])
    else:
        rows = OrderedDict(
            (letter, [f"{letter}{column}" for column in range(1, 13)])
            for letter in letters
        )
        columns = OrderedDict(
            (str(column), [f"{letter}{column}" for letter in letters])
            for column in range(1, 13)
        )
    return NozzleMap(
        starting_nozzle=starting,
        map_store={},
        valid_map_key=key,
        rows={},
        columns={},
        configuration=(
            NozzleConfigurationType.FULL
            if key == "Full"
            else NozzleConfigurationType.ROW
            if key.startswith("Row")
            else NozzleConfigurationType.COLUMN
        ),
        full_instrument_map_store={},
        full_instrument_rows=rows,
        full_instrument_columns=columns,
    )


def _labware(labware_id: str, load_name: str) -> LoadedLabware:
    return LoadedLabware(
        id=labware_id,
        loadName=load_name,
        definitionUri=f"opentrons/{load_name}/1",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
    )


def _check(state: StateStore) -> None:
    raise_if_nozzle_configuration_hits_vacuum_collar(
        pipette_id="pipette-id",
        labware_id="plate-id",
        state_view=state,
    )


def _stub_deck(
    decoy: Decoy,
    state: StateStore,
    *,
    channels: int,
    nozzle_map: NozzleMap,
    destination: DeckSlotName | StagingSlotName,
    collar_slot: DeckSlotName | StagingSlotName | None,
    has_quirk: bool = True,
) -> None:
    plate = _labware("plate-id", "opentrons_96_wellplate_200ul_pcr_full_skirt")
    collar = _labware("collar-id", "opentrons_vacuum_manifold_collar_short")
    decoy.when(state.pipettes.get_channels("pipette-id")).then_return(channels)
    decoy.when(state.geometry.get_ancestor_slot_name("plate-id")).then_return(
        destination
    )
    decoy.when(state.pipettes.get_nozzle_configuration("pipette-id")).then_return(
        nozzle_map
    )
    labware = [plate] if collar_slot is None else [plate, collar]
    decoy.when(state.labware.get_all()).then_return(labware)
    if collar_slot is None:
        return
    decoy.when(state.geometry.get_ancestor_slot_name("collar-id")).then_return(
        collar_slot
    )
    decoy.when(
        state.labware.get_has_quirk("collar-id", "vacuumModuleDock")
    ).then_return(has_quirk)
    decoy.when(state.labware.get("plate-id")).then_return(plate)
    decoy.when(state.labware.get("collar-id")).then_return(collar)


def test_column_facing_an_east_collar_is_allowed(decoy: Decoy) -> None:
    """Column 12 is the 96-channel line closest to a collar on the dock."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=96,
        nozzle_map=_nozzle_map("A12", "Column12"),
        destination=DeckSlotName.SLOT_A3,
        collar_slot=StagingSlotName.SLOT_A4,
    )

    _check(state)


def test_larger_rectangle_facing_an_east_collar_is_rejected(decoy: Decoy) -> None:
    """A rectangle whose primary nozzle is inset from column 12 shifts into the collar."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=96,
        nozzle_map=_nozzle_map("A9", "A9toH12"),
        destination=DeckSlotName.SLOT_A3,
        collar_slot=StagingSlotName.SLOT_A4,
    )

    with pytest.raises(
        LocationNotAccessibleByPipetteError,
        match=r"east.*Use a configuration whose primary nozzle is A12 or H12, "
        r"or a row starting at A1 or H1, or move the collar",
    ):
        _check(state)


def test_row_starting_at_column_1_is_allowed_beside_an_east_collar(
    decoy: Decoy,
) -> None:
    """A row from A1 stays in the full head's left-right position."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=96,
        nozzle_map=_nozzle_map("A1", "RowA"),
        destination=DeckSlotName.SLOT_A3,
        collar_slot=StagingSlotName.SLOT_A4,
    )

    _check(state)


def test_row_facing_a_north_collar_is_allowed(decoy: Decoy) -> None:
    """Row A is the line closest to a collar north of the target."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=96,
        nozzle_map=_nozzle_map("A1", "RowA"),
        destination=DeckSlotName.SLOT_B3,
        collar_slot=DeckSlotName.SLOT_A3,
    )

    _check(state)


def test_eight_channel_front_nozzle_faces_a_south_collar(decoy: Decoy) -> None:
    """An 8-channel partial column that starts at H1 stays on the south edge."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=8,
        nozzle_map=_nozzle_map("H1", "H1toD1", eight=True),
        destination=DeckSlotName.SLOT_A3,
        collar_slot=DeckSlotName.SLOT_B3,
    )

    _check(state)


def test_eight_channel_full_layout_is_allowed_south_of_a_collar(decoy: Decoy) -> None:
    """A full 8-channel column stays over the labware, so a south collar is allowed."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=8,
        nozzle_map=_nozzle_map("A1", "Full", eight=True),
        destination=DeckSlotName.SLOT_A3,
        collar_slot=DeckSlotName.SLOT_B3,
    )

    _check(state)


def test_eight_channel_is_allowed_beside_an_east_collar(decoy: Decoy) -> None:
    """An 8-channel pipette has one column, so every layout is the east line."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=8,
        nozzle_map=_nozzle_map("A1", "Full", eight=True),
        destination=DeckSlotName.SLOT_A3,
        collar_slot=StagingSlotName.SLOT_A4,
    )

    _check(state)


def test_full_96_channel_is_allowed_beside_an_east_collar(decoy: Decoy) -> None:
    """All 96 nozzles sit on the labware and do not shift into an east collar."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=96,
        nozzle_map=_nozzle_map("A1", "Full"),
        destination=DeckSlotName.SLOT_A2,
        collar_slot=DeckSlotName.SLOT_A3,
    )

    _check(state)


def test_diagonal_collar_is_ignored(decoy: Decoy) -> None:
    """A collar on a diagonal slot does not block the layout."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=96,
        nozzle_map=_nozzle_map("A1", "RowA"),
        destination=DeckSlotName.SLOT_A3,
        collar_slot=DeckSlotName.SLOT_B2,
    )

    _check(state)


def test_labware_without_the_dock_quirk_is_ignored(decoy: Decoy) -> None:
    """Only a vacuum module collar uses this rule."""
    state = decoy.mock(cls=StateStore)
    _stub_deck(
        decoy,
        state,
        channels=96,
        nozzle_map=_nozzle_map("A1", "RowA"),
        destination=DeckSlotName.SLOT_A3,
        collar_slot=StagingSlotName.SLOT_A4,
        has_quirk=False,
    )

    _check(state)


def test_off_deck_collar_is_ignored(decoy: Decoy) -> None:
    """A collar with no deck slot cannot be beside the target."""
    state = decoy.mock(cls=StateStore)
    plate = _labware("plate-id", "opentrons_96_wellplate_200ul_pcr_full_skirt")
    collar = _labware("collar-id", "opentrons_vacuum_manifold_collar_short")
    decoy.when(state.pipettes.get_channels("pipette-id")).then_return(96)
    decoy.when(state.geometry.get_ancestor_slot_name("plate-id")).then_return(
        DeckSlotName.SLOT_A3
    )
    decoy.when(state.pipettes.get_nozzle_configuration("pipette-id")).then_return(
        _nozzle_map("A1", "RowA")
    )
    decoy.when(state.labware.get_all()).then_return([plate, collar])
    decoy.when(state.geometry.get_ancestor_slot_name("collar-id")).then_raise(
        LabwareNotOnDeckError()
    )

    _check(state)


def test_single_channel_skips_the_check(decoy: Decoy) -> None:
    """A 1-channel pipette has no partial rectangle to shift."""
    state = decoy.mock(cls=StateStore)
    decoy.when(state.pipettes.get_channels("pipette-id")).then_return(1)

    _check(state)

    decoy.verify(state.geometry.get_ancestor_slot_name("plate-id"), times=0)
