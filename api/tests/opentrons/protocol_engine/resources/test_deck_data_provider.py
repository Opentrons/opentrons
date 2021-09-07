"""Test deck data provider."""
import pytest
from decoy import Decoy

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
def labware_data_provider(decoy: Decoy) -> LabwareDataProvider:
    """Get a mock in the shape of the LabwareDataProvider."""
    return decoy.mock(cls=LabwareDataProvider)


@pytest.fixture
def subject(labware_data_provider: LabwareDataProvider) -> DeckDataProvider:
    """Create a DeckDataProvider test subject with mocked out dependencies."""
    return DeckDataProvider(labware_data=labware_data_provider)


async def test_get_deck_definition(
    standard_deck_def: DeckDefinitionV2,
    subject: DeckDataProvider,
) -> None:
    """It should be able to load the deck definition."""
    result = await subject.get_deck_definition()
    assert result == standard_deck_def


async def test_get_deck_definition_short_trash(
    short_trash_deck_def: DeckDefinitionV2,
    subject: DeckDataProvider,
) -> None:
    """It should be able to load the short-trash deck definition."""
    result = await subject.get_deck_definition(short_fixed_trash=True)
    assert result == short_trash_deck_def


async def test_get_deck_labware_fixtures(
    decoy: Decoy,
    standard_deck_def: DeckDefinitionV2,
    fixed_trash_def: LabwareDefinition,
    labware_data_provider: LabwareDataProvider,
    subject: DeckDataProvider,
) -> None:
    """It should be able to get a list of prepopulated labware on the deck."""
    decoy.when(
        await labware_data_provider.get_labware_definition(
            load_name="opentrons_1_trash_1100ml_fixed",
            namespace="opentrons",
            version=1,
        )
    ).then_return(fixed_trash_def)

    result = await subject.get_deck_fixed_labware(standard_deck_def)

    assert result == [
        DeckFixedLabware(
            labware_id="fixedTrash",
            location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
            definition=fixed_trash_def,
        )
    ]


async def test_get_deck_labware_fixtures_short_trash(
    decoy: Decoy,
    short_trash_deck_def: DeckDefinitionV2,
    short_fixed_trash_def: LabwareDefinition,
    labware_data_provider: LabwareDataProvider,
    subject: DeckDataProvider,
) -> None:
    """It should be able to get a list of prepopulated labware on the deck."""
    decoy.when(
        await labware_data_provider.get_labware_definition(
            load_name="opentrons_1_trash_850ml_fixed",
            namespace="opentrons",
            version=1,
        )
    ).then_return(short_fixed_trash_def)

    result = await subject.get_deck_fixed_labware(short_trash_deck_def)

    assert result == [
        DeckFixedLabware(
            labware_id="fixedTrash",
            location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
            definition=short_fixed_trash_def,
        )
    ]
