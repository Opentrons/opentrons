"""Deck configuration resource provider."""
from typing import List, Set, Tuple

from opentrons_shared_data.deck.types import DeckDefinitionV5, CutoutFixture

from opentrons.types import DeckSlotName

from ..types import (
    AddressableArea,
    AreaType,
    PotentialCutoutFixture,
    DeckPoint,
    Dimensions,
    AddressableOffsetVector,
)
from ..errors import (
    CutoutDoesNotExistError,
    FixtureDoesNotExistError,
    AddressableAreaDoesNotExistError,
)


def get_cutout_position(cutout_id: str, deck_definition: DeckDefinitionV5) -> DeckPoint:
    """Get the base position of a cutout on the deck."""
    for cutout in deck_definition["locations"]["cutouts"]:
        if cutout_id == cutout["id"]:
            position = cutout["position"]
            return DeckPoint(x=position[0], y=position[1], z=position[2])
    else:
        raise CutoutDoesNotExistError(f"Could not find cutout with name {cutout_id}")


def get_cutout_fixture(
    cutout_fixture_id: str, deck_definition: DeckDefinitionV5
) -> CutoutFixture:
    """Gets cutout fixture from deck that matches the cutout fixture ID provided."""
    for cutout_fixture in deck_definition["cutoutFixtures"]:
        if cutout_fixture["id"] == cutout_fixture_id:
            return cutout_fixture
    raise FixtureDoesNotExistError(
        f"Could not find cutout fixture with name {cutout_fixture_id}"
    )


def get_provided_addressable_area_names(
    cutout_fixture_id: str, cutout_id: str, deck_definition: DeckDefinitionV5
) -> List[str]:
    """Gets a list of the addressable areas provided by the cutout fixture on the cutout."""
    cutout_fixture = get_cutout_fixture(cutout_fixture_id, deck_definition)
    try:
        return cutout_fixture["providesAddressableAreas"][cutout_id]
    except KeyError:
        return []


def get_addressable_area_display_name(
    addressable_area_name: str, deck_definition: DeckDefinitionV5
) -> str:
    """Get the display name for an addressable area name."""
    for addressable_area in deck_definition["locations"]["addressableAreas"]:
        if addressable_area["id"] == addressable_area_name:
            return addressable_area["displayName"]
    raise AddressableAreaDoesNotExistError(
        f"Could not find addressable area with name {addressable_area_name}"
    )


def get_potential_cutout_fixtures(
    addressable_area_name: str, deck_definition: DeckDefinitionV5
) -> Tuple[str, Set[PotentialCutoutFixture]]:
    """Given an addressable area name, gets the cutout ID associated with it and a set of potential fixtures."""
    potential_fixtures = []
    for cutout_fixture in deck_definition["cutoutFixtures"]:
        for cutout_id, provided_areas in cutout_fixture[
            "providesAddressableAreas"
        ].items():
            if addressable_area_name in provided_areas:
                potential_fixtures.append(
                    PotentialCutoutFixture(
                        cutout_id=cutout_id,
                        cutout_fixture_id=cutout_fixture["id"],
                        provided_addressable_areas=frozenset(provided_areas),
                    )
                )
    # This following logic is making the assumption that every addressable area can only go on one cutout, though
    # it may have multiple cutout fixtures that supply it on that cutout. If this assumption changes, some of the
    # following logic will have to be readjusted
    if not potential_fixtures:
        raise AddressableAreaDoesNotExistError(
            f"{addressable_area_name} is not provided by any cutout fixtures"
            f" in deck definition {deck_definition['otId']}"
        )
    cutout_id = potential_fixtures[0].cutout_id
    assert all(cutout_id == fixture.cutout_id for fixture in potential_fixtures)
    return cutout_id, set(potential_fixtures)


def get_addressable_area_from_name(
    addressable_area_name: str,
    cutout_position: DeckPoint,
    base_slot: DeckSlotName,
    deck_definition: DeckDefinitionV5,
) -> AddressableArea:
    """Given a name and a cutout position, get an addressable area on the deck."""
    for addressable_area in deck_definition["locations"]["addressableAreas"]:
        if addressable_area["id"] == addressable_area_name:
            area_offset = addressable_area["offsetFromCutoutFixture"]
            position = AddressableOffsetVector(
                x=area_offset[0] + cutout_position.x,
                y=area_offset[1] + cutout_position.y,
                z=area_offset[2] + cutout_position.z,
            )
            bounding_box = Dimensions(
                x=addressable_area["boundingBox"]["xDimension"],
                y=addressable_area["boundingBox"]["yDimension"],
                z=addressable_area["boundingBox"]["zDimension"],
            )

            return AddressableArea(
                area_name=addressable_area["id"],
                area_type=AreaType(addressable_area["areaType"]),
                base_slot=base_slot,
                display_name=addressable_area["displayName"],
                bounding_box=bounding_box,
                position=position,
                compatible_module_types=addressable_area.get(
                    "compatibleModuleTypes", []
                ),
            )
    raise AddressableAreaDoesNotExistError(
        f"Could not find addressable area with name {addressable_area_name}"
    )
