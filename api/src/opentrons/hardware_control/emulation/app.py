import asyncio
import re
import logging

from opentrons.hardware_control.emulation.magdeck import MagDeck
from opentrons.hardware_control.emulation.tempdeck import TempDeck
from opentrons.hardware_control.emulation.thermocycler import Thermocycler

from .base import CommandProcessor

logger = logging.getLogger(__name__)


THERMOCYCLER_PORT = 9997
TEMPDECK_PORT = 9998
MAGDECK_PORT = 9999


LINE_REGEX = re.compile("(\S+) (.+)")
"""Split the line to command and payload"""


class ConnectionHandler:
    def __init__(self, command_processor: CommandProcessor,
                 terminator: bytes = b'\r\n\r\n',
                 ack: bytes = b'ok\r\nok\r\n'):
        """Construct"""
        self._command_processor = command_processor
        self._terminator = terminator
        self._ack = ack

    async def __call__(self, reader: asyncio.StreamReader,
                       writer: asyncio.StreamWriter) -> None:
        """New connection callback."""
        logger.debug("Connected.")
        while True:
            line = await reader.readuntil(self._terminator)
            logger.debug("Received: %s", line)

            m = LINE_REGEX.match(line.decode())
            if m:
                groups = m.groups()
                cmd = groups[0]
                payload = groups[1]
                logger.debug("Command: %s, Payload: %s", cmd, payload)
                response = self._command_processor.handle(cmd, payload)
                if response:
                    response = f'{response}\r\n'
                    logger.debug("Sending: %s", response)
                    writer.write(response.encode())

            writer.write(self._ack)
            await writer.drain()


async def run_server(host: str, port: int, handler: ConnectionHandler) -> None:
    """Run a server."""
    server = await asyncio.start_server(handler, host, port)

    async with server:
        await server.serve_forever()


async def run() -> None:
    """Run the module emulators."""
    host = "127.0.0.1"

    await asyncio.gather(
        run_server(host=host,
                   port=MAGDECK_PORT,
                   handler=ConnectionHandler(MagDeck())),
        run_server(host=host,
                   port=TEMPDECK_PORT,
                   handler=ConnectionHandler(TempDeck())),
        run_server(host=host,
                   port=THERMOCYCLER_PORT,
                   handler=ConnectionHandler(Thermocycler(),
                                             terminator=b'\r\n')),
    )


if __name__ == "__main__":
    h = logging.StreamHandler()
    h.setLevel(logging.DEBUG)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(h)
    asyncio.run(run())
