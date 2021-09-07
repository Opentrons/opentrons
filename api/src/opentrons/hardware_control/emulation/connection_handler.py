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
                    response = f"{response}\r\n"
                    logger.debug("%s Sending: %s", emulator_name, response)
                    writer.write(response.encode())
            except Exception as e:
                logger.exception("%s exception", emulator_name)
                writer.write(f"Error: {str(e)}\r\n".encode())

            writer.write(self._emulator.get_ack())
            await writer.drain()
