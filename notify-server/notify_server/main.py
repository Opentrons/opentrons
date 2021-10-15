"""The main entry point of the server application."""

import logging
import asyncio
from . import server

from notify_server.logging import initialize_logging
from notify_server.settings import Settings


log = logging.getLogger(__name__)


async def run() -> None:
    """Entry point for the application."""
    settings = Settings()
    initialize_logging(settings.production)
    log.info(settings)
    await server.run(settings)


if __name__ == "__main__":
    asyncio.run(run())
