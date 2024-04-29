"""Data shapes for the deck configuration of a Flex."""

import enum
import dataclasses
import typing


class SlotContents(enum.Enum):
    """Possible contents of a slot on a Flex."""

    EMPTY = enum.auto()
    THERMOCYCLER_MODULE = enum.auto()
    MAGNETIC_BLOCK_MODULE = enum.auto()
    TEMPERATURE_MODULE = enum.auto()
    HEATER_SHAKER_MODULE = enum.auto()
    TRASH_BIN = enum.auto()
    WASTE_CHUTE = enum.auto()

    def is_a_module(self) -> bool:
        """Return True if the slot contains a module."""
        return self in [
            SlotContents.THERMOCYCLER_MODULE,
            SlotContents.MAGNETIC_BLOCK_MODULE,
            SlotContents.TEMPERATURE_MODULE,
            SlotContents.HEATER_SHAKER_MODULE,
        ]


@dataclasses.dataclass
class Row:
    """A row of slots on a Flex."""

    col1: SlotContents
    col2: SlotContents
    col3: SlotContents

    @property
    def slots(self) -> typing.Iterator[SlotContents]:
        """Iterate over the slots in the row."""
        slots = [self.col1, self.col2, self.col3]
        return iter(slots)

    def __len__(self) -> int:
        """Return the number of slots in the row."""
        return 3


@dataclasses.dataclass
class DeckConfiguration:
    """The deck on a Flex."""

    a: Row
    b: Row
    c: Row
    d: Row

    @property
    def rows(self) -> typing.List[Row]:
        """Return the rows of the deck."""
        return [self.a, self.b, self.c, self.d]
