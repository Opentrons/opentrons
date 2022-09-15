"""Entrypoint for the USB-TCP bridge application."""
import asyncio
import logging
from typing import NoReturn
import time
from . import cli

LOG = logging.getLogger(__name__)


async def main() -> NoReturn:
    """Entrypoint for USB-TCP bridge."""
    parser = cli.build_root_parser()
    args = parser.parse_args()

    numeric_level = getattr(logging, args.log_level.upper())
    logging.basicConfig(level=numeric_level)

    LOG.info("Starting USB-TCP bridge")

    while True:
        time.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
