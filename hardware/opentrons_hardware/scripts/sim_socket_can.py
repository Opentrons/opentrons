"""A driver that emulates CAN over socket."""
from __future__ import annotations

import argparse
import logging
import asyncio
from logging.config import dictConfig
from typing import List

from opentrons_shared_data.errors.exceptions import CANBusBusError
from opentrons_hardware.drivers.can_bus.socket_driver import SocketDriver

log = logging.getLogger(__name__)


class ConnectionHandler:
    """The class that manages client connections."""

    _connections: List[SocketDriver]

    def __init__(self) -> None:
        """Constructor."""
        self._connections = []

    async def __call__(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Server accept connection callback."""
        log.info("Handling new connection")

        driver = SocketDriver(reader, writer)

        self._connections.append(driver)

        while not reader.at_eof():
            try:
                data = await driver.read()
            except CANBusBusError as e:
                log.error(f"Read error: {e}.")
                break

            log.info(f"Read message: {data}")

            for d in self._connections:
                # Send to everyone else.
                if d != driver:
                    await d.send(data)

        self._connections.remove(driver)
        driver.shutdown()


async def run(port: int) -> None:
    """Run the application."""
    log.info("Starting simulated CAN bus on port %d", port)
    connection_handler = ConnectionHandler()
    server = await asyncio.start_server(connection_handler, port=port)
    await server.serve_forever()


LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "stream_handler": {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": logging.DEBUG,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.DEBUG,
        },
    },
}


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="Sim CAN over socket.")

    parser.add_argument(
        "--port",
        type=int,
        default=9898,
        required=False,
        help="port to listen on",
    )

    args = parser.parse_args()

    asyncio.run(run(args.port))


if __name__ == "__main__":
    main()
