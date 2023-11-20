import sys

import pytest
import typeguard

from opentrons_shared_data.deck import (
    list_names as list_deck_definition_names,
    load as load_deck_definition,
)
from opentrons_shared_data.deck.dev_types import DeckDefinitionV3, DeckDefinitionV4


pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


@pytest.mark.parametrize("defname", list_deck_definition_names(version=3))
def test_v3_defs(defname):
    defn = load_deck_definition(name=defname, version=3)
    typeguard.check_type("defn", defn, DeckDefinitionV3)


@pytest.mark.parametrize("defname", list_deck_definition_names(version=4))
def test_v4_defs(defname):
    defn = load_deck_definition(name=defname, version=4)
    typeguard.check_type("defn", defn, DeckDefinitionV4)
