"""Tests for opentrons.legacy.Deck."""
import inspect
from typing import cast, Dict

import pytest
from decoy import Decoy

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4, SlotDefV3

from opentrons.motion_planning import adjacent_slots_getters as mock_adjacent_slots
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import APIVersionError
from opentrons.protocol_api.core.common import ProtocolCore, LabwareCore, ModuleCore
from opentrons.protocol_api.core.core_map import LoadedCoreMap
from opentrons.protocol_api import (
    Deck,
    Labware,
    OFF_DECK,
    validation as mock_validation,
)
from opentrons.protocol_api.deck import CalibrationPosition
from opentrons.types import DeckSlotName, Point


@pytest.fixture
def deck_definition() -> DeckDefinitionV4:
    """Get a deck definition value object."""
    return cast(
        DeckDefinitionV4,
        {
            "locations": {"addressableAreas": [], "calibrationPoints": []},
            "cutoutFixtures": {},
        },
    )


@pytest.fixture
def api_version() -> APIVersion:
    """Get a dummy `APIVersion` with which to configure the subject."""
    return APIVersion(1, 234)


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
def slot_definitions_by_name() -> Dict[str, SlotDefV3]:
    """Get a dictionary of slot names to slot definitions."""
    return {"1": {}}


@pytest.fixture
def staging_slot_definitions_by_name() -> Dict[str, SlotDefV3]:
    """Get a dictionary of staging slot names to slot definitions."""
    return {"2": {}}


@pytest.fixture
def subject(
    decoy: Decoy,
    deck_definition: DeckDefinitionV4,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    api_version: APIVersion,
    slot_definitions_by_name: Dict[str, SlotDefV3],
    staging_slot_definitions_by_name: Dict[str, SlotDefV3],
) -> Deck:
    """Get a Deck test subject with its dependencies mocked out."""
    decoy.when(mock_protocol_core.get_deck_definition()).then_return(deck_definition)
    decoy.when(mock_protocol_core.get_slot_definitions()).then_return(
        slot_definitions_by_name
    )
    decoy.when(mock_protocol_core.get_staging_slot_definitions()).then_return(
        staging_slot_definitions_by_name
    )

    return Deck(
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
        api_version=api_version,
    )


def test_get_empty_slot(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should return None for slots if empty."""
    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(42, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_2)).then_return(None)

    assert subject[42] is None


def test_get_slot_invalid_key(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should map a ValueError from validation to a KeyError."""
    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(1, api_version, "OT-3 Standard")
    ).then_raise(TypeError("uh oh"))
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(2, api_version, "OT-3 Standard")
    ).then_raise(ValueError("oh no"))

    with pytest.raises(KeyError, match="1"):
        subject[1]

    with pytest.raises(KeyError, match="2"):
        subject[2]


def test_get_slot_item(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should map a ValueError from validation to a KeyError."""
    mock_labware_core = decoy.mock(cls=LabwareCore)
    mock_labware = decoy.mock(cls=Labware)

    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(42, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_2)).then_return(
        mock_labware_core
    )
    decoy.when(mock_core_map.get(mock_labware_core)).then_return(mock_labware)

    assert subject[42] is mock_labware


def test_delitem_aliases_to_move_labware(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should be equivalent to a manual labware move to off-deck, without pausing."""
    mock_labware_core = decoy.mock(cls=LabwareCore)

    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(42, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_2)).then_return(
        mock_labware_core
    )

    del subject[42]

    decoy.verify(
        mock_protocol_core.move_labware(
            mock_labware_core,
            OFF_DECK,
            use_gripper=False,
            pause_for_manual_move=False,
            pick_up_offset=None,
            drop_offset=None,
        )
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 14)])
def test_delitem_raises_on_api_2_14(
    subject: Deck,
) -> None:
    """It should raise on apiLevel 2.14."""
    with pytest.raises(APIVersionError):
        del subject[1]


def test_delitem_noops_if_slot_is_empty(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should do nothing, and not raise anything, if you try to delete from an empty slot."""
    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(1, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_1)
    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_1)).then_return(None)

    del subject[1]


def test_delitem_raises_if_slot_has_module(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should raise a descriptive error if you try to delete a module."""
    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    mock_module_core = decoy.mock(cls=ModuleCore)
    decoy.when(mock_module_core.get_display_name()).then_return("<module display name>")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(2, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.get_slot_item(DeckSlotName.SLOT_2)).then_return(
        mock_module_core
    )

    with pytest.raises(
        TypeError,
        match=(
            "Slot 2 contains a module, <module display name>."
            " You can only delete labware, not modules."
        ),
    ):
        del subject[2]


@pytest.mark.parametrize(
    argnames=["slot_definitions_by_name", "staging_slot_definitions_by_name"],
    argvalues=[
        (
            {
                "1": {},
                "2": {},
                "3": {},
            },
            {"4": {}},
        )
    ],
)
def test_slot_keys_iter(subject: Deck) -> None:
    """It should provide an iterable interface to deck slots."""
    result = list(subject)

    assert len(subject) == 3
    assert result == ["1", "2", "3"]


@pytest.mark.parametrize(
    argnames=[
        "slot_definitions_by_name",
        "staging_slot_definitions_by_name",
        "api_version",
    ],
    argvalues=[
        (
            {
                "1": {},
                "2": {},
                "3": {},
            },
            {"4": {}},
            APIVersion(2, 16),
        )
    ],
)
def test_slot_keys_iter_with_staging_slots(subject: Deck) -> None:
    """It should provide an iterable interface to deck slots."""
    result = list(subject)

    assert len(subject) == 4
    assert result == ["1", "2", "3", "4"]


@pytest.mark.parametrize(
    "slot_definitions_by_name",
    [
        {
            "1": {"id": "fee"},
            "2": {"id": "foe"},
            "3": {"id": "fum"},
        }
    ],
)
def test_slots_property(subject: Deck) -> None:
    """It should provide slot definitions."""
    assert subject.slots == [
        {"id": "fee"},
        {"id": "foe"},
        {"id": "fum"},
    ]


@pytest.mark.parametrize(
    "slot_definitions_by_name",
    [
        {
            "2": {
                "id": DeckSlotName.SLOT_2.id,
                "displayName": "foobar",
            }
        }
    ],
)
def test_get_slot_definition(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should provide slot definitions."""
    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(222, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_2)

    assert subject.get_slot_definition(222) == {
        "id": DeckSlotName.SLOT_2.id,
        "displayName": "foobar",
    }


@pytest.mark.parametrize(
    "slot_definitions_by_name",
    [{"3": {"position": [1.0, 2.0, 3.0]}}],
)
def test_get_position_for(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should return a `Location` for a deck slot."""
    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(333, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_3)
    decoy.when(
        mock_validation.internal_slot_to_public_string(
            DeckSlotName.SLOT_3, "OT-3 Standard"
        )
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
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should return items left and right of a slot."""
    left_labware_core = decoy.mock(cls=LabwareCore)
    right_labware_core = decoy.mock(cls=LabwareCore)
    left_labware = decoy.mock(cls=Labware)
    right_labware = decoy.mock(cls=Labware)

    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")

    decoy.when(mock_adjacent_slots.get_east_slot(4)).then_return(111)
    decoy.when(mock_adjacent_slots.get_west_slot(4)).then_return(999)
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(444, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_4)
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(111, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_1)
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(999, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_9)

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
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    api_version: APIVersion,
    subject: Deck,
) -> None:
    """It should get the geometric center of a slot."""
    decoy.when(mock_protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(
        mock_validation.ensure_and_convert_deck_slot(222, api_version, "OT-3 Standard")
    ).then_return(DeckSlotName.SLOT_2)
    decoy.when(mock_protocol_core.get_slot_center(DeckSlotName.SLOT_2)).then_return(
        Point(1, 2, 3)
    )

    assert subject.get_slot_center(222) == Point(1, 2, 3)
