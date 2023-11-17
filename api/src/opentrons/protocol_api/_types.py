from __future__ import annotations
from typing_extensions import Final
import enum


# TODO (tz, 5-18-23): think about a better name for it that would also work when we include staging area slots in the type.
class OffDeckType(enum.Enum):
    OFF_DECK = "off-deck"


OFF_DECK: Final = OffDeckType.OFF_DECK

# Set __doc__ manually as a workaround. When this docstring is written the normal way, right after
# the constant definition, Sphinx has trouble picking it up.
OFF_DECK.__doc__ = """\
A special location value, indicating that a labware is not currently on the robot's deck.

See :ref:`off-deck-location` for details on using ``OFF_DECK`` with :py:obj:`ProtocolContext.move_labware()`.
"""


# TODO(jbl 11-17-2023) move this away from being an Enum and make this a NewType or something similar
class StagingSlotName(enum.Enum):
    """Staging slot identifiers."""

    SLOT_A4 = "A4"
    SLOT_B4 = "B4"
    SLOT_C4 = "C4"
    SLOT_D4 = "D4"

    @classmethod
    def from_primitive(cls, value: str) -> StagingSlotName:
        str_val = value.upper()
        return cls(str_val)

    @property
    def id(self) -> str:
        """This slot's unique ID, as it appears in the deck definition.

        This can be used to look up slot details in the deck definition.

        This is preferred over `.value` or `.__str__()` for explicitness.
        """
        return self.value

    def __str__(self) -> str:
        """Stringify to the unique ID.

        For explicitness, prefer using `.id` instead.
        """
        return self.id
