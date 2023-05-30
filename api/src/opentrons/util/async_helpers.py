"""
util.async_helpers - various utilities for asyncio functions and tasks.
"""

from functools import wraps
from typing import TypeVar, Callable, Awaitable, cast, Any

import asyncio


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


Wrapped = TypeVar("Wrapped", bound=Callable[..., Awaitable[Any]])


def ensure_yield(async_def_func: Wrapped) -> Wrapped:
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

    return cast(Wrapped, _wrapper)
