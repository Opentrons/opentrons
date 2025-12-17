from abc import ABC, abstractmethod
from typing import Optional


class AbstractEmulator(ABC):
    """Interface of gcode line processing hardware emulator."""

    @abstractmethod
    def handle(self, line: str) -> Optional[str]:
        """Handle a command and return a response."""
        ...

    def get_terminator(self) -> bytes:
        """Get the command terminator for messages coming from PI."""
        return b"\r\n\r\n"

    def get_ack(self) -> bytes:
        """Get the command ack send to the PI."""
        return b"ok\r\nok\r\n"

    def get_autoack(self) -> bool:
        """Should this system automatically acknowledge messages?"""
        return True
