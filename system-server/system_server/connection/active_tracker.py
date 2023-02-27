"""Tracks active connections to the server."""
from datetime import datetime
from typing import List
from dataclasses import dataclass
from asyncio import Lock

from system_server.jwt import Registrant


@dataclass
class _Authorization:
    registrant: Registrant
    expiration: datetime


class AuthorizationTracker:
    """Class to track active authorizations on the server."""

    def __init__(self) -> None:
        self._connections: List[_Authorization] = []
        self._lock = Lock()

    async def add_connection(
        self, registrant: Registrant, expiration: datetime
    ) -> None:
        """Add a new connection, or refresh an existing one.

        If this registrant isn't already connected, it will be added to the authorization
        tracker. If the registrant already exists, it will be updated with the new expiration.

        Args:
            registrant: Information about the registrant for this connection

            expiration: When this registrant is considered expired.
        """
        # If this registrant already exists, remove it
        async with self._lock:
            for c in self._connections:
                if c.registrant == registrant:
                    self._connections.remove(c)

            self._connections.append(
                _Authorization(registrant=registrant, expiration=expiration)
            )

    async def _update_active_connections(self) -> None:
        """Clear out any expired connections."""
        async with self._lock:
            now = datetime.now()
            for c in self._connections:
                if c.expiration < now:
                    self._connections.remove(c)

    async def active_connections(self) -> int:
        """Get the current number of active connections."""
        await self._update_active_connections()
        return len(self._connections)

    async def get_connected(self) -> List[Registrant]:
        """Get a list of all of the current active connections."""
        await self._update_active_connections()
        async with self._lock:
            return [n.registrant for n in self._connections]
