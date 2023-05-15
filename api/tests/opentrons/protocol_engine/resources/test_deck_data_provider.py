"""Test deck data provider."""
import pytest
from decoy import Decoy

from opentrons.config import feature_flags
from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
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
    ot2_standard_deck_def: DeckDefinitionV3,
    subject: DeckDataProvider,
) -> None:
    """It should be able to load the deck definition."""
    result = await subject.get_deck_definition()
    assert result == ot2_standard_deck_def


async def test_get_deck_definition_short_trash(
    decoy: Decoy,
    ot2_short_trash_deck_def: DeckDefinitionV3,
    subject: DeckDataProvider,
    mock_feature_flags: None,
) -> None:
    """It should be able to load the short-trash deck definition."""
    decoy.when(feature_flags.short_fixed_trash()).then_return(True)

    result = await subject.get_deck_definition()
    assert result == ot2_short_trash_deck_def


async def test_get_deck_labware_fixtures(
    decoy: Decoy,
    ot2_standard_deck_def: DeckDefinitionV3,
    ot2_fixed_trash_def: LabwareDefinition,
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
    ).then_return(ot2_fixed_trash_def)

    result = await subject.get_deck_fixed_labware(ot2_standard_deck_def)

    assert result == [
        DeckFixedLabware(
            labware_id="fixedTrash",
            location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
            definition=ot2_fixed_trash_def,
        )
    ]


async def test_get_deck_labware_fixtures_short_trash(
    decoy: Decoy,
    ot2_short_trash_deck_def: DeckDefinitionV3,
    ot2_short_fixed_trash_def: LabwareDefinition,
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
    ).then_return(ot2_short_fixed_trash_def)

    result = await subject.get_deck_fixed_labware(ot2_short_trash_deck_def)

    assert result == [
        DeckFixedLabware(
            labware_id="fixedTrash",
            location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
            definition=ot2_short_fixed_trash_def,
        )
    ]
