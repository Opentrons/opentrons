import pytest
import typeguard

from opentrons_shared_data.deck import load
from opentrons_shared_data.deck.dev_types import (
    DeckDefinitionV1, DeckDefinitionV2
)

from . import list_deck_def_paths


@pytest.mark.parametrize('defname', list_deck_def_paths(2))
def test_v2_defs(defname):
    defn = load(defname, 2)
    typeguard.check_type('defn', defn, DeckDefinitionV2)


@pytest.mark.parametrize('defname', list_deck_def_paths(1))
def test_v1_defs(defname):
    defn = load(defname, 1)
    typeguard.check_type('defn', defn, DeckDefinitionV1)
