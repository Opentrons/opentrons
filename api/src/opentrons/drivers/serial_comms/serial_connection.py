from opentrons.drivers.serial_comms.async_serial import AsyncSerial


class SerialExeception(Exception):
    pass


class NoResponse(SerialExeception):
    pass


class SerialConnection:
    def __init__(self, serial: AsyncSerial) -> None:
        """
        Constructor

        Args:
            serial: AsyncSerial object
        """
        self._serial = serial

    async def send_command(self, data: bytes, terminator: bytes):
        """
        Send a command and return the response.

        Args:
            data: The data to send.
            terminator: The command terminator

        Returns: The command response
        """
        await self._serial.write(data=data)
        return await self._serial.read_until(match=terminator)

    async def send_command_with_retries(self, data: bytes, terminator: bytes, retries: int):
        """
        Send a command and return the response.

        Args:
            data: The data to send.
            terminator: The command terminator
            retries: number of times to retry in case of failure

        Returns: The command response
        """
        while retries >= 0:
            result = await self.send_command(data=data, terminator=terminator)
            if terminator in result:
                return result
            else:
                retries -= 1

        raise NoResponse("retry count exhausted")
