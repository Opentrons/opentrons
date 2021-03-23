import asyncio
import logging

from opentrons.hardware_control.emulation.magdeck import MagDeckEmulator
from opentrons.hardware_control.emulation.tempdeck import TempDeckEmulator
from opentrons.hardware_control.emulation.thermocycler import ThermocyclerEmulator
from opentrons.hardware_control.emulation.smoothie import SmoothieEmulator

from .command_processor import CommandProcessor

logger = logging.getLogger(__name__)


SMOOTHIE_PORT = 9996
THERMOCYCLER_PORT = 9997
TEMPDECK_PORT = 9998
MAGDECK_PORT = 9999


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

            words = line.decode().strip().split(' ')
            if words:
                try:
                    response = self._command_processor.handle(words)
                    if response:
                        response = f'{response}\r\n'
                        logger.debug("Sending: %s", response)
                        writer.write(response.encode())
                except (IndexError, StopIteration) as e:
                    logger.exception("exception")
                    writer.write(f'Error: {str(e)}\r\n'.encode())

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
                   handler=ConnectionHandler(MagDeckEmulator())),
        run_server(host=host,
                   port=TEMPDECK_PORT,
                   handler=ConnectionHandler(TempDeckEmulator())),
        run_server(host=host,
                   port=THERMOCYCLER_PORT,
                   handler=ConnectionHandler(ThermocyclerEmulator(),
                                             terminator=b'\r\n')),
        run_server(host=host,
                   port=SMOOTHIE_PORT,
                   handler=ConnectionHandler(SmoothieEmulator())),
    )


if __name__ == "__main__":
    h = logging.StreamHandler()
    h.setLevel(logging.DEBUG)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(h)
    asyncio.run(run())
