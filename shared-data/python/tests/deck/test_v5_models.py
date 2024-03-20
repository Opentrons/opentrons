import pytest


from opentrons_shared_data.deck import list_names as list_deck_definition_names
from opentrons_shared_data.load import load_shared_data
from opentrons_shared_data.deck.models.v5 import DeckDefinitionV5


@pytest.mark.parametrize("defname", list_deck_definition_names(version=5))
def test_v5_defs(defname):
    DeckDefinitionV5.parse_raw(load_shared_data(f"deck/definitions/5/{defname}.json"))
