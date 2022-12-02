import sys

import pytest
import typeguard

from opentrons_shared_data.deck import DefinitionName, load
from opentrons_shared_data.deck.dev_types import DeckDefinitionV3

pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


@pytest.mark.parametrize(
    # Parametrize over all values of the DefinitionName enum.
    "definition_name",
    DefinitionName,
)
def test_v3_defs(definition_name: DefinitionName) -> None:
    definition = load(name=definition_name, version=3)
    typeguard.check_type("definition", definition, DeckDefinitionV3)
