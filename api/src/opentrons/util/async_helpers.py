"""
util.async_helpers - various utilities for asyncio functions and tasks.
"""

from functools import wraps
from threading import Thread
from typing import (
    Any,
    AsyncContextManager,
    Awaitable,
    Callable,
    Generator,
    Tuple,
    TypeVar,
    cast,
)

import asyncio
import contextlib
import queue


async def asyncio_yield() -> None:
    """
    Ensure that the current task yields to the event loop.

    The python async framework only switches between concurrently-running tasks when
    the currently-running task hits a leaf call that requires waiting for an event on
    the loop. That means that you can have a very long call of nice coroutines with
    async def and await call() that still effectively "block" other concurrent tasks
    from actually executing.

    There's also not really a nice way to yield to the event loop explicitly. The best
    way to do it is to drop in await asyncio.sleep(0), which will yield to the loop and
    let something else run.

    If you have an async call chain that is used in a tight loop and at no point contains
    an await() call that will yield the loop - this will be anything that
    - Involves touching a file descriptor that is registered with an asyncio protocol
    - Involves waiting for a Future
    - Involves waiting for another task
    - Involves specifically invoking an asyncio scheduling operation like gather()
    - Uses asyncio.sleep()

    You should drop an await asyncio_yield() at the most frequent leaf call to make sure
    that other tasks on the loop get a chance to run.
    """
    await asyncio.sleep(0)


_Wrapped = TypeVar("_Wrapped", bound=Callable[..., Awaitable[Any]])


def ensure_yield(async_def_func: _Wrapped) -> _Wrapped:
    """
    A decorator that makes sure that asyncio_yield() is called after the decorated async
    function finishes executing.
    """

    # _wrapper can be typed using ParamSpec https://docs.python.org/3/library/typing.html#typing.ParamSpec
    # when we
    # - bump to a mypy version that supports it (>0.930)
    # - either go to python 3.10 or bump typing_extensions to 4.2.0
    # Until then, this is a mess of opaque type vars and disabling internal checking because of their
    # opacity. The cast on line 58 should keep the external interface of the annotated function correct.
    @wraps(async_def_func)
    async def _wrapper(*args: Any, **kwargs: Any) -> Any:
        ret = await async_def_func(*args, **kwargs)
        await asyncio_yield()
        return ret

    return cast(_Wrapped, _wrapper)


_ContextManagerResult = TypeVar("_ContextManagerResult")


@contextlib.contextmanager
def async_context_manager_in_thread(
    async_context_manager: AsyncContextManager[_ContextManagerResult],
) -> Generator[Tuple[_ContextManagerResult, asyncio.AbstractEventLoop], None, None]:
    """Enter an async context manager in a worker thread.

    When you enter this context manager, it:

    1. Spawns a worker thread.
    2. In that thread, starts an asyncio event loop.
    3. In that event loop, enters the context manager that you passed in.
    4. Returns: the result of entering that context manager, and the running event loop.
       Use functions like `asyncio.run_coroutine_threadsafe()` to safely interact
       with the returned object from your thread.

    When you exit this context manager, it:

    1. In the worker thread's event loop, exits the context manager that you passed in.
    2. Stops and cleans up the worker thread's event loop.
    3. Joins the worker thread.
    """
    with _run_loop_in_thread() as loop_in_thread:
        async_object = asyncio.run_coroutine_threadsafe(
            async_context_manager.__aenter__(),
            loop=loop_in_thread,
        ).result()

        try:
            yield async_object, loop_in_thread

        finally:
            exit = asyncio.run_coroutine_threadsafe(
                async_context_manager.__aexit__(None, None, None),
                loop=loop_in_thread,
            )
            exit.result()


@contextlib.contextmanager
def _run_loop_in_thread() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Run an event loop in a worker thread.

    Entering this context manager spawns a thread, starts an asyncio event loop in it,
    and returns that loop.

    Exiting this context manager stops and cleans up the event loop, and then joins the thread.
    """
    loop_mailbox: "queue.SimpleQueue[asyncio.AbstractEventLoop]" = queue.SimpleQueue()

    def _in_thread() -> None:
        loop = asyncio.new_event_loop()

        # We assume that the lines above this will never fail,
        # so we will always reach this point to unblock the parent thread.
        loop_mailbox.put(loop)

        loop.run_forever()

        # If we've reached here, the loop has been stopped from outside this thread. Clean it up.
        #
        # This cleanup is naive because asyncio makes it difficult and confusing to get it right.
        # Compare this with asyncio.run()'s cleanup, which:
        #
        # * Cancels and awaits any remaining tasks
        #   (according to the source code--this seems undocumented)
        # * Shuts down asynchronous generators
        #   (see asyncio.shutdown_asyncgens())
        # * Shuts down the default thread pool executor
        #   (see https://bugs.python.org/issue34037 and asyncio.shutdown_default_executor())
        #
        # In Python >=3.11, we should rewrite this to use asyncio.Runner,
        # which can take care of these nuances for us.
        loop.close()

    thread = Thread(
        target=_in_thread,
        name=f"{__name__} event loop thread",
        # This is a load-bearing daemon=True. It avoids @atexit-related deadlocks when this is used
        # by opentrons.execute and cleaned up by opentrons.execute's @atexit handler.
        # https://github.com/Opentrons/opentrons/pull/12970#issuecomment-1648243785
        daemon=True,
    )
    thread.start()
    loop_in_thread = loop_mailbox.get()
    try:
        yield loop_in_thread
    finally:
        loop_in_thread.call_soon_threadsafe(loop_in_thread.stop)
        thread.join()
