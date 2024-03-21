from typing import Literal

from enum import Enum

DeckDefinitionVersion = Literal[3, 4, 5]


class DeckType(str, Enum):
    """Types of deck available."""

    OT2_STANDARD = "ot2_standard"
    OT2_SHORT_TRASH = "ot2_short_trash"
    OT3_STANDARD = "ot3_standard"
