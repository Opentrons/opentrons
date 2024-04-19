"""Test data generation for deck configuration tests."""

import enum
import dataclasses
import typing
from hypothesis import strategies as st


def row_has_staging_area(row: "Row") -> typing.TypeGuard["RowWithStagingArea"]:
    """Return True if the row has a staging area."""
    return row.col4 is not None


def row_has_no_staging_area(row: "Row") -> typing.TypeGuard["RowWithoutStagingArea"]:
    """Return True if the row has no staging area."""
    return row.col4 is None


class SlotContents(enum.Enum):
    """Possible contents of a slot on a Flex."""

    EMPTY = enum.auto()
    THERMOCYCLER_MODULE = enum.auto()
    MAGNETIC_BLOCK_MODULE = enum.auto()
    TEMPERATURE_MODULE = enum.auto()
    HEATER_SHAKER_MODULE = enum.auto()
    TRASH_BIN = enum.auto()
    WASTE_CHUTE = enum.auto()
    LABWARE = enum.auto()

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

    def __iter__(self) -> typing.Iterator[SlotContents]:
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



@st.composite
def a_slot(draw: st.DrawFn) -> SlotContents:
    """Generate a slot with a random content."""
    return draw(st.sampled_from(SlotContents))  # type: ignore


@st.composite
def a_row(draw: st.DrawFn) -> Row:
    """Generate a row with random slots."""
    return draw(
        st.builds(
            Row,
            col1=a_slot(),
            col2=a_slot(),
            col3=a_slot(),
            col4=st.one_of(st.just(None), a_slot()),
        )
    )


@st.composite
def a_deck_configuration(draw: st.DrawFn) -> DeckConfiguration:
    """Generate a deck with random rows."""
    return draw(
        st.builds(
            DeckConfiguration,
            A=a_row(),
            B=a_row(),
            C=a_row(),
            D=a_row(),
        )
    )
