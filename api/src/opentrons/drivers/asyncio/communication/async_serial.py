from __future__ import annotations

import asyncio
from concurrent.futures.thread import ThreadPoolExecutor
from typing import Optional

from serial import Serial, serial_for_url   # type: ignore


class AsyncSerial:
    """Async wrapper around Serial."""

    @classmethod
    async def create(
            cls, port: str, baud_rate: int, timeout: Optional[int] = None
    ) -> AsyncSerial:
        """
        Create an AsyncSerial instance.

        Args:
            port: url or port name
            baud_rate: the baud rate
            timeout: optional timeout in milliseconds
        """
        executor = ThreadPoolExecutor(max_workers=1)

        serial = await asyncio.get_event_loop().run_in_executor(
            executor=executor,
            func=lambda: serial_for_url(
                url=port, baudrate=baud_rate, timeout=timeout
            )
        )
        return cls(serial=serial, executor=executor)

    def __init__(self, serial: Serial, executor: ThreadPoolExecutor) -> None:
        """
        Constructor

        Args:
            serial: connected Serial object
            executor: a thread pool executor
        """
        self._serial = serial
        self._executor = executor

    async def read_until(self, match: bytes) -> bytes:
        """
        Read data until match.

        Args:
            match: a sequence of bytes to match

        Returns:
            read data.

        """
        return await asyncio.get_event_loop().run_in_executor(
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
        return await asyncio.get_event_loop().run_in_executor(
            executor=self._executor,
            func=lambda: self._serial.write(data=data)
        )

    async def open(self) -> None:
        """
        Open the connection.

        Returns: None
        """
        return await asyncio.get_event_loop().run_in_executor(
            executor=self._executor,
            func=lambda: self._serial.open()
        )

    async def close(self) -> None:
        """
        Close the connection

        Returns: None
        """
        return await asyncio.get_event_loop().run_in_executor(
            executor=self._executor,
            func=lambda: self._serial.close()
        )

    async def is_open(self) -> bool:
        """
        Check if connection is open.

        Returns: boolean
        """
        return self._serial.is_open
