"""Tests for opentrons.legacy.Deck."""
import inspect
from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3

from opentrons.motion_planning import adjacent_slots_getters as mock_adjacent_slots
from opentrons.protocol_api.core.common import ProtocolCore, LabwareCore
from opentrons.protocol_api.core.core_map import LoadedCoreMap
from opentrons.protocol_api import Deck, Labware, validation as mock_validation
from opentrons.protocol_api.deck import CalibrationPosition
from opentrons.types import DeckSlotName, Point


@pytest.fixture
def deck_definition() -> DeckDefinitionV3:
    """Get a deck definition value object."""
    return cast(
        DeckDefinitionV3, {"locations": {"orderedSlots": [], "calibrationPoints": []}}
    )


@pytest.fixture(autouse=True)
def _mock_validation_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out opentrons.legacy.validation functions."""
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _mock_adjacent_slots_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out opentrons.motion_planning.adjacent_slots_getters functions."""
    for name, func in inspect.getmembers(mock_adjacent_slots, inspect.isfunction):
        monkeypatch.setattr(mock_adjacent_slots, name, decoy.mock(func=func))


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock ProtocolCore."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_core_map(decoy: Decoy) -> LoadedCoreMap:
    """Get a mock LoadedCoreMap."""
    return decoy.mock(cls=LoadedCoreMap)


@pytest.fixture
def subject(
    decoy: Decoy,
    deck_definition: DeckDefinitionV3,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
) -> Deck:
    """Get a Deck test subject with its dependencies mocked out."""
    decoy.when(mock_protocol_core.get_deck_definition()).then_return(deck_definition)

    return Deck(
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
    )


def test_get_empty_slot(
    decoy: Decoy, mock_protocol_core: ProtocolCore, subject: Deck
) -> None:
    """It should return None for slots if empty."""
    decoy.when(mock_validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_2)).then_return(None)

    assert subject[42] is None


def test_get_slot_invalid_key(
    decoy: Decoy, mock_protocol_core: ProtocolCore, subject: Deck
) -> None:
    """It should map a ValueError from validation to a KeyError."""
    decoy.when(mock_validation.ensure_deck_slot(1)).then_raise(TypeError("uh oh"))
    decoy.when(mock_validation.ensure_deck_slot(2)).then_raise(ValueError("oh no"))

    with pytest.raises(KeyError, match="uh oh"):
        subject[1]

    with pytest.raises(KeyError, match="oh no"):
        subject[2]


def test_get_slot_item(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: Deck,
) -> None:
    """It should map a ValueError from validation to a KeyError."""
    mock_labware_core = decoy.mock(cls=LabwareCore)
    mock_labware = decoy.mock(cls=Labware)

    decoy.when(mock_validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_2)).then_return(
        mock_labware_core
    )
    decoy.when(mock_core_map.get(mock_labware_core)).then_return(mock_labware)

    assert subject[42] is mock_labware


@pytest.mark.parametrize(
    "deck_definition",
    [
        {
            "locations": {
                "orderedSlots": [
                    {"id": "1"},
                    {"id": "2"},
                    {"id": "3"},
                ],
                "calibrationPoints": [],
            }
        },
    ],
)
def test_slot_keys_iter(subject: Deck) -> None:
    """It should provide an iterable interface to deck slots."""
    result = list(subject)

    assert len(subject) == 3
    assert result == ["1", "2", "3"]


@pytest.mark.parametrize(
    "deck_definition",
    [
        {
            "locations": {
                "orderedSlots": [
                    {"id": "fee"},
                    {"id": "foe"},
                    {"id": "fum"},
                ],
                "calibrationPoints": [],
            }
        },
    ],
)
def test_get_slots(
    decoy: Decoy, mock_protocol_core: ProtocolCore, subject: Deck
) -> None:
    """It should provide slot definitions."""
    decoy.when(mock_validation.ensure_deck_slot(222)).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.robot_type).then_return("OT-2 Standard")
    decoy.when(
        mock_validation.ensure_deck_slot_string(DeckSlotName.SLOT_2, "OT-2 Standard")
    ).then_return("fee")

    assert subject.slots == [
        {"id": "fee"},
        {"id": "foe"},
        {"id": "fum"},
    ]

    assert subject.get_slot_definition(222) == {"id": "fee"}


@pytest.mark.parametrize(
    "deck_definition",
    [
        {
            "locations": {
                "orderedSlots": [
                    {"id": "foo", "position": [1.0, 2.0, 3.0]},
                ],
                "calibrationPoints": [],
            }
        },
    ],
)
def test_get_position_for(
    decoy: Decoy, mock_protocol_core: ProtocolCore, subject: Deck
) -> None:
    """It should return a `Location` for a deck slot."""
    decoy.when(mock_validation.ensure_deck_slot(333)).then_return(DeckSlotName.SLOT_3)
    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_deck_slot_string(DeckSlotName.SLOT_3, "OT-3 Standard")
    ).then_return("foo")

    result = subject.position_for(333)
    assert result.point == Point(x=1.0, y=2.0, z=3.0)
    assert result.labware.is_slot is True
    assert str(result.labware) == "foo"


def test_highest_z(
    decoy: Decoy, mock_protocol_core: ProtocolCore, subject: Deck
) -> None:
    """It should return the highest Z point of all deck items."""
    decoy.when(mock_protocol_core.get_highest_z()).then_return(42.0)

    assert subject.highest_z == 42.0


def test_right_of_and_left_of(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: Deck,
) -> None:
    """It should return items left and right of a slot."""
    left_labware_core = decoy.mock(cls=LabwareCore)
    right_labware_core = decoy.mock(cls=LabwareCore)
    left_labware = decoy.mock(cls=Labware)
    right_labware = decoy.mock(cls=Labware)

    decoy.when(mock_adjacent_slots.get_east_slot(4)).then_return(111)
    decoy.when(mock_adjacent_slots.get_west_slot(4)).then_return(999)
    decoy.when(mock_validation.ensure_deck_slot(444)).then_return(DeckSlotName.SLOT_4)
    decoy.when(mock_validation.ensure_deck_slot(111)).then_return(DeckSlotName.SLOT_1)
    decoy.when(mock_validation.ensure_deck_slot(999)).then_return(DeckSlotName.SLOT_9)

    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_1)).then_return(
        right_labware_core
    )
    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_9)).then_return(
        left_labware_core
    )

    decoy.when(mock_core_map.get(right_labware_core)).then_return(right_labware)
    decoy.when(mock_core_map.get(left_labware_core)).then_return(left_labware)

    assert subject.right_of(444) is right_labware
    assert subject.left_of(444) is left_labware


@pytest.mark.parametrize(
    "deck_definition",
    [
        {
            "locations": {
                "orderedSlots": [],
                "calibrationPoints": [
                    {
                        "id": "123",
                        "position": [1.0, 2.0, 3.0],
                        "displayName": "Point 123",
                    },
                    {
                        "id": "456",
                        "position": [4.0, 5.0, 6.0],
                        "displayName": "Point 456",
                    },
                ],
            }
        },
    ],
)
def test_get_calibration_positions(subject: Deck) -> None:
    """It should return calibration positions from the definition."""
    assert subject.calibration_positions == [
        CalibrationPosition(
            id="123", position=(1.0, 2.0, 3.0), displayName="Point 123"
        ),
        CalibrationPosition(
            id="456", position=(4.0, 5.0, 6.0), displayName="Point 456"
        ),
    ]


def test_get_slot_center(
    decoy: Decoy, mock_protocol_core: ProtocolCore, subject: Deck
) -> None:
    """It should get the geometric center of a slot."""
    decoy.when(mock_validation.ensure_deck_slot(222)).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.get_slot_center(DeckSlotName.SLOT_2)).then_return(
        Point(1, 2, 3)
    )

    assert subject.get_slot_center(222) == Point(1, 2, 3)
