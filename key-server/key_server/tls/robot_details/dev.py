"""Code for getting hostname and IPs on a dev machine.

This uses some workarounds for cross-platform compatibility that likely will not work for actually serving
TLS content outside the computer itself.
"""

import asyncio
import socket
from typing import AsyncGenerator

from .interface import RobotDetails


class RobotDetailsDev(RobotDetails):
    """Get robot details (quote unquote) for a dev machine."""

    def __init__(self) -> None:
        pass

    async def get_details(self) -> tuple[str | None, list[str]]:
        """Get the local hostname and IP (ish).

        This will 99% of the time end up as ('localhost', ['127.0.0.1']).
        """
        return socket.gethostname(), sorted(["127.0.0.1"])

    async def yield_details_on_change(
        self,
    ) -> AsyncGenerator[tuple[str | None, list[str]], None]:
        """Generates new robot details pairs when they change.

        Will almost never emit anything on a dev machine.
        """
        current_hostname, current_addresses = await self.get_details()
        while True:
            await asyncio.sleep(1)
            hostname, addresses = await self.get_details()
            if hostname != current_hostname or addresses != current_addresses:
                yield hostname, addresses
                current_hostname = hostname
                current_addresses = addresses
