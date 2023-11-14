"""Addressable area state view tests."""
import inspect

import pytest
from decoy import Decoy
from typing import Dict, Set, Optional, cast

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4
from opentrons.types import Point, DeckSlotName

from opentrons.protocol_engine.errors import (
    AreaNotInDeckConfigurationError,
    IncompatibleAddressableAreaError,
    # SlotDoesNotExistError,
)
from opentrons.protocol_engine.resources import deck_configuration_provider
from opentrons.protocol_engine.state.addressable_areas import (
    AddressableAreaState,
    AddressableAreaView,
)
from opentrons.protocol_engine.types import (
    AddressableArea,
    PotentialCutoutFixture,
    Dimensions,
    DeckPoint,
    AddressableOffsetVector,
)


@pytest.fixture(autouse=True)
def patch_mock_move_types(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out move_types.py functions."""
    for name, func in inspect.getmembers(
        deck_configuration_provider, inspect.isfunction
    ):
        monkeypatch.setattr(deck_configuration_provider, name, decoy.mock(func=func))


def get_addressable_area_view(
    loaded_addressable_areas_by_name: Optional[Dict[str, AddressableArea]] = None,
    potential_cutout_fixtures_by_cutout_id: Optional[
        Dict[str, Set[PotentialCutoutFixture]]
    ] = None,
    deck_definition: Optional[DeckDefinitionV4] = None,
    use_simulated_deck_config: bool = False,
) -> AddressableAreaView:
    """Get a labware view test subject."""
    state = AddressableAreaState(
        loaded_addressable_areas_by_name=loaded_addressable_areas_by_name or {},
        potential_cutout_fixtures_by_cutout_id=potential_cutout_fixtures_by_cutout_id
        or {},
        deck_definition=deck_definition or cast(DeckDefinitionV4, {"otId": "fake"}),
        use_simulated_deck_config=use_simulated_deck_config,
    )

    return AddressableAreaView(state=state)


def test_get_loaded_addressable_area() -> None:
    """It should get the loaded addressable area."""
    addressable_area = AddressableArea(
        area_name="area",
        display_name="fancy name",
        bounding_box=Dimensions(x=1, y=2, z=3),
        position=AddressableOffsetVector(x=7, y=8, z=9),
        compatible_module_types=["magneticModuleType"],
        drop_tip_location=Point(11, 22, 33),
        drop_labware_location=None,
    )
    subject = get_addressable_area_view(
        loaded_addressable_areas_by_name={"abc": addressable_area}
    )

    assert subject.get_addressable_area("abc") is addressable_area


def test_get_loaded_addressable_area_raises() -> None:
    """It should raise if the addressable area does not exist."""
    subject = get_addressable_area_view()

    with pytest.raises(AreaNotInDeckConfigurationError):
        subject.get_addressable_area("abc")


def test_get_addressable_area_for_simulation_already_loaded() -> None:
    """It should get the addressable area for a simulation that has not been loaded yet."""
    addressable_area = AddressableArea(
        area_name="area",
        display_name="fancy name",
        bounding_box=Dimensions(x=1, y=2, z=3),
        position=AddressableOffsetVector(x=7, y=8, z=9),
        compatible_module_types=["magneticModuleType"],
        drop_tip_location=Point(11, 22, 33),
        drop_labware_location=None,
    )
    subject = get_addressable_area_view(
        loaded_addressable_areas_by_name={"abc": addressable_area},
        use_simulated_deck_config=True,
    )

    assert subject.get_addressable_area("abc") is addressable_area


def test_get_addressable_area_for_simulation_not_loaded(decoy: Decoy) -> None:
    """It should get the addressable area for a simulation that has not been loaded yet."""
    subject = get_addressable_area_view(
        potential_cutout_fixtures_by_cutout_id={
            "123": {PotentialCutoutFixture(cutout_id="123", cutout_fixture_id="blah")}
        },
        use_simulated_deck_config=True,
    )

    addressable_area = AddressableArea(
        area_name="area",
        display_name="fancy name",
        bounding_box=Dimensions(x=1, y=2, z=3),
        position=AddressableOffsetVector(x=7, y=8, z=9),
        compatible_module_types=["magneticModuleType"],
        drop_tip_location=Point(11, 22, 33),
        drop_labware_location=None,
    )

    decoy.when(
        deck_configuration_provider.get_potential_cutout_fixtures(
            "abc", subject.state.deck_definition
        )
    ).then_return(
        ("123", {PotentialCutoutFixture(cutout_id="123", cutout_fixture_id="blah")})
    )

    decoy.when(
        deck_configuration_provider.get_cutout_position(
            "123", subject.state.deck_definition
        )
    ).then_return(DeckPoint(x=1, y=2, z=3))

    decoy.when(
        deck_configuration_provider.get_addressable_area_from_name(
            "abc", DeckPoint(x=1, y=2, z=3), subject.state.deck_definition
        )
    ).then_return(addressable_area)

    assert subject.get_addressable_area("abc") is addressable_area


def test_get_addressable_area_for_simulation_raises(decoy: Decoy) -> None:
    """It should raise if the requested addressable area is incompatible with loaded ones."""
    subject = get_addressable_area_view(
        potential_cutout_fixtures_by_cutout_id={
            "123": {PotentialCutoutFixture(cutout_id="789", cutout_fixture_id="bleh")}
        },
        use_simulated_deck_config=True,
    )

    decoy.when(
        deck_configuration_provider.get_potential_cutout_fixtures(
            "abc", subject.state.deck_definition
        )
    ).then_return(
        ("123", {PotentialCutoutFixture(cutout_id="123", cutout_fixture_id="blah")})
    )

    decoy.when(
        deck_configuration_provider.get_provided_addressable_area_names(
            "bleh", "789", subject.state.deck_definition
        )
    ).then_return([])

    with pytest.raises(IncompatibleAddressableAreaError):
        subject.get_addressable_area("abc")


def test_get_addressable_area_position() -> None:
    """It should get the absolute location of the addressable area."""
    subject = get_addressable_area_view(
        loaded_addressable_areas_by_name={
            "abc": AddressableArea(
                area_name="area",
                display_name="fancy name",
                bounding_box=Dimensions(x=10, y=20, z=30),
                position=AddressableOffsetVector(x=1, y=2, z=3),
                compatible_module_types=[],
                drop_tip_location=None,
                drop_labware_location=None,
            )
        }
    )

    result = subject.get_addressable_area_position("abc")
    assert result == Point(1, 2, 3)


def test_get_addressable_area_center() -> None:
    """It should get the absolute location of an addressable area's center."""
    subject = get_addressable_area_view(
        loaded_addressable_areas_by_name={
            "abc": AddressableArea(
                area_name="area",
                display_name="fancy name",
                bounding_box=Dimensions(x=10, y=20, z=30),
                position=AddressableOffsetVector(x=1, y=2, z=3),
                compatible_module_types=[],
                drop_tip_location=None,
                drop_labware_location=None,
            )
        }
    )

    result = subject.get_addressable_area_center("abc")
    assert result == Point(6, 12, 3)


def test_get_slot_definition() -> None:
    """It should return a deck slot's definition."""
    subject = get_addressable_area_view(
        loaded_addressable_areas_by_name={
            "6": AddressableArea(
                area_name="area",
                display_name="fancy name",
                bounding_box=Dimensions(x=1, y=2, z=3),
                position=AddressableOffsetVector(x=7, y=8, z=9),
                compatible_module_types=["magneticModuleType"],
                drop_tip_location=None,
                drop_labware_location=None,
            )
        }
    )

    result = subject.get_slot_definition(DeckSlotName.SLOT_6)

    assert result == {
        "id": "area",
        "position": [7, 8, 9],
        "boundingBox": {
            "xDimension": 1,
            "yDimension": 2,
            "zDimension": 3,
        },
        "displayName": "fancy name",
        "compatibleModuleTypes": ["magneticModuleType"],
    }


# TODO Uncomment once Robot Server deck config and tests is hooked up
# def test_get_slot_definition_raises_with_bad_slot_name() -> None:
#     """It should raise a SlotDoesNotExistError if a bad slot name is given."""
#     subject = get_addressable_area_view()
#
#     with pytest.raises(SlotDoesNotExistError):
#         subject.get_slot_definition(DeckSlotName.SLOT_A1)
