"""Test state getters for retrieving geometry views of state."""
import pytest
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import Point

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.state import (
    StateStore,
    LabwareData,
    LocationData,
)


def mock_labware_data(
    store: StateStore,
    data: LabwareData,
    labware_id: str
) -> None:
    """Insert mock location data into the store."""
    store.state._labware_by_id[labware_id] = data
    assert store.state.get_labware_data_by_id(labware_id) == data


def mock_location_data(store: StateStore, data: LocationData) -> None:
    """Insert mock location data into the store."""
    store.state._current_location = data
    assert store.state.get_current_location_data() == data


def test_get_slot_position(
    standard_deck_def: DeckDefinitionV2,
    store: StateStore
) -> None:
    """It should get the absolute location of a deck slot's origin."""
    point = store.state.get_slot_position(3)
    slot_pos = standard_deck_def["locations"]["orderedSlots"][3]["position"]

    assert point == Point(x=slot_pos[0], y=slot_pos[1], z=slot_pos[2])


def test_get_labware_highest_z(
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    store: StateStore,
) -> None:
    """It should get the absolute location of a labware's highest Z point."""
    labware_data = LabwareData(
        definition=well_plate_def,
        location=3,
        calibration=(1, -2, 3)
    )

    mock_labware_data(store, labware_data, "labware-id")
    slot_pos = store.state.get_slot_position(3)

    highest_z = store.state.get_labware_highest_z("labware-id")

    assert highest_z == (
        labware_data.definition["dimensions"]["zDimension"] +
        slot_pos[2] +
        3
    )


def test_get_all_labware_highest_z(
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
    store: StateStore,
) -> None:
    """It should get the highest Z amongst all labware."""
    plate_data = LabwareData(
        definition=well_plate_def,
        location=3,
        calibration=(1, -2, 3)
    )
    reservoir_data = LabwareData(
        definition=reservoir_def,
        location=4,
        calibration=(1, -2, 3)
    )

    mock_labware_data(store, plate_data, "plate-id")
    mock_labware_data(store, reservoir_data, "reservoir-id")

    plate_z = store.state.get_labware_highest_z("plate-id")
    reservoir_z = store.state.get_labware_highest_z("reservoir-id")

    assert store.state.get_all_labware_highest_z() == max(plate_z, reservoir_z)


def test_get_well_position(
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LabwareData(
        definition=well_plate_def,
        location=3,
        calibration=(1, -2, 3)
    )

    mock_labware_data(store, labware_data, "labware-id")

    point = store.state.get_well_position("labware-id", "B2")
    slot_pos = standard_deck_def["locations"]["orderedSlots"][3]["position"]
    well_def = well_plate_def["wells"]["B2"]

    assert point == Point(
        x=slot_pos[0] + 1 + well_def["x"],
        y=slot_pos[1] - 2 + well_def["y"],
        z=slot_pos[2] + 3 + well_def["z"] + well_def["depth"],
    )


def test_get_well_position_raises_if_well_does_not_exist(
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    labware_data = LabwareData(
        definition=well_plate_def,
        location=3,
        calibration=(1, -2, 3)
    )

    mock_labware_data(store, labware_data, "labware-id")

    with pytest.raises(errors.WellDoesNotExistError):
        store.state.get_well_position("labware-id", "Z42")


def test_get_labware_has_quirk(
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
    store: StateStore,
) -> None:
    """It should return whether a labware by ID has a given quirk."""
    well_plate_data = LabwareData(
        location=1,
        definition=well_plate_def,
        calibration=(1, 2, 3),
    )
    reservoir_data = LabwareData(
        location=2,
        definition=reservoir_def,
        calibration=(4, 5, 6),
    )

    mock_labware_data(store, well_plate_data, "labware-id-1")
    mock_labware_data(store, reservoir_data, "labware-id-2")

    well_plate_has_center_quirk = store.state.get_labware_has_quirk(
        "labware-id-1",
        "centerMultichannelOnWells"
    )

    reservoir_has_center_quirk = store.state.get_labware_has_quirk(
        "labware-id-2",
        "centerMultichannelOnWells"
    )

    assert well_plate_has_center_quirk is False
    assert reservoir_has_center_quirk is True
