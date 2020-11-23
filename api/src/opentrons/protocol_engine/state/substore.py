"""Base state store classes."""
from abc import ABC
from typing import Generic, TypeVar

from ..commands import CompletedCommandType


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

    def handle_completed_command(self, command: CompletedCommandType) -> None:
        """React to a CompletedCommand."""
        pass
