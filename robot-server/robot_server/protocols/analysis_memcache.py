"""A simple size-limited memory cache used for large resources."""
import asyncio
from typing import Awaitable, Callable, Coroutine, Generic, TypeVar, Deque, Type, Dict
from logging import getLogger

from collections import deque

_log = getLogger(__name__)

K = TypeVar("K")
V = TypeVar("V")


class MemoryCache(Generic[K, V]):
    """A cache of some resource V by some key K."""

    _cache: Dict[K, V]
    _cache_order: Deque[K]
    _cache_size: int

    _open_compute_tasks: Dict[K, "asyncio.Task[V]"]
    _compute_concurrency_limiter: asyncio.Semaphore

    def __init__(self, size_limit: int, _keyhint: Type[K], _valhint: Type[V]) -> None:
        assert size_limit > 0, f"Cache size must be above 0 but was {size_limit}"
        _, _ = _keyhint, _valhint
        self._cache = {}
        self._cache_order = deque()
        self._cache_size = size_limit
        self._open_compute_tasks = {}
        self._compute_concurrency_limiter = asyncio.Semaphore(1)

    def contains(self, key: K) -> bool:
        """Returns True if the key is cached."""
        return key in self._cache

    def get(self, key: K) -> V:
        """Get a cache element, raising KeyError if it is not cached."""
        return self._cache[key]

    async def get_or_compute(self, key: K, compute: Callable[[], Awaitable[V]]) -> V:
        if self.contains(key):
            return self.get(key)

        elif key in self._open_compute_tasks:
            return await self._open_compute_tasks[key]

        else:

            async def limited_compute() -> V:
                async with self._compute_concurrency_limiter:
                    return await compute()

            compute_task: "asyncio.Task[V]" = asyncio.create_task(limited_compute())  # type: ignore[arg-type]
            self._open_compute_tasks[key] = compute_task

            try:
                result = await compute_task
                self.insert(key=key, value=result)
                return result
            finally:  # Clean up compute_task even if it raises.
                del self._open_compute_tasks[key]

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
