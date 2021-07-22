"""Base state store classes."""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from .actions import Action

SubstateT = TypeVar("SubstateT")


class HasState(ABC, Generic[SubstateT]):
    """Abstract base class for a sub-store."""

    _state: SubstateT

    @property
    def state(self) -> SubstateT:
        """State getter."""
        return self._state


class HandlesActions(ABC):
    """Abstract base class for an interface that reacts to actions."""

    @abstractmethod
    def handle_action(self, action: Action) -> None:
        """React to a state-change action."""
        ...
