import asyncio
import contextlib
import errno
import logging
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Optional

from serial.serialutil import (  # type: ignore[import-untyped]
    SerialException as PySerialSerialException,
)

from opentrons_shared_data.errors.exceptions import ModuleCommunicationError

from opentrons.drivers.asyncio.communication.errors import (
    FailedCommand,
    SerialException,
)
from opentrons.hardware_control.modules.errors import AbsorbanceReaderDisconnectedError

log = logging.getLogger(__name__)

_EXPECTED_DISCONNECT_ERRNOS = {errno.EIO, errno.ENODEV, errno.ENXIO}


def _is_expected_disconnect_io_error(exc: BaseException) -> bool:
    """Return whether ``exc`` is a typical unplug / vanished-port I/O error."""
    if isinstance(exc, PySerialSerialException):
        return True
    if isinstance(exc, OSError) and exc.errno in _EXPECTED_DISCONNECT_ERRNOS:
        return True
    try:
        import termios
    except ImportError:
        return False
    return isinstance(exc, termios.error)


class Reader(ABC):
    @abstractmethod
    async def read(self) -> None:
        """Read some data from an external source."""

    def on_error(self, exception: Exception) -> None:
        """Handle an error from calling `read`."""


class Poller:
    """A poller to call a given reader on an interval.

    Args:
        reader: An interface to read data.
        interval: The poll interval, in seconds.
    """

    interval: float

    def __init__(self, reader: Reader, interval: float) -> None:
        self.interval = interval
        self._reader = reader
        self._read_lock: Optional["asyncio.Lock"] = None
        self._poll_waiters: List["asyncio.Future[None]"] = []
        self._poll_forever_task: Optional["asyncio.Task[None]"] = None

    async def start(self) -> None:
        if self._poll_forever_task is None:
            self._poll_forever_task = asyncio.create_task(self._poll_forever())
            await self.wait_next_poll()

    async def stop(self) -> None:
        """Stop polling."""
        task = self._poll_forever_task
        if task is not None:
            async with self._use_read_lock():
                task.cancel()
                await asyncio.gather(task, return_exceptions=True)
            for waiter in self._poll_waiters:
                waiter.cancel(msg="Module was removed")
            self._poll_forever_task = None

    async def wait_next_poll(self) -> None:
        """Wait for the next poll to complete.

        If called in the middle of a read, it will not return until
        the next complete read. If a read raises an exception,
        it will be passed through to `wait_next_poll`.
        """
        if not self._poll_forever_task or self._poll_forever_task.done():
            raise ModuleCommunicationError(message="Module was removed")

        poll_future = asyncio.get_running_loop().create_future()
        self._poll_waiters.append(poll_future)
        await poll_future

    async def wait_next_good_poll(self, retries: int = 4) -> None:
        """Wait for the next good poll to complete.

        If called in the middle of a read, it will not return until
        the next complete read. If a read raises an exception,
        it will retry retries number of time before the exception is
        passed through to `wait_next_good_poll`.
        """
        for r in range(retries):
            try:
                await self.wait_next_poll()
                return
            except BaseException:
                if r < (retries - 1):
                    log.error(f"Got error waiting for next poll {r} or {retries}")
                    await asyncio.sleep(self.interval)
                    pass
                else:
                    raise

    @contextlib.asynccontextmanager
    async def _use_read_lock(self) -> AsyncGenerator[None, None]:
        self._read_lock = self._read_lock or asyncio.Lock()

        async with self._read_lock:
            yield

    async def _poll_forever(self) -> None:
        """Polling loop."""
        while True:
            await self._poll_once()
            await asyncio.sleep(self.interval)

    @staticmethod
    def _set_waiter_complete(
        waiter: "asyncio.Future[None]", e: Optional[Exception] = None
    ) -> None:
        try:
            waiter.set_result(None) if e is None else waiter.set_exception(e)
        except asyncio.InvalidStateError:
            log.warning("Poller waiter was already cancelled")

    def _error_callback(self, exc: Exception) -> None:
        try:
            self._reader.on_error(exc)
        except Exception as callback_error:
            if _is_expected_disconnect_io_error(callback_error):
                log.warning(
                    "Reader cleanup failed after serial disconnect: %s",
                    callback_error,
                )
            else:
                log.exception("Exception in reader callback")

    def _complete_all(
        self, exc: Exception | None, previous: List["asyncio.Future[None]"]
    ) -> None:
        for waiter in previous:
            Poller._set_waiter_complete(waiter, exc)

    async def _poll_once(self) -> None:
        """Trigger a single read, notifying listeners of success or error."""
        previous_waiters = self._poll_waiters
        self._poll_waiters = []

        try:
            async with self._use_read_lock():
                await self._reader.read()
        except asyncio.CancelledError:
            log.exception("poller canceled.")
            raise
        except AbsorbanceReaderDisconnectedError as e:
            self._error_callback(e)
            self._complete_all(e, previous_waiters)
        except FailedCommand as se:
            log.info("Module reported an error during poll: %s", se)
            self._error_callback(se)
            self._complete_all(se, previous_waiters)
        except (SerialException, PySerialSerialException) as se:
            log.warning("Polling failed: %s", se)
            self._error_callback(se)
            self._complete_all(se, previous_waiters)
        except Exception as e:
            log.exception("Polling exception")
            self._error_callback(e)
            self._complete_all(e, previous_waiters)
        else:
            self._complete_all(None, previous_waiters)
