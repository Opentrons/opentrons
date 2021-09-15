"""The can bus transport."""
from __future__ import annotations

import asyncio
import platform

from can import Notifier, Bus, AsyncBufferedReader

from hardware.drivers.can_bus.message import CanMessage

if platform.system() == "Darwin":
    # Super bad monkey patch to deal with MAC issue:
    # https://github.com/hardbyte/python-can/issues/1117
    from can.interfaces.pcan import basic

    basic.TPCANMsgMac = basic.TPCANMsg
    basic.TPCANTimestampMac = basic.TPCANTimestamp
    from can.interfaces.pcan import pcan

    pcan.TPCANMsgMac = pcan.TPCANMsg
    pcan.TPCANTimestampMac = pcan.TPCANTimestamp
    # end super bad monkey patch


class CanDriver:
    """The can driver."""

    def __init__(self, bus: Bus, loop: asyncio.BaseEventLoop) -> None:
        """Constructor.

        Args:
            bus: The can bus to communicate with
            loop: Event loop
        """
        self._bus = bus
        self._loop = loop
        self._reader = AsyncBufferedReader(loop=loop)
        self._notifier = Notifier(bus=self._bus, listeners=[self._reader], loop=loop)

    async def send(self, message: CanMessage) -> None:
        """Send a can message.

        Args:
            message: The message to send.

        Returns:
            None
        """
        await self._loop.run_in_executor(executor=None, func=self._bus.send(message))

    async def read(self) -> CanMessage:
        """Read a message.

        Returns:
            A can message
        """
        ...
        # m = await self._reader.get_message()
        # return m

    def __aiter__(self) -> CanDriver:
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
        ...
        # return await self.read()
