"""Entrypoint for the USB-TCP bridge application."""
import asyncio
from typing import NoReturn
import logging
from . import systemd

LOG = logging.getLogger(__name__)


async def main() -> NoReturn:
    """Entrypoint for system server."""
    LOG.info("Starting system server")
    systemd.notify_up()
    while True:
        await asyncio.sleep(1)


if __name__ == "__main__":
    systemd.configure_logging(level=logging.INFO)
    asyncio.run(main())
