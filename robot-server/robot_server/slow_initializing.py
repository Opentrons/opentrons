"""Utilities for working with objects that initialize slowly in the background.

These are intended for dependencies (in the FastAPI sense of the word) that we start
initializing when our process starts, but that we don't wait for to be fully ready
before we start responding to requests.

For more general purposes, a plain ``asyncio.Future`` might be more appropriate.
"""


import asyncio
import logging
import typing


_T = typing.TypeVar("_T")


class SlowInitializing(typing.Generic[_T]):
    """A handle for an object that's currently initializing in the background.

    ``_T`` is the type of the fully-initialized result.
    """

    def __init__(self, _task: asyncio.Task) -> None:
        """Do not call directly. Use `start_initializing` instead."""
        self._task = _task

    async def get_when_ready(self) -> _T:
        """Wait for the object to be done initializing, and then return it.

        Raises:
            InitializationFailedError: If an exception was raised when trying to
                initialize the object.
        """
        try:
            return await self._task
        except Exception as exception:
            # Deliberately not interfering with BaseExceptions because asyncio seems to
            # treat them specially? For example, a KeyboardInterrupt bubbling up from
            # any task seems to prompt the event loop to cancel all current tasks,
            # in Python 3.7. Seems undocumented.
            raise InitializationFailedError() from exception

    def get_if_ready(self) -> _T:
        """Return the initialized object, or raise if it's not done initializing.

        Raises:
            InitializationOngoingError: If the object hasn't finished initializing
                and isn't ready to return yet.
            InitializationFailedError: If an exception was raised when trying to
                initialize the object.
        """
        try:
            return self._task.result()
        except asyncio.InvalidStateError:
            # `from None` is important: without it, this new exception would be
            # interpreted as an unexpected failure while handling the InvalidStateError.
            # This affects what's printed in stack traces.
            raise InitializationOngoingError() from None
        except Exception as exception:
            # See comment in get_when_ready() about why we don't catch BaseException.
            raise InitializationFailedError() from exception


def log(exception: BaseException) -> None:
    """A default ``exception_logger`` implementation."""
    logging.error("Exception when initializing SlowInitializing.", exc_info=exception)


def start_initializing(
    factory: typing.Callable[[], typing.Awaitable[_T]],
    exception_logger: typing.Callable[[BaseException], None] = log,
) -> SlowInitializing[_T]:
    """Start initializing an object in the background.

    Params:
        factory: A coroutine that will be called to create the object. It will be run in
            a background async task.

            It must eventually either:

            * Succeed, by returning a fully-initialized, ready-to-use object.
            * Report failure, by raising an exception.

        exception_logger: If the background async task raises an exception, this
            callable is called with that exception object soon after.

            This ensures that exceptions are always logged, even if:

            * Nothing ``await``s `SlowInitializing.get_if_ready` or
              `SlowInitializing.get_when_ready`, so the exception doesn't propagate.
            * The system is powered down ungracefully, so Python never gets a chance to
              log warnings for exceptions from asyncio tasks that were never retrieved.

            The exact timing of the call depends on asyncio internals and should not be
            relied upon for program correctness.

    Returns:
        A `SlowInitializing`, through which you can access the eventual result.
    """

    def done_callback(future: asyncio.Future) -> None:
        exception = future.exception()
        if exception is not None:
            exception_logger(exception)

    task = asyncio.create_task(factory())
    task.add_done_callback(done_callback)
    return SlowInitializing[_T](_task=task)


class InitializationFailedError(Exception):
    """See `SlowInitializing.get_when_ready` and `SlowInitializing.get_if_ready`.

    The ``__cause__`` attribute is the underlying exception, as raised from the
    `factory` coroutine.
    """


class InitializationOngoingError(Exception):
    """See `SlowInitializing.get_if_ready`."""
