from typing import Optional

from .async_serial import AsyncSerial


class SerialException(Exception):
    pass


class NoResponse(SerialException):
    pass


class SerialConnection:

    @classmethod
    async def create(
            cls,
            port: str,
            baud_rate: int,
            timeout: int,
            ack: str,
            name: Optional[str] = None) -> 'SerialConnection':
        """
        Create a connection.

        Args:
            port: url or port to connect to 
            baud_rate: baud rate
            timeout: timeout in seconds
            ack: the command response ack
            name: the connection name

        Returns: SerialConnection
        """
        serial = await AsyncSerial.create(port=port, baud_rate=baud_rate, timeout=timeout)
        name = name or port
        return cls(serial=serial, port=port, name=name, ack=ack)

    def __init__(self, serial: AsyncSerial, port: str, name: str, ack: str) -> None:
        """
        Constructor

        Args:
            serial: AsyncSerial object
        """
        self._serial = serial
        self._port = port
        self._name = name
        self._ack = ack.encode()

    async def send_command(
            self, data: str, retries: int = 0) -> str:
        """
        Send a command and return the response.

        Args:
            data: The data to send.
            retries: number of times to retry in case of failure

        Returns: The command response

        Raises: NoResponse
        """
        await self._serial.write(data=data.encode())
        response = await self._serial.read_until(match=self._ack)
        if self._ack in response:
            return response.decode()

        retries -= 1
        if retries < 0:
            raise NoResponse("retry count exhausted")

        return await self.send_command(data=data, retries=retries)

    @property
    def serial(self) -> AsyncSerial:
        return self._serial

    @property
    def port(self) -> str:
        return self._port

    @property
    def name(self) -> str:
        return self._name
