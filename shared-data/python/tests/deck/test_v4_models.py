import pytest


from opentrons_shared_data.deck import list_names as list_deck_definition_names
from opentrons_shared_data.load import load_shared_data
from opentrons_shared_data.deck.models.v4 import DeckDefinitionV4


@pytest.mark.parametrize("defname", list_deck_definition_names(version=4))
def test_v3_defs(defname):
    DeckDefinitionV4.parse_raw(load_shared_data(f"deck/definitions/4/{defname}.json"))
