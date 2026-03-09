"""The can bus transport."""
from __future__ import annotations
from abc import ABC, abstractmethod
from opentrons_hardware.firmware_bindings import CanMessage


class AbstractCanDriver(ABC):
    """Can driver interface."""

    @abstractmethod
    async def send(self, message: CanMessage) -> None:
        """Send a can message.

        Args:
            message: The message to send.

        Returns:
            None
        """
        ...

    @abstractmethod
    async def read(self) -> CanMessage:
        """Read a message.

        Returns:
            A can message

        Raises:
            ErrorFrameCanError
        """
        ...

    def __aiter__(self) -> AbstractCanDriver:
        """Enter iterator.

        Returns:
            CanDriver
        """
        return self

    async def __anext__(self) -> CanMessage:
        """Async next.

        Returns:
            CanMessage
        """
        return await self.read()

    @abstractmethod
    def shutdown(self) -> None:
        """Stop the driver."""
        ...
