"""Abstract state store interfaces."""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from ..actions import Action

StateT = TypeVar("StateT")


class HasState(ABC, Generic[StateT]):
    """Abstract interface for an object that has a state data member."""

    _state: StateT

    @property
    def state(self) -> StateT:
        """State getter."""
        return self._state


class HandlesActions(ABC):
    """Abstract interface for an object that reacts to actions."""

    @abstractmethod
    def handle_action(self, action: Action) -> None:
        """React to a state-change action."""
        ...
