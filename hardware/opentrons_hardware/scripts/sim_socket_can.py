"""A driver that emulates CAN over socket."""
from __future__ import annotations

import argparse
import logging
import asyncio
from logging.config import dictConfig
from typing import List


log = logging.getLogger(__name__)


class ConnectionHandler:
    """The class that manages client connections."""

    _writers: List[asyncio.StreamWriter]

    BYTES_TO_READ = 64 + 4 + 4   # Max data size + arbitration id + total size

    def __init__(self) -> None:
        """Constructor."""
        self._writers = []

    async def __call__(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Server accept connection callback."""
        log.info("Handling new connection")

        self._writers.append(writer)

        while True:
            data = await reader.read(self.BYTES_TO_READ)
            if not data:
                log.warning("client disconnected.")
                break

            log.info("Read %d bytes", len(data))

            for w in self._writers:
                if w != writer:
                    w.write(data)

        self._writers.remove(writer)
        writer.close()


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
