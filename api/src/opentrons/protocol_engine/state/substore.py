"""Base state store classes."""
from abc import ABC
from typing import Generic, TypeVar
from ..command_models import CompletedCommandType


SubstateT = TypeVar("SubstateT")


class Substore(ABC, Generic[SubstateT]):
    _state: SubstateT

    """Abstract base class for a sub-store."""
    @property
    def state(self) -> SubstateT:
        return self._state

    def handle_completed_command(self, command: CompletedCommandType) -> None:
        pass
