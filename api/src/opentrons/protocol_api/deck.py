"""Deck state accessors for the Protocol API."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterator, List, Mapping, Optional, Tuple, Union

from opentrons_shared_data.deck.dev_types import SlotDefV3
from opentrons.types import DeckLocation, Location, Point

from .core.common import ProtocolCore
from .labware import Labware
from .module_contexts import ModuleContext

DeckItem = Union[Labware, ModuleContext]


@dataclass(frozen=True)
class CalibrationPosition:
    """A calibration point on the deck of the robot.

    Attributes:
        id: Unique identifier for the calibration point.
        position: The absolute x, y, z coordinate of the point.
        displayName: A human-readable nickname for this point.
    """

    id: str
    position: Tuple[float, float, float]
    displayName: str


class AbstractDeck(ABC, Mapping[DeckLocation, DeckItem]):
    """Abstract interface for :py:class:`Deck`."""

    @abstractmethod
    def __getitem__(self, key: DeckLocation) -> DeckItem:
        """Get the item, if any, located in a given slot."""

    @abstractmethod
    def right_of(self, slot: DeckLocation) -> Optional[DeckItem]:
        """Get the item directly to the right of the given slot, if any."""

    @abstractmethod
    def left_of(self, slot: DeckLocation) -> Optional[DeckItem]:
        """Get the item directly to the left of the given slot, if any."""

    @abstractmethod
    def position_for(self, key: DeckLocation) -> Location:
        """Get the absolute location of a deck slot's front-left corner."""

    @abstractmethod
    def get_slot_definition(self, slot_name: DeckLocation) -> SlotDefV3:
        """Get the geometric definition data of a slot."""

    @abstractmethod
    def get_slot_center(self, slot_name: DeckLocation) -> Point:
        """Get the absolute coordinates of a slot's center."""

    @property
    @abstractmethod
    def highest_z(self) -> float:
        """Get the height of the tallest known point on the deck."""

    @property
    @abstractmethod
    def slots(self) -> List[SlotDefV3]:
        """Get a list of all slot definitions."""

    @property
    @abstractmethod
    def calibration_positions(self) -> List[CalibrationPosition]:
        """Get a list of all calibration positions on the deck."""

    @abstractmethod
    def get_non_fixture_slots(self) -> List[str]:
        """Get a list of all slot names that are user-accessible."""


class Deck(AbstractDeck):
    """A dictionary-like object to access Protocol API objects loaded on the deck.

    Accessible via :py:meth:`ProtocolContext.deck`.
    """

    def __init__(self, protocol_core: ProtocolCore) -> None:
        self._protocol_core = protocol_core

    def __getitem__(self, key: DeckLocation) -> DeckItem:
        """Get the item, if any, located in a given slot."""
        raise NotImplementedError("Deck.__getitem__ not implemented")

    def __iter__(self) -> Iterator[DeckLocation]:
        """Iterate through all deck slots."""
        raise NotImplementedError("Deck.__iter__ not implemented")

    def __len__(self) -> int:
        """Get the number of items loaded into the deck."""
        raise NotImplementedError("Deck.__len__ not implemented")

    def right_of(self, slot: DeckLocation) -> Optional[DeckItem]:
        """Get the item directly to the right of the given slot, if any."""
        raise NotImplementedError("Deck.right_of not implemented")

    def left_of(self, slot: DeckLocation) -> Optional[DeckItem]:
        """Get the item directly to the left of the given slot, if any."""
        raise NotImplementedError("Deck.left_of not implemented")

    def position_for(self, key: DeckLocation) -> Location:
        """Get the absolute location of a deck slot's front-left corner."""
        raise NotImplementedError("Deck.position_for not implemented")

    def get_slot_definition(self, slot_name: DeckLocation) -> SlotDefV3:
        """Get the geometric definition data of a slot."""
        raise NotImplementedError("Deck.get_slot_definition not implemented")

    def get_slot_center(self, slot_name: DeckLocation) -> Point:
        """Get the absolute coordinates of a slot's center."""
        raise NotImplementedError("Deck.get_slot_center not implemented")

    @property
    def highest_z(self) -> float:
        """Get the height of the tallest known point on the deck."""
        raise NotImplementedError("Deck.highest_z not implemented")

    @property
    def slots(self) -> List[SlotDefV3]:
        """Get a list of all slot definitions."""
        raise NotImplementedError("Deck.slots not implemented")

    @property
    def calibration_positions(self) -> List[CalibrationPosition]:
        """Get a list of all calibration positions on the deck."""
        raise NotImplementedError("Deck.calibration_positions not implemented")

    def get_non_fixture_slots(self) -> List[str]:
        """Get a list of all slot names that are user-accessible."""
        raise NotImplementedError("Deck.get_non_fixture_slots not implemented")
