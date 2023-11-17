from typing import Dict, Generator, List, Set, Tuple

import pytest

from opentrons_shared_data.deck import (
    list_names as list_deck_definition_names,
    load as load_deck_definition,
)
from opentrons_shared_data.deck.dev_types import (
    AddressableArea,
    Cutout,
    CutoutFixture,
    DeckDefinitionV3,
    DeckDefinitionV4,
)


def as_tuple(list: List[float]) -> Tuple[float, float, float]:
    """Convert an [x,y,z] list from the definitions to an (x,y,z) tuple, for hashability."""
    [x, y, z] = list
    return (x, y, z)


def get_v3_slot_positions(
    definition: DeckDefinitionV3,
) -> Set[Tuple[str, Tuple[float, float, float]]]:
    """Return all the slot positions defined by the deck definition, as (slot_id, [x,y,z]) tuples."""
    return set(
        (ordered_slot["id"], as_tuple(ordered_slot["position"]))
        for ordered_slot in definition["locations"]["orderedSlots"]
    )


def get_v4_stacks(
    definition: DeckDefinitionV4,
) -> Generator[Tuple[Cutout, CutoutFixture, AddressableArea], None, None]:
    """Yield all the (cutout, cutoutFixture, addressableArea) combinations that the def allows."""
    cutout_fixtures = definition["cutoutFixtures"]
    cutouts_by_id: Dict[str, Cutout] = {
        cutout["id"]: cutout for cutout in definition["locations"]["cutouts"]
    }
    addressable_areas_by_id: Dict[str, AddressableArea] = {
        addressable_area["id"]: addressable_area
        for addressable_area in definition["locations"]["addressableAreas"]
    }

    for cutout_fixture in cutout_fixtures:
        for cutout_id, addressable_area_ids in cutout_fixture[
            "providesAddressableAreas"
        ].items():
            for addressable_area_id in addressable_area_ids:
                cutout = cutouts_by_id[cutout_id]
                addressable_area = addressable_areas_by_id[addressable_area_id]
                yield cutout, cutout_fixture, addressable_area


def compute_v4_position(
    cutout: Cutout, addressable_area: AddressableArea
) -> List[float]:
    return [
        a + b
        for a, b in zip(cutout["position"], addressable_area["offsetFromCutoutFixture"])
    ]


def get_v4_slot_positions(
    definition: DeckDefinitionV4,
) -> Set[Tuple[str, Tuple[float, float, float]]]:
    """Return all the slot positions defined by the deck definition, as (addressable_area_id, [x,y,z]) tuples.

    It's important that this returns a set of (addressable_area_id, [x,y,z]) tuples instead of a
    dict {addressable_area_id: [x,y,z]}. Deck schema v4 theoretically allows a single addressable
    area ID to be associated with multiple positions. If that happens, we don't want to accidentally
    overwrite any.
    """
    stacks_with_slots = (
        (cutout, cutout_fixture, addressable_area)
        for (cutout, cutout_fixture, addressable_area) in get_v4_stacks(definition)
        # v3 has a "slot" for the fixed trash, but in v4, fixedTrash is its own area type. Count
        # it as a "slot," since we still want to compare the positions across schema versions.
        if addressable_area["areaType"] in {"slot", "fixedTrash"}
    )

    slot_positions = (
        (
            addressable_area["id"],
            as_tuple(compute_v4_position(cutout, addressable_area)),
        )
        for (cutout, cutout_fixture, addressable_area) in stacks_with_slots
    )

    return set(slot_positions)


@pytest.mark.parametrize("definition_name", list_deck_definition_names(version=4))
def test_v3_and_v4_positional_equivalence(definition_name: str) -> None:
    deck_v3 = load_deck_definition(name=definition_name, version=3)
    deck_v4 = load_deck_definition(name=definition_name, version=4)

    v3_slot_positions = get_v3_slot_positions(deck_v3)
    v4_slot_positions = get_v4_slot_positions(deck_v4)

    # Exclude v4 staging area slots from this comparison, because they won't be present in v3 deck schemas.
    v4_slot_positions = set(
        (slot_id, slot_position)
        for slot_id, slot_position in v4_slot_positions
        if slot_id not in {"A4", "B4", "C4", "D4"}
    )

    # For the purposes of this comparison, the v4 addressable areas named "fixedTrash" and
    # "shortFixedTrash" should be compared to slot 12 in v3.
    v4_slot_positions = set(
        (
            "12" if slot_id in {"fixedTrash", "shortFixedTrash"} else slot_id,
            slot_position,
        )
        for slot_id, slot_position in v4_slot_positions
    )

    assert v3_slot_positions == v4_slot_positions
