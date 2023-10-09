import pytest

from opentrons_shared_data.deck import (
    load as load_deck_definition,
    load_v4 as load_deck_definition_v4,
)

from . import list_deck_def_paths


@pytest.mark.parametrize("definition_name", list_deck_def_paths(version=4))
def test_v3_and_v4_positional_equivalence(definition_name: str) -> None:
    deck_v3 = load_deck_definition(name=definition_name, version=3)
    deck_v4 = load_deck_definition_v4(name=definition_name)

    # Get a mapping of v3 slot names (ids) to the position
    deck_v3_locations = {
        orderedSlot["id"]: orderedSlot["position"]
        for orderedSlot in deck_v3["locations"]["orderedSlots"]
    }

    # Get the base cutout locations (id is also slot name)
    deck_v4_locations = {
        cutout["id"]: cutout["position"] for cutout in deck_v4["locations"]["cutouts"]
    }

    # Iterate through addressable areas that match to slot names and add their position to the cutout
    # for the final slot position
    for addressable_area in deck_v4["locations"]["addressableAreas"]:
        addressable_area_id = addressable_area["id"]
        try:
            cutout_position = deck_v4_locations[addressable_area_id]
        except KeyError:
            continue
        else:
            area_position = addressable_area["position"]
            x = cutout_position[0] + area_position[0]
            y = cutout_position[1] + area_position[1]
            z = cutout_position[2] + area_position[2]
            deck_v4_locations[addressable_area_id] = [x, y, z]

    assert len(deck_v3_locations.keys()) == len(deck_v4_locations.keys())
    slot_names = list(deck_v4_locations.keys())

    for slot_name in slot_names:
        assert deck_v3_locations[slot_name] == deck_v4_locations[slot_name]
