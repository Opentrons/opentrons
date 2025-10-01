"""The handler of a driver client connection."""

import asyncio
import logging

from opentrons.hardware_control.emulation.abstract_emulator import AbstractEmulator

logger = logging.getLogger(__name__)


class ConnectionHandler:
    """Responsible for reading data and routing it to an emulator."""

    def __init__(self, emulator: AbstractEmulator):
        """Construct with an emulator."""
        self._emulator = emulator

    async def __call__(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """New connection callback."""
        emulator_name = self._emulator.__class__.__name__
        logger.debug("%s Connected.", emulator_name)
        while True:
            line = await reader.readuntil(self._emulator.get_terminator())
            logger.debug("%s Received: %s", emulator_name, line)
            try:
                response = self._emulator.handle(line.decode().strip())
                if response:
                    response_bytes = response.encode() + self._emulator.get_terminator()
                    logger.debug(f"{emulator_name} Sending: {response_bytes!r}")
                    writer.write(response_bytes)
            except Exception as e:
                logger.exception("%s exception", emulator_name)
                writer.write(
                    f"Error: {str(e)} ".encode() + self._emulator.get_terminator()
                )

            if self._emulator.get_autoack():
                writer.write(self._emulator.get_ack())
            await writer.drain()
