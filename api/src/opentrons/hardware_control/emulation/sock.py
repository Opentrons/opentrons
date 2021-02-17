import asyncio
import re
import logging

from opentrons.hardware_control.emulation.magdeck import MagDeck

from .base import CommandProcessor

logger = logging.getLogger(__name__)


LINE_REGEX = re.compile("(\S+) (.+)")
"""Split the line to command and payload"""


class ConnectionHandler:
    def __init__(self, command_processor: CommandProcessor,
                 terminator: bytes = b'\r\n\r\n',
                 ack: bytes = b'ok\r\rok\r\n'):
        """"""
        self._command_processor = command_processor
        self._terminator = terminator
        self._ack = ack

    async def __call__(self, reader: asyncio.StreamReader,
                       writer: asyncio.StreamWriter) -> None:
        """"""
        logger.info("Connected")
        while True:
            line = await reader.readuntil(self._terminator)
            logger.debug("Received: %s", line)

            m = LINE_REGEX.match(line.decode())
            if m:
                cmd = m.groups()[0]
                payload = m.groups()[1]
                response = self._command_processor.handle(cmd, payload)
                if response:
                    writer.write(f'{response}\r\n'.encode())

            writer.write(self._ack)
            await writer.drain()


async def run():
    HOST, PORT = "127.0.0.1", 9999

    mag_deck = MagDeck()
    server = await asyncio.start_server(ConnectionHandler(mag_deck), HOST, PORT)

    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    h = logging.StreamHandler()
    h.setLevel(logging.DEBUG)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(h)
    asyncio.run(run())
