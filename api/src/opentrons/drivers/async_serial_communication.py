import asyncio
import logging
from typing import Optional

import async_serial

from .utils import get_ports_by_name, parse_serial_response, SerialNoResponse

log = logging.getLogger(__name__)

RECOVERY_TIMEOUT = 10
DEFAULT_SERIAL_TIMEOUT = 5
DEFAULT_WRITE_TIMEOUT = 30
DEFAULT_BAUDRATE = 115200


class AsyncConnection:
    """
    A serial connection with an api similar to serial_communication
    but with an object variant (since there's more state to hold than
    a single serial.Serial connection) and an async variant
    """
    def __init__(self,
                 device_name: str = None,
                 port: str = None,
                 baudrate: int = None,
                 timeout: int = None) -> None:
        if port:
            self.port = port
        elif device_name:
            self.port = get_ports_by_name(device_name=device_name)[0]
        else:
            raise AssertionError('Either device_name or port is required')

        self.device_name = device_name
        self.baudrate = baudrate or DEFAULT_BAUDRATE
        self._reader: Optional[asyncio.StreamReader] = None
        self._writer: Optional[asyncio.StreamWriter] = None

    async def _connect(self):
        self._reader, self._writer = async_serial.open_serial_connection(
            port=self.port,
            baudrate=self.baudrate)

    @classmethod
    async def build_and_connect(
            cls,
            device_name: str = None,
            port: str = None,
            baudrate: int = DEFAULT_BAUDRATE) -> 'AsyncConnection':
        obj = cls(device_name, port, baudrate)
        await obj._connect()
        return obj

    async def write_and_return(
            self,
            command: str, ack: str,
            timeout: float = DEFAULT_WRITE_TIMEOUT,
            tag: str = None) -> str:
        if not self._writer or not self._reader:
            raise RuntimeError('Not connected')
        if not tag:
            tag = self.port
        encoded = command.encode()
        log.debug(f'{tag}: Write -> {encoded}')
        self._writer.write(encoded)
        await self._writer.drain()
        encoded_ack = ack.encode()
        try:
            resp = await asyncio.wait_for(self._reader.readuntil(encoded_ack),
                                          timeout)
        except asyncio.TimeoutError:
            raise SerialNoResponse(
                f'{tag}: No response from serial port after {timeout}')
        log.debug(f'{tag}: Read -> {resp}')
        clean_response = parse_serial_response(resp.decode(), ack)
        if not clean_response:
            return ''
        return clean_response

    def close(self):
        if self._writer:
            self._writer.close()

    def __del__(self):
        if hasattr(self, '_writer'):
            self.close()
