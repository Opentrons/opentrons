from typing import Dict, Type
import json
from pathlib import Path
import pydantic

from .constants import (
    DeckVersionType,
    DEFAULT_DECK_DEFINITION_VERSION,
    DECK_DEF_V3,
    DECK_DEF_V4,
    DECK_DEF_V5,
)
from .models import (
    DeckDefinitionABC,
    DeckDefinitionV3,
    DeckDefinitionV4,
    DeckDefinitionV5,
)

from opentrons_shared_data.load import load_shared_data

DECK_DEF_LOOK_UP: Dict[DeckVersionType, Type[DeckDefinitionABC]] = {
    DECK_DEF_V3: DeckDefinitionV3,
    DECK_DEF_V4: DeckDefinitionV4,
    DECK_DEF_V5: DeckDefinitionV5,
}


class InvalidDeckDefinition(Exception):
    """Incorrect Deck definition."""

    pass


def load(
    name: str, version: DeckVersionType = DEFAULT_DECK_DEFINITION_VERSION
) -> DeckDefinitionABC:
    try:
        model = DECK_DEF_LOOK_UP[version]
        path = Path("deck") / "definitions" / f"{version}" / f"{name}.json"
        return model.parse_obj(json.loads(load_shared_data(path)))
    except pydantic.ValidationError as e:
        raise InvalidDeckDefinition(f"Deck definition is malformed as a {model}") from e
