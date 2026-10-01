"""A simple size-limited memory cache used for large resources.

This was used from Robot version 7.0.0 up until 10.1.0 where it was removed from
the completed analysis store. It was put in to save time getting analyses from the
database since converting the JSON that was stored in the database to pydantic took
significant time and impacted frontend performance. Since that change we have moved
to the frontend grabbing the JSON directly without converting it and using an MQTT
callback system instead of polling, while the memory this was taking up was leading
to performance issues. This is left here now for potential future use or refactoring
to be limited by memory size rather than count.
"""

from collections import deque
from logging import getLogger
from typing import Deque, Dict, Generic, Type, TypeVar

_log = getLogger(__name__)

K = TypeVar("K")
V = TypeVar("V")


class MemoryCache(Generic[K, V]):
    """A cache of some resource V by some key K."""

    _cache: Dict[K, V]
    _cache_order: Deque[K]
    _cache_size: int

    def __init__(self, size_limit: int, _keyhint: Type[K], _valhint: Type[V]) -> None:
        assert size_limit > 0, f"Cache size must be above 0 but was {size_limit}"
        _, _ = _keyhint, _valhint
        self._cache = {}
        self._cache_order = deque()
        self._cache_size = size_limit

    def contains(self, key: K) -> bool:
        """Returns True if the key is cached."""
        return key in self._cache

    def get(self, key: K) -> V:
        """Get a cache element, raising KeyError if it is not cached."""
        return self._cache[key]

    def _pop_eldest(self, key: K) -> None:
        if len(self._cache) < self._cache_size:
            return
        if key in self._cache:
            return

        try:
            eldest = self._cache_order.pop()
        except IndexError:
            _log.error(
                f"cache order queue was empty with {len(self._cache)} elements in cache"
            )
            raise
        try:
            del self._cache[eldest]
        except KeyError:
            _log.error(f"oldest-cached analysis id {eldest} was not present")
            raise

    def insert(self, key: K, value: V) -> None:
        """Insert a cache element by its key.

        If this cache element would make the cache larger than its size limit, the oldest entry
        will be removed.

        If this cache element has the same key as another, the cache will not change and neither will
        the age of the element.
        """
        self._pop_eldest(key)
        self._cache[key] = value
        self._cache_order.appendleft(key)

    def remove(self, key: K) -> None:
        """Remove the cached element specified by the key.

        If no such element exists in cache, then simply no-op.
        """
        try:
            self._cache.pop(key)
            self._cache_order.remove(key)  # O(n) operation, use sparingly
        except KeyError:
            pass
