from __future__ import annotations

import asyncio
import contextlib
from concurrent.futures.thread import ThreadPoolExecutor
from functools import partial
from typing import Optional, Generator

from serial import Serial, serial_for_url  # type: ignore[import]


class AsyncSerial:
    """Async wrapper around Serial."""

    @classmethod
    async def create(
        cls,
        port: str,
        baud_rate: int,
        timeout: Optional[float] = None,
        write_timeout: Optional[float] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        reset_buffer_before_write: bool = False,
    ) -> AsyncSerial:
        """
        Create an AsyncSerial instance.

        Args:
            port: url or port name
            baud_rate: the baud rate
            timeout: optional timeout in seconds
            write_timeout: optional write timeout in seconds
            loop: optional event loop. if None get_running_loop will be used
            reset_buffer_before_write: reset the serial input buffer before
             writing to it
        """
        loop = loop or asyncio.get_running_loop()
        executor = ThreadPoolExecutor(max_workers=1)
        serial = await loop.run_in_executor(
            executor=executor,
            func=partial(
                serial_for_url,
                url=port,
                baudrate=baud_rate,
                timeout=timeout,
                write_timeout=write_timeout,
            ),
        )
        return cls(
            serial=serial,
            executor=executor,
            loop=loop,
            reset_buffer_before_write=reset_buffer_before_write,
        )

    def __init__(
        self,
        serial: Serial,
        executor: ThreadPoolExecutor,
        loop: asyncio.AbstractEventLoop,
        reset_buffer_before_write: bool,
    ) -> None:
        """
        Constructor

        Args:
            serial: connected Serial object
            executor: a thread pool executor
            loop: event loop
        """
        self._serial = serial
        self._executor = executor
        self._loop = loop
        self._reset_buffer_before_write = reset_buffer_before_write

    async def read_until(self, match: bytes, timeout: Optional[float] = None) -> bytes:
        """
        Read data until match.

        Args:
            match: a sequence of bytes to match
            timeout: optional timeout in seconds. this is a temporary override
                of parameter supplied to `create`

        Returns:
            read data.
        """
        with self._timeout_override("timeout", timeout):
            return await self._loop.run_in_executor(
                executor=self._executor,
                func=partial(self._serial.read_until, expected=match),
            )

    async def write(self, data: bytes, timeout: Optional[float] = None) -> None:
        """
        Write data

        Args:
            data: data to write.
            timeout: optional timeout in seconds. this is a temporary override
                of parameter supplied to create

        Returns:
            None
        """
        await self._loop.run_in_executor(
            executor=self._executor,
            func=lambda: self._sync_write(data=data, timeout=timeout),
        )

    def _sync_write(self, data: bytes, timeout: Optional[float] = None) -> None:
        """
        The synchronous write function

        Args:
            data: data to write.
            timeout: optional timeout in seconds.

        Returns:
            None
        """
        with self._timeout_override("write_timeout", timeout):
            if self._reset_buffer_before_write:
                self._serial.reset_input_buffer()
            self._serial.write(data=data)

    async def open(self) -> None:
        """
        Open the connection.

        Returns: None
        """
        return await self._loop.run_in_executor(
            executor=self._executor, func=self._serial.open
        )

    async def close(self) -> None:
        """
        Close the connection

        Returns: None
        """
        return await self._loop.run_in_executor(
            executor=self._executor, func=self._serial.close
        )

    async def is_open(self) -> bool:
        """
        Check if connection is open.

        Returns: boolean
        """
        return self._serial.is_open is True

    @contextlib.contextmanager
    def _timeout_override(
        self, timeout_property: str, timeout: Optional[float]
    ) -> Generator[None, None, None]:
        """Context manager that will temporarily override the default timeout."""
        default_timeout = getattr(self._serial, timeout_property)
        override = timeout is not None and default_timeout != timeout
        try:
            if override:
                setattr(self._serial, timeout_property, timeout)
            yield
        finally:
            if override:
                setattr(self._serial, timeout_property, default_timeout)
