"""Base state store classes."""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from ..commands import Command


SubstateT = TypeVar("SubstateT")


class Substore(ABC, Generic[SubstateT]):
    """Abstract base class for a sub-store."""

    _state: SubstateT

    @property
    def state(self) -> SubstateT:
        """State getter."""
        return self._state


class CommandReactive(ABC):
    """Abstract base class for an interface that reacts to commands."""

    @abstractmethod
    def handle_command(self, command: Command) -> None:
        """React to a Command resource change."""
        ...
