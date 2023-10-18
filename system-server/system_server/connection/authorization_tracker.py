"""Tracks active connections to the server."""

import logging

from datetime import datetime
from typing import List
from dataclasses import dataclass

from system_server.jwt import Registrant


log = logging.getLogger(__name__)

@dataclass
class _Authorization:
    """Simple wrapper of data to hold in auth tracker."""

    registrant: Registrant
    expiration: datetime


class AuthorizationTracker:
    """Class to track active authorizations on the server."""

    def __init__(self) -> None:
        self._connections: List[_Authorization] = []

    def add_connection(self, registrant: Registrant, expiration: datetime) -> None:
        """Add a new connection, or refresh an existing one.

        If this registrant isn't already connected, it will be added to the authorization
        tracker. If the registrant already exists, it will be updated with the new expiration.

        Args:
            registrant: Information about the registrant for this connection

            expiration: When this registrant is considered expired.
        """
        # If this registrant already exists, remove it
        self._connections = [c for c in self._connections if c.registrant != registrant]
        # We now know there's no other copy, so add this to the end of the list
        self._connections.append(
            _Authorization(registrant=registrant, expiration=expiration)
        )

    def _update_active_connections(self) -> None:
        """Clear out any expired connections."""
        now = datetime.now()
        self._connections = [c for c in self._connections if c.expiration > now]

    def active_connections(self) -> int:
        l
        """Get the current number of active connections."""
        self._update_active_connections()
        log.debug(f"active connections: {len(self._connections)}")
        return len(self._connections)

    def get_connected(self) -> List[Registrant]:
        """Get a list of all of the current active connections."""
        self._update_active_connections()
        return [n.registrant for n in self._connections]
