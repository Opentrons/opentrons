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
        self._thread_lock = threading.RLock()

    async def __aenter__(self):
        pref = f"[ThreadedAsyncLock tid {threading.get_ident()} "\
            f"task {asyncio.Task.current_task()}] "
        log.debug(pref + 'will acquire')
        then = time.perf_counter()
        while not self._thread_lock.acquire(blocking=False):
            await asyncio.sleep(0.1)
        now = time.perf_counter()
        log.debug(pref + f'acquired in {now-then}s')

    async def __aexit__(self, exc_type, exc, tb):
        log.debug(f"[ThreadedAsyncLock tid {threading.get_ident()} "
                  f"task {asyncio.Task.current_task()}] will release")
        self._thread_lock.release()

    def __enter__(self):
        self._thread_lock.acquire()

    def __exit__(self, exc_type, exc, tb):
        self._thread_lock.release()