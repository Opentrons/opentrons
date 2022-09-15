"""Entrypoint for the USB-TCP bridge application."""
import asyncio
import logging
from typing import NoReturn
import time

LOG = logging.getLogger(__name__)


async def main() -> NoReturn:
    """Entrypoint for USB-TCP bridge."""
    LOG.info("Starting USB-TCP bridge application")

    while True:
        time.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
