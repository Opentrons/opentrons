"""The can bus transport."""
from __future__ import annotations
import logging
import asyncio
import platform
from typing import Optional, Union, Dict, Any
import concurrent.futures

from opentrons_shared_data.errors.exceptions import CANBusBusError
from can import Notifier, Bus, AsyncBufferedReader, Message

from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.message import CanMessage
from .abstract_driver import AbstractCanDriver
from .settings import calculate_fdcan_parameters, PCANParameters

log = logging.getLogger(__name__)


if platform.system() == "Darwin":
    # TODO (amit, 2021-09-29): remove hacks to support `pcan` when we don't
    #  need it anymore.
    #  Super bad monkey patch to deal with MAC issue:
    #  https://github.com/hardbyte/python-can/issues/1117
    from can.interfaces.pcan import basic

    basic.TPCANMsgMac = basic.TPCANMsg
    basic.TPCANMsgFDMac = basic.TPCANMsgFD
    basic.TPCANTimestampMac = basic.TPCANTimestamp

    from can.interfaces.pcan import pcan

    pcan.TPCANMsgMac = pcan.TPCANMsg
    pcan.TPCANMsgFDMac = pcan.TPCANMsgFD
    pcan.TPCANTimestampMac = pcan.TPCANTimestamp
    # end super bad monkey patch


class CanDriver(AbstractCanDriver):
    """The can driver."""

    def __init__(self, bus: Bus, loop: asyncio.AbstractEventLoop) -> None:
        """Constructor.

        Args:
            bus: The can bus to communicate with
            loop: Event loop
        """
        self._bus = bus
        self._loop = loop
        self._reader = AsyncBufferedReader(loop=loop)
        self._notifier = Notifier(bus=self._bus, listeners=[self._reader], loop=loop)
        self._executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)

    @classmethod
    async def build(
        cls,
        interface: str,
        channel: Optional[str] = None,
        bitrate: Optional[int] = None,
        fcan_clock: Optional[int] = None,
        sample_rate: Optional[float] = None,
        jump_width: Optional[int] = None,
    ) -> CanDriver:
        """Build a CanDriver.

        Args:
            bitrate: The bitrate to use.
            interface: The interface for pycan to use.
                see https://python-can.readthedocs.io/en/master/interfaces.html
            channel: Optional channel
            fcan_clock: The clock used by the can analyzer, defaults to 20MHz
            sample_rate: The sample rate in which to sample the data, defaults to 87.5
            jump_width: The max time the sampling period can be lengthened or shortened

        Returns:
            A CanDriver instance.
        """
        log.info(f"CAN connect: {interface}-{channel}-{bitrate}")
        extra_kwargs: Union[PCANParameters, Dict[Any, Any]] = {}
        if interface == "pcan":
            # Special FDCAN parameters for use of PCAN driver.
            extra_kwargs = calculate_fdcan_parameters(
                fcan_clock, bitrate, sample_rate, jump_width
            )

        return CanDriver(
            bus=Bus(
                channel=channel,
                bitrate=bitrate,
                interface=interface,
                fd=True,
                **extra_kwargs,
            ),
            loop=asyncio.get_event_loop(),
        )

    def shutdown(self) -> None:
        """Stop the driver."""
        self._notifier.stop()
        self._bus.shutdown()

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
            is_fd=True,
            data=message.data,
        )
        await self._loop.run_in_executor(self._executor, self._bus.send, m)

    async def read(self) -> CanMessage:
        """Read a message.

        Returns:
            A can message

        Raises:
            CANBusBusError
        """
        m: Message = await self._reader.get_message()
        if m.is_error_frame:
            log.error("Error frame encountered")
            raise CANBusBusError(
                message="Error frame encountered", detail={"frame": repr(m)}
            )

        return CanMessage(
            arbitration_id=ArbitrationId(id=m.arbitration_id), data=m.data
        )
