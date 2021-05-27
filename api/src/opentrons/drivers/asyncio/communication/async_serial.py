from __future__ import annotations

import asyncio
from concurrent.futures.thread import ThreadPoolExecutor
from typing import Optional

from serial import Serial, serial_for_url   # type: ignore


class AsyncSerial:
    """Async wrapper around Serial."""

    @classmethod
    async def create(
            cls, port: str, baud_rate: int, timeout: Optional[int] = None,
            loop: Optional[asyncio.AbstractEventLoop] = None
    ) -> AsyncSerial:
        """
        Create an AsyncSerial instance.

        Args:
            port: url or port name
            baud_rate: the baud rate
            timeout: optional timeout in milliseconds
            loop: optional event loop. if None get_running_loop will be used
        """
        loop = loop or asyncio.get_running_loop()
        executor = ThreadPoolExecutor(max_workers=1)
        serial = await loop.run_in_executor(
            executor=executor,
            func=lambda: serial_for_url(
                url=port, baudrate=baud_rate, timeout=timeout
            )
        )
        return cls(serial=serial, executor=executor, loop=loop)

    def __init__(
            self,
            serial: Serial,
            executor: ThreadPoolExecutor,
            loop: asyncio.AbstractEventLoop
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

    async def read_until(self, match: bytes) -> bytes:
        """
        Read data until match.

        Args:
            match: a sequence of bytes to match

        Returns:
            read data.

        """
        return await self._loop.run_in_executor(
            executor=self._executor,
            func=lambda: self._serial.read_until(match)
        )

    async def write(self, data: bytes) -> None:
        """
        Write data

        Args:
            data: data to write.

        Returns:
            None

        """
        return await self._loop.run_in_executor(
            executor=self._executor,
            func=lambda: self._serial.write(data=data)
        )

    async def open(self) -> None:
        """
        Open the connection.

        Returns: None
        """
        return await self._loop.run_in_executor(
            executor=self._executor,
            func=self._serial.open
        )

    async def close(self) -> None:
        """
        Close the connection

        Returns: None
        """
        return await self._loop.run_in_executor(
            executor=self._executor,
            func=self._serial.close
        )

    async def is_open(self) -> bool:
        """
        Check if connection is open.

        Returns: boolean
        """
        return self._serial.is_open
