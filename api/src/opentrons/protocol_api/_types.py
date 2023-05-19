from typing_extensions import Final
import enum


# TODO (tz, 5-18-23): think about a better name for it that would also work when we include staging area slots in the type.
class OffDeckType(enum.Enum):
    OFF_DECK = "off-deck"


OFF_DECK: Final = OffDeckType.OFF_DECK
