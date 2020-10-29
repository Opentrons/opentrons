"""Test state getters for retrieving geometry views of underlying data."""
import pytest
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import Point

from opentrons.protocol_engine import errors, command_models as cmd
from opentrons.protocol_engine.state import (
    StateStore,
    LabwareData,
    LocationData,
)


def mock_labware_data(store: StateStore, data: LabwareData, labware_id: str) -> None:
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
    point = store.state.get_slot_position(3)
    slot_pos = standard_deck_def["locations"]["orderedSlots"][3]["position"]

    assert point == Point(x=slot_pos[0], y=slot_pos[1], z=slot_pos[2])


def test_get_well_position(
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    """It should be able to get the position of a well in a labware."""
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
        z=slot_pos[2] + 3 + well_def["z"]
    )


def test_get_well_position_raises_if_labware_does_not_exist(
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    store: StateStore,
) -> None:
    with pytest.raises(errors.LabwareDoesNotExistError):
        store.state.get_well_position("labware-id", "B2")


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
