from abc import ABC, abstractmethod
from typing import Optional


class CommandProcessor(ABC):
    """Interface of gcode command processor."""

    @abstractmethod
    def handle(self, cmd: str, payload: str) -> Optional[str]:
        """Handle a command and return a response."""
        ...
