import pytest
from opentrons_shared_data.deck.load import load
from opentrons_shared_data.deck.constants import AVAILBLE_VERSIONS, DeckVersionType
from opentrons_shared_data.deck.types import DeckType
from opentrons_shared_data.deck.models import DeckDefinitionABC


@pytest.mark.parametrize("deck_type", DeckType)
@pytest.mark.parametrize("version", AVAILBLE_VERSIONS)
def test_load_definition(deck_type: DeckType, version: DeckVersionType) -> None:
    deck_def = load(deck_type, version)
    assert isinstance(deck_def, DeckDefinitionABC)
    assert deck_def.schemaVersion == version
