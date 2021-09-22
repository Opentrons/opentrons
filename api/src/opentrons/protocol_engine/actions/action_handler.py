"""Abstract interfaces for engine plugins."""
from abc import ABC, abstractmethod

from .actions import Action


class ActionHandler(ABC):
    """An abstract interface for an object that reacts to actions."""

    @abstractmethod
    def handle_action(self, action: Action) -> None:
        """React to a state-change action."""
        ...
