"""Test deck data provider."""
import pytest
from mock import AsyncMock  # type: ignore[attr-defined]

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName

from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.resources import (
    LabwareDataProvider,
    DeckDataProvider,
    DeckFixedLabware,
)


@pytest.fixture
def mock_labware_data(minimal_labware_def: LabwareDefinition) -> AsyncMock:
    """Get a mock in the shape of the LabwareDataProvider."""
    return AsyncMock(spec=LabwareDataProvider)


@pytest.fixture
def deck_data(mock_labware_data: AsyncMock) -> DeckDataProvider:
    """Create a DeckDataProvider with mocked out dependencies."""
    return DeckDataProvider(labware_data=mock_labware_data)


async def test_get_deck_definition(
    standard_deck_def: DeckDefinitionV2,
    deck_data: DeckDataProvider,
) -> None:
    """It should be able to load the deck definition."""
    result = await deck_data.get_deck_definition()
    assert result == standard_deck_def


async def test_get_deck_definition_short_trash(
    short_trash_deck_def: DeckDefinitionV2,
    deck_data: DeckDataProvider,
) -> None:
    """It should be able to load the short-trash deck definition."""
    result = await deck_data.get_deck_definition(short_fixed_trash=True)
    assert result == short_trash_deck_def


async def test_get_deck_labware_fixtures(
    standard_deck_def: DeckDefinitionV2,
    fixed_trash_def: LabwareDefinition,
    mock_labware_data: AsyncMock,
    deck_data: DeckDataProvider,
) -> None:
    """It should be able to get a list of prepopulated labware on the deck."""
    mock_labware_data.get_labware_definition.return_value = fixed_trash_def

    result = await deck_data.get_deck_fixed_labware(standard_deck_def)

    assert result == [
        DeckFixedLabware(
            labware_id="fixedTrash",
            location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
            definition=fixed_trash_def,
        )
    ]
    mock_labware_data.get_labware_definition.assert_called_with(
        load_name="opentrons_1_trash_1100ml_fixed",
        namespace="opentrons",
        version=1,
    )


async def test_get_deck_labware_fixtures_short_trash(
    short_trash_deck_def: DeckDefinitionV2,
    short_fixed_trash_def: LabwareDefinition,
    mock_labware_data: AsyncMock,
    deck_data: DeckDataProvider,
) -> None:
    """It should be able to get a list of prepopulated labware on the deck."""
    mock_labware_data.get_labware_definition.return_value = short_fixed_trash_def

    result = await deck_data.get_deck_fixed_labware(short_trash_deck_def)

    assert result == [
        DeckFixedLabware(
            labware_id="fixedTrash",
            location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
            definition=short_fixed_trash_def,
        )
    ]
    mock_labware_data.get_labware_definition.assert_called_with(
        load_name="opentrons_1_trash_850ml_fixed",
        namespace="opentrons",
        version=1,
    )
