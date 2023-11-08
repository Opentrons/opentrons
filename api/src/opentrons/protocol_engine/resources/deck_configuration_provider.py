"""Deck configuration resource provider."""
from dataclasses import dataclass
from typing import List, Set, Dict, Tuple, Optional

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4, CutoutFixture

from ..types import (
    AddressableArea,
    PotentialCutoutFixture,
    DeckPoint,
    Dimensions,
    AddressableOffsetVector,
    LabwareOffsetVector,
)
from ..errors import FixtureDoesNotExistError


@dataclass(frozen=True)
class DeckCutoutFixture:
    """Basic cutout fixture data class."""

    name: str
    # TODO(jbl 10-30-2023) this is in reference to the cutout ID that is supplied in mayMountTo in the definition.
    #   We might want to make this not a string.
    cutout_slot_location: str


class DeckConfigurationProvider:
    """Provider class to ingest deck configuration data and retrieve relevant deck definition data."""

    _configuration: Dict[str, DeckCutoutFixture]

    def __init__(
        self,
        deck_definition: DeckDefinitionV4,
        deck_configuration: List[DeckCutoutFixture],
    ) -> None:
        """Initialize a DeckDataProvider."""
        self._deck_definition = deck_definition
        self._configuration = {
            cutout_fixture.cutout_slot_location: cutout_fixture
            for cutout_fixture in deck_configuration
        }

    def get_addressable_areas_for_cutout_fixture(
        self, cutout_fixture_id: str, cutout_id: str
    ) -> Set[str]:
        """Get the allowable addressable areas for a cutout fixture loaded on a specific cutout slot."""
        for cutout_fixture in self._deck_definition["cutoutFixtures"]:
            if cutout_fixture_id == cutout_fixture["id"]:
                return set(
                    cutout_fixture["providesAddressableAreas"].get(cutout_id, [])
                )

        raise FixtureDoesNotExistError(
            f'Could not resolve "{cutout_fixture_id}" to a fixture.'
        )

    def get_configured_addressable_areas(self) -> Set[str]:
        """Get a list of all addressable areas the robot is configured for."""
        configured_addressable_areas = set()
        for cutout_id, cutout_fixture in self._configuration.items():
            addressable_areas = self.get_addressable_areas_for_cutout_fixture(
                cutout_fixture.name, cutout_id
            )
            configured_addressable_areas.update(addressable_areas)
        return configured_addressable_areas

    # def get_addressable_area_definition(
    #     self, addressable_area_name: str
    # ) -> AddressableArea:
    #     """Get the addressable area definition from the relevant deck definition."""
    #     for addressable_area in self._deck_definition["locations"]["addressableAreas"]:
    #         if addressable_area_name == addressable_area["id"]:
    #             return addressable_area
    #
    #     raise FixtureDoesNotExistError(
    #         f'Could not resolve "{addressable_area_name}" to a fixture.'
    #     )


def get_cutout_fixtures_by_id(
    cutout_fixture_id: str, deck_definition: DeckDefinitionV4
) -> CutoutFixture:
    """Gets cutout fixture from deck that matches the cutout fixture ID provided."""
    for cutout_fixture in deck_definition["cutoutFixtures"]:
        if cutout_fixture["id"] == cutout_fixture_id:
            return cutout_fixture
    raise RuntimeError("Not cutout fixture")


def get_potential_cutout_fixtures(
    addressable_area_name: str, deck_definition: DeckDefinitionV4
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
                    )
                )
    # This following logic is making the assumption that every addressable area can only go on one cutout, though
    # it may have multiple cutout fixtures that supply it on that cutout. If this assumption changes, some of the
    # following logic will have to be readjusted
    assert (
        potential_fixtures
    ), f"No potential fixtures for addressable area {addressable_area_name}"
    cutout_id = potential_fixtures[0].cutout_id
    assert all(cutout_id == fixture.cutout_id for fixture in potential_fixtures)
    return cutout_id, set(potential_fixtures)


def get_cutout_position(cutout_id: str, deck_definition: DeckDefinitionV4) -> DeckPoint:
    """Get the base position of a cutout on the deck."""
    for cutout in deck_definition["locations"]["cutouts"]:
        if cutout_id == cutout["id"]:
            position = cutout["position"]
            return DeckPoint(x=position[0], y=position[1], z=position[2])
    else:
        raise RuntimeError("This shouldn't happen.")


def get_addressable_area_from_name(
    addressable_area_name: str,
    cutout_position: DeckPoint,
    deck_definition: DeckDefinitionV4,
) -> AddressableArea:
    """Given a name and a cutout position, get an addressable area on the deck."""
    for addressable_area in deck_definition["locations"]["addressableAreas"]:
        if addressable_area["id"] == addressable_area_name:
            area_offset = addressable_area["offsetFromCutoutFixture"]
            position = AddressableOffsetVector(
                x=cutout_position.x + area_offset[0],
                y=cutout_position.y + area_offset[1],
                z=cutout_position.z + area_offset[2],
            )
            bounding_box = Dimensions(
                x=addressable_area["boundingBox"]["xDimension"],
                y=addressable_area["boundingBox"]["yDimension"],
                z=addressable_area["boundingBox"]["zDimension"],
            )
            drop_tips_deck_offset = addressable_area.get("dropTipsOffset")
            drop_tips_offset: Optional[LabwareOffsetVector]
            if drop_tips_deck_offset:
                drop_tips_offset = LabwareOffsetVector(
                    x=drop_tips_deck_offset[0],
                    y=drop_tips_deck_offset[1],
                    z=drop_tips_deck_offset[2],
                )
            else:
                drop_tips_offset = None

            drop_labware_deck_offset = addressable_area.get("dropLabwareOffset")
            drop_labware_offset: Optional[LabwareOffsetVector]
            if drop_labware_deck_offset:
                drop_labware_offset = LabwareOffsetVector(
                    x=drop_labware_deck_offset[0],
                    y=drop_labware_deck_offset[1],
                    z=drop_labware_deck_offset[2],
                )
            else:
                drop_labware_offset = None

            return AddressableArea(
                area_name=addressable_area["id"],
                display_name=addressable_area["displayName"],
                bounding_box=bounding_box,
                position=position,
                compatible_module_types=[],  # TODO figure out getting this correct later
                drop_tip_offset=drop_tips_offset,
                drop_labware_offset=drop_labware_offset,
            )
    raise RuntimeError("This shouldn't happen.")


def get_addressable_areas_from_cutout_and_cutout_fixture(
    cutout_id: str, cutout_fixture: CutoutFixture, deck_definition: DeckDefinitionV4
) -> Set[AddressableArea]:
    """Get all provided addressable areas for a given cutout fixture and associated cutout."""
    base_position = get_cutout_position(cutout_id, deck_definition)

    try:
        provided_areas = cutout_fixture["providesAddressableAreas"][cutout_id]
    except KeyError:
        raise RuntimeError("This also shouldn't happen.")

    return {
        get_addressable_area_from_name(
            addressable_area_name, base_position, deck_definition
        )
        for addressable_area_name in provided_areas
    }
