import pytest
import typeguard
from opentrons_shared_data.deck.load import load
from opentrons_shared_data.deck.constants import DeckVersionType
from opentrons_shared_data.deck.types import DeckType
from opentrons_shared_data.deck.models import (
    DeckDefinitionABC,
    DeckDefinitionV3,
    DeckDefinitionV4,
    DeckDefinitionV5,
)


@pytest.mark.parametrize("deck", DeckType)
@pytest.mark.parametrize(
    "version,def_type",
    [
        (3, DeckDefinitionV3),
        (4, DeckDefinitionV4),
        (5, DeckDefinitionV5),
    ],
)
def test_load_definition(
    deck: DeckType, version: DeckVersionType, def_type: DeckDefinitionABC
) -> None:
    deck_def = load(deck, version)
    typeguard.check_type(deck_def, def_type)
    assert deck_def.schemaVersion == version
