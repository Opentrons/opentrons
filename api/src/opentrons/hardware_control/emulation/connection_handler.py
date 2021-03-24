import asyncio
import logging

from opentrons.hardware_control.emulation.abstract_emulator import AbstractEmulator

logger = logging.getLogger(__name__)


class ConnectionHandler:
    def __init__(self, emulator: AbstractEmulator):
        """Construct"""
        self._emulator = emulator

    async def __call__(self, reader: asyncio.StreamReader,
                       writer: asyncio.StreamWriter) -> None:
        """New connection callback."""
        logger.debug("Connected.")
        while True:
            line = await reader.readuntil(self._emulator.get_terminator())
            logger.debug("Received: %s", line)

            words = line.decode().strip().split(' ')
            if words:
                try:
                    response = self._emulator.handle(words)
                    if response:
                        response = f'{response}\r\n'
                        logger.debug("Sending: %s", response)
                        writer.write(response.encode())
                except (IndexError, StopIteration) as e:
                    logger.exception("exception")
                    writer.write(f'Error: {str(e)}\r\n'.encode())

            writer.write(self._emulator.get_ack())
            await writer.drain()
