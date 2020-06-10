import asyncio
import logging
import threading
import time


log = logging.getLogger(__name__)


class ThreadedAsyncLock:
    """ A thread-safe async lock

    This is required to properly lock access to motion calls, which are
    a) done in async contexts (rpc methods and http methods) and should
       block as little as possible
    b) done from several different threads (rpc workers and main thread)

    This is a code wart that needs to be removed. It can be removed by
    - making smoothie async so we don't need worker threads anymore
    - removing said threads

    This object can be used as either an asynchronous context manager using
    ``async with`` or a synchronous context manager using ``with``.
    """

    def __init__(self):
        self._thread_lock = threading.Lock()

    def lock(self) -> '_Internal':
        """Create a context manager that locks access to a code block"""
        return _Internal(lock=self._thread_lock, forbid=False)

    def forbid(self) -> '_Internal':
        """Create a context manager that forbids concurrent attempts to
        access to a code block"""
        return _Internal(lock=self._thread_lock, forbid=True)


class ThreadedAsyncForbidden(Exception):
    """Exception indicating that lock is acquired and that blocking
    is forbidden"""

    def __init__(self, msg="Robot is currently moving. Please wait and try "
                           "again this command"):
        super().__init__(msg)


class _Internal:
    def __init__(self, lock: threading.Lock, forbid: bool):
        """
        The private context manager that interacts with the lock. It can
        behave in normal locking mode or in `forbid` mode. When `forbid` is
        True, then trying to acquire a lock that is already acquired will
        raise ThreadedAsyncForbidden. This forbids blocking on
         critical sections.

        :param lock: The Lock
        :param forbid: whether to block or raise an exception
        """
        self._thread_lock = lock
        self._forbid = forbid

    async def __aenter__(self):
        pref = f"[ThreadedAsyncLock tid {threading.get_ident()} "\
            f"task {asyncio.Task.current_task()}] "
        log.debug(pref + 'will acquire')
        then = time.perf_counter()
        while not self._thread_lock.acquire(blocking=False):
            if self._forbid:
                # Lock is already acquired and blocking is forbidden
                raise ThreadedAsyncForbidden()
            await asyncio.sleep(0.1)
        now = time.perf_counter()
        log.debug(pref + f'acquired in {now-then}s')

    async def __aexit__(self, exc_type, exc, tb):
        log.debug(f"[ThreadedAsyncLock tid {threading.get_ident()} "
                  f"task {asyncio.Task.current_task()}] will release")
        self._thread_lock.release()

    def __enter__(self):
        if not self._forbid:
            self._thread_lock.acquire()
        elif not self._thread_lock.acquire(blocking=False):
            # Lock is already acquired and blocking is forbidden
            raise ThreadedAsyncForbidden()

    def __exit__(self, exc_type, exc, tb):
        self._thread_lock.release()
