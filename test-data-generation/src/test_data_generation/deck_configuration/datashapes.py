"""Data shapes for the deck configuration of a Flex."""

import enum
import dataclasses
import typing

ColumnName = typing.Literal["1", "2", "3"]
RowName = typing.Literal["A", "B", "C", "D"]
SlotName = typing.Literal[
    "A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2", "D3"
]


class PossibleSlotContents(enum.Enum):
    """Possible contents of a slot on a Flex."""

    # Implicitly defined fixtures
    THERMOCYCLER_MODULE = enum.auto()
    WASTE_CHUTE = enum.auto()
    WASTE_CHUTE_NO_COVER = enum.auto()
    STAGING_AREA = enum.auto()
    STAGING_AREA_WITH_WASTE_CHUTE = enum.auto()
    STAGING_AREA_WITH_WASTE_CHUTE_NO_COVER = enum.auto()
    STAGING_AREA_WITH_MAGNETIC_BLOCK = enum.auto()

    # Explicitly defined fixtures
    MAGNETIC_BLOCK_MODULE = enum.auto()
    TEMPERATURE_MODULE = enum.auto()
    HEATER_SHAKER_MODULE = enum.auto()
    TRASH_BIN = enum.auto()

    # Other
    LABWARE_SLOT = enum.auto()

    @classmethod
    def longest_string(cls) -> int:
        """Return the longest string representation of the slot content."""
        length = max([len(e.name) for e in PossibleSlotContents])
        return length if length % 2 == 0 else length + 1

    def __str__(self) -> str:
        """Return a string representation of the slot content."""
        return f"{self.name.replace('_', ' ')}"

    def is_a_module(self) -> bool:
        """Return True if the slot contains a module."""
        return self in [
            PossibleSlotContents.THERMOCYCLER_MODULE,
            PossibleSlotContents.MAGNETIC_BLOCK_MODULE,
            PossibleSlotContents.TEMPERATURE_MODULE,
            PossibleSlotContents.HEATER_SHAKER_MODULE,
        ]

    def is_a_staging_area(self) -> bool:
        """Return True if the slot contains a staging area."""
        return self in [
            PossibleSlotContents.STAGING_AREA,
            PossibleSlotContents.STAGING_AREA_WITH_WASTE_CHUTE,
            PossibleSlotContents.STAGING_AREA_WITH_WASTE_CHUTE_NO_COVER,
            PossibleSlotContents.STAGING_AREA_WITH_MAGNETIC_BLOCK,
        ]

    def is_a_waste_chute(self) -> bool:
        """Return True if the slot contains a waste chute."""
        return self in [
            PossibleSlotContents.WASTE_CHUTE,
            PossibleSlotContents.WASTE_CHUTE_NO_COVER,
            PossibleSlotContents.STAGING_AREA_WITH_WASTE_CHUTE,
            PossibleSlotContents.STAGING_AREA_WITH_WASTE_CHUTE_NO_COVER,
        ]


@dataclasses.dataclass
class Slot:
    """A slot on a Flex."""

    row: RowName
    col: ColumnName
    contents: PossibleSlotContents

    def __str__(self) -> str:
        """Return a string representation of the slot."""
        return f"{(self.row + self.col).center(self.contents.longest_string())}{self.contents}"

    @property
    def __label(self) -> SlotName:
        """Return the slot label."""
        return typing.cast(SlotName, f"{self.row}{self.col}")

    @property
    def slot_label_string(self) -> str:
        """Return the slot label."""
        return f"{self.__label.center(self.contents.longest_string())}"

    @property
    def contents_string(self) -> str:
        """Return the slot contents."""
        return f"{str(self.contents).center(self.contents.longest_string())}"

@dataclasses.dataclass
class Row:
    """A row of slots on a Flex."""

    row: RowName

    col1: Slot
    col2: Slot
    col3: Slot

    def __str__(self) -> str:
        """Return a string representation of the row."""
        return f"{self.col1}{self.col2}{self.col3}"

    def col_by_name(self, name: ColumnName) -> Slot:
        """Return the slot by name."""
        return getattr(self, f"col{name}")  # type: ignore

    @property
    def slots(self) -> typing.List[Slot]:
        """Iterate over the slots in the row."""
        return [self.col1, self.col2, self.col3]

    def __len__(self) -> int:
        """Return the number of slots in the row."""
        return len(self.slots)


@dataclasses.dataclass
class DeckConfiguration:
    """The deck on a Flex."""

    a: Row
    b: Row
    c: Row
    d: Row

    def __str__(self) -> str:
        """Return a string representation of the deck."""
        string_list = []
        dashed_line = "-" * (PossibleSlotContents.longest_string() * 3)
        equal_line = "=" * (PossibleSlotContents.longest_string() * 3)
        for row in self.rows:
            string_list.append(
                " | ".join([slot.slot_label_string for slot in row.slots])
            )
            string_list.append(" | ".join([slot.contents_string for slot in row.slots]))
            if row != self.d:
                string_list.append(dashed_line)
        joined_string = "\n".join(string_list)

        return f"\n{joined_string}\n\n{equal_line}"

    def __hash__(self) -> int:
        """Return the hash of the deck."""
        return hash(tuple(slot.contents.value for slot in self.slots))

    def __eq__(self, other: typing.Any) -> bool:
        """Return True if the deck is equal to the other deck."""
        if not isinstance(other, DeckConfiguration):
            return False
        return all(
            slot.contents == other_slot.contents
            for slot in self.slots
            for other_slot in other.slots
        )

    @property
    def rows(self) -> typing.List[Row]:
        """Return the rows of the deck."""
        return [self.a, self.b, self.c, self.d]

    def row_by_name(self, name: RowName) -> Row:
        """Return the row by name."""
        return getattr(self, name.lower())  # type: ignore

    @property
    def slots(self) -> typing.List[Slot]:
        """Return the slots of the deck."""
        return [slot for row in self.rows for slot in row.slots]

    def slot_above(self, slot: Slot) -> typing.Optional[Slot]:
        """Return the slot above the passed slot."""
        row_index = self.rows.index(self.row_by_name(slot.row))
        if row_index == 0:
            return None
        return self.rows[row_index - 1].col_by_name(slot.col)

    def slot_below(self, slot: Slot) -> typing.Optional[Slot]:
        """Return the slot below the passed slot."""
        row_index = self.rows.index(self.row_by_name(slot.row))
        if row_index == 3:
            return None
        return self.rows[row_index + 1].col_by_name(slot.col)
