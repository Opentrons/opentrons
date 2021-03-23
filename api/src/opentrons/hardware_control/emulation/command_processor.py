from abc import ABC, abstractmethod
from typing import Optional, List


class CommandProcessor(ABC):
    """Interface of gcode line processor."""

    @abstractmethod
    def handle(self, words: List[str]) -> Optional[str]:
        """Handle a command and return a response."""
        ...
