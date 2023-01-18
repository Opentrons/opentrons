"""Entrypoint for the USB-TCP bridge application."""
import asyncio
from typing import NoReturn


async def main() -> NoReturn:
    """Entrypoint for system server."""
    while True:
        asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
