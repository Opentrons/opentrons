"""Concurrency primitives providers."""

import asyncio


class ConcurrencyProvider:
    """Concurrency primitives for engine tasks."""

    def __init__(self) -> None:
        """Build a concurrency provider."""
        self._locks: dict[str, asyncio.Lock] = {}
        self._queues: dict[str, "asyncio.Queue[asyncio.Task[None]]"] = {}

    def lock_for_group(self, group_id: str) -> asyncio.Lock:
        """Returns the lock for specified group id."""
        try:
            return self._locks[group_id]
        except KeyError:
            self._locks[group_id] = asyncio.Lock()
            return self._locks[group_id]

    def queue_for_group(self, group_id: str) -> "asyncio.Queue[asyncio.Task[None]]":
        """Returns the queue for specified group id."""
        try:
            return self._queues[group_id]
        except KeyError:
            self._queues[group_id] = asyncio.Queue()
            return self._queues[group_id]
