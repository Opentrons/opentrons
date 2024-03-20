import pytest


from opentrons_shared_data.deck import list_names as list_deck_definition_names
from opentrons_shared_data.load import load_shared_data
from opentrons_shared_data.deck.models.v3 import DeckDefinitionV3


@pytest.mark.parametrize("defname", list_deck_definition_names(version=3))
def test_v3_defs(defname):
    DeckDefinitionV3.parse_raw(load_shared_data(f"deck/definitions/3/{defname}.json"))
