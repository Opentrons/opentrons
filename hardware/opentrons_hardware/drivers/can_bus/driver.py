"""The can bus transport."""
from __future__ import annotations

import asyncio
import platform
from typing import Optional

from can import Notifier, Bus, AsyncBufferedReader, Message, util

from .arbitration_id import ArbitrationId
from .message import CanMessage

if platform.system() == "Darwin":
    # TODO (amit, 2021-09-29): remove hacks to support `pcan` when we don't
    #  need it anymore.
    #  Super bad monkey patch to deal with MAC issue:
    #  https://github.com/hardbyte/python-can/issues/1117
    from can.interfaces.pcan import basic

    basic.TPCANMsgMac = basic.TPCANMsg
    basic.TPCANTimestampMac = basic.TPCANTimestamp
    from can.interfaces.pcan import pcan

    pcan.TPCANMsgMac = pcan.TPCANMsg
    pcan.TPCANTimestampMac = pcan.TPCANTimestamp
    # end super bad monkey patch


class CanDriver:
    """The can driver."""

    DEFAULT_CAN_NETWORK = "vcan0"
    DEFAULT_CAN_INTERFACE = "socketcan"
    DEFAULT_CAN_BITRATE = 0

    def __init__(
        self,
        bus: Bus,
        loop: asyncio.AbstractEventLoop,
        use_fd: Optional[bool] = True,
    ) -> None:
        """Constructor.

        Args:
            bus: The can bus to communicate with
            loop: Event loop
            use_fd: Use can fd
        """
        self._bus = bus
        self._use_fd = use_fd
        self._loop = loop
        self._reader = AsyncBufferedReader(loop=loop)
        self._notifier = Notifier(bus=self._bus, listeners=[self._reader], loop=loop)

    @classmethod
    async def build(
        cls,
        interface: str,
        channel: Optional[str] = None,
        bit_rate: Optional[int] = None,
        use_fd: Optional[bool] = True,
    ) -> CanDriver:
        """Build a CanDriver.

        Args:
            bit_rate: The bit rate to use.
            interface: The interface for pycan to use.
                see https://python-can.readthedocs.io/en/master/interfaces.html
            channel: Optional channel
            use_fd: Optional use of flexible data rate

        Returns:
            A CanDriver instance.
        """
        # TODO (amit, 2021-09-29): remove hacks to support `pcan` when we don't
        #  need it anymore.
        #  pcan will not initialize when `fd` is True. looks like it's
        #  this issue https://forum.peak-system.com/viewtopic.php?t=5646
        #  Luckily we can still send `fd` messages using `pcan`.
        fd = use_fd if interface != "pcan" else False
        return CanDriver(
            bus=Bus(channel=channel, bitrate=bit_rate, interface=interface, fd=fd),
            loop=asyncio.get_event_loop(),
        )

    @classmethod
    async def from_env(cls) -> CanDriver:
        """Build a CanDriver from env variables."""
        environment_config = util.load_environment_config()
        can_channel: str = environment_config.get("channel", cls.DEFAULT_CAN_NETWORK)
        can_interface: str = environment_config.get(
            "interface", cls.DEFAULT_CAN_INTERFACE
        )
        can_bitrate: int = environment_config.get("bitrate", cls.DEFAULT_CAN_BITRATE)

        return await CanDriver.build(can_interface, can_channel, can_bitrate)

    def shutdown(self) -> None:
        """Stop the driver."""
        self._notifier.stop()

    async def send(self, message: CanMessage) -> None:
        """Send a can message.

        Args:
            message: The message to send.

        Returns:
            None
        """
        m = Message(
            arbitration_id=message.arbitration_id.id,
            is_extended_id=True,
            is_fd=self._use_fd,
            data=message.data,
        )
        await self._loop.run_in_executor(None, self._bus.send, m)

    async def read(self) -> CanMessage:
        """Read a message.

        Returns:
            A can message
        """
        ...
        m: Message = await self._reader.get_message()
        return CanMessage(
            arbitration_id=ArbitrationId(id=m.arbitration_id), data=m.data
        )

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
        return await self.read()
