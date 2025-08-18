"""Concurrency primitives providers."""
import asyncio


class ConcurrencyProvider:
    """Concurrency primitives for engine tasks."""

    def __init__(self) -> None:
        """Build a concurrency provider."""
        self._locks: dict[str, asyncio.Lock] = {}

    def lock_for_group(self, group_id: str) -> asyncio.Lock:
        """Returns the lock for specified group id."""
        try:
            return self._locks[group_id]
        except KeyError:
            self._locks[group_id] = asyncio.Lock()
            return self._locks[group_id]
