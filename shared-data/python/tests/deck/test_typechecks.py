import sys

import pytest
import typeguard

from opentrons_shared_data.deck import load as load_deck_definition
from opentrons_shared_data.deck.dev_types import DeckDefinitionV3

from . import list_deck_def_paths


pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


@pytest.mark.parametrize("defname", list_deck_def_paths(version=3))
def test_v3_defs(defname):
    defn = load_deck_definition(name=defname, version=3)
    typeguard.check_type("defn", defn, DeckDefinitionV3)
