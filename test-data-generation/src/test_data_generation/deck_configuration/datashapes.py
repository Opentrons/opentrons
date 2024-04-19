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
    LABWARE = enum.auto()  # This will need to be here for generating protocols

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
    col4: typing.Optional[SlotContents]  # An optional staging area slot

    @property
    def slots(self) -> typing.Iterator[SlotContents]:
        """Iterate over the slots in the row."""
        slots = [self.col1, self.col2, self.col3]
        if self.col4 is not None:
            slots.append(self.col4)
        return iter(slots)

    def __len__(self) -> int:
        """Return the number of slots in the row."""
        return 3 if self.col4 is None else 4


class RowWithStagingArea(typing.Protocol):
    """A row of slots on a Flex with a staging area."""

    col1: SlotContents
    col2: SlotContents
    col3: SlotContents
    col4: SlotContents


class RowWithoutStagingArea(typing.Protocol):
    """A row of slots on a Flex without a staging area."""

    col1: SlotContents
    col2: SlotContents
    col3: SlotContents
    col4: None


@dataclasses.dataclass
class DeckConfiguration:
    """The deck on a Flex."""

    A: Row
    B: Row
    C: Row
    D: Row

    @property
    def rows(self) -> typing.List[Row]:
        """Return the rows of the deck."""
        return [self.A, self.B, self.C, self.D]
