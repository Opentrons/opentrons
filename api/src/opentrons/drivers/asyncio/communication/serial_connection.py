from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator, Literal, Type

from .async_serial import AsyncSerial
from .errors import (
    AlarmResponse,
    BaseErrorCode,
    DefaultErrorCodes,
    ErrorResponse,
    GCodeCacheFull,
    NoResponse,
    UnhandledGcode,
)
from opentrons.drivers.command_builder import CommandBuilder

log = logging.getLogger(__name__)


class SerialConnection:
    @classmethod
    async def _build_serial(
        cls,
        port: str,
        baud_rate: int,
        timeout: float,
        loop: asyncio.AbstractEventLoop | None,
        reset_buffer_before_write: bool,
    ) -> AsyncSerial:
        return await AsyncSerial.create(
            port=port,
            baud_rate=baud_rate,
            timeout=timeout,
            loop=loop,
            reset_buffer_before_write=reset_buffer_before_write,
        )

    @classmethod
    async def create(
        cls,
        port: str,
        baud_rate: int,
        timeout: float,
        ack: str,
        name: str | None = None,
        retry_wait_time_seconds: float = 0.1,
        loop: asyncio.AbstractEventLoop | None = None,
        error_keyword: str | None = None,
        alarm_keyword: str | None = None,
        reset_buffer_before_write: bool = False,
        error_codes: Type[BaseErrorCode] = DefaultErrorCodes,
    ) -> "SerialConnection":
        """
        Create a connection.

        Args:
            port: url or port to connect to
            baud_rate: baud rate
            timeout: timeout in seconds
            ack: the command response ack
            name: the connection name
            retry_wait_time_seconds: how long to wait between retries.
            loop: optional event loop.
            error_keyword: optional string that will cause an
                           ErrorResponse exception when detected
                           (default: error)
            alarm_keyword: optional string that will cause an
                           AlarmResponse exception when detected
                           (default: alarm)
            reset_buffer_before_write: whether to reset the read buffer before
              every write
            error_codes: Enum class for error codes
                         (default: DefaultErrorCodes)

        Returns: SerialConnection
        """
        serial = await cls._build_serial(
            port=port,
            baud_rate=baud_rate,
            timeout=timeout,
            loop=loop,
            reset_buffer_before_write=reset_buffer_before_write,
        )
        name = name or port
        obj = cls(
            serial=serial,
            port=port,
            name=name,
            ack=ack,
            retry_wait_time_seconds=retry_wait_time_seconds,
            error_keyword=error_keyword or "error",
            alarm_keyword=alarm_keyword or "alarm",
            error_codes=error_codes,
        )
        await obj.flush_input()
        return obj

    def __init__(
        self,
        serial: AsyncSerial,
        port: str,
        name: str,
        ack: str,
        retry_wait_time_seconds: float,
        error_keyword: str,
        alarm_keyword: str,
        error_codes: Type[BaseErrorCode] = DefaultErrorCodes,
    ) -> None:
        """
        Constructor

        Args:
            serial: AsyncSerial object
            port: url or port to connect to
            ack: the command response ack
            name: the connection name
            retry_wait_time_seconds: how long to wait between retries.
            error_keyword: string that will cause an ErrorResponse
                           exception when detected
            alarm_keyword: string that will cause an AlarmResponse
                           exception when detected
            error_codes: Enum class for error codes
        """
        self._serial = serial
        self._port = port
        self._name = name
        self._ack = ack.encode()
        self._retry_wait_time_seconds = retry_wait_time_seconds
        self._send_data_lock = asyncio.Lock()
        self._error_keyword = error_keyword.lower()
        self._alarm_keyword = alarm_keyword.lower()
        self._error_codes = error_codes

    async def send_command(
        self, command: CommandBuilder, retries: int = 0, timeout: float | None = None
    ) -> str:
        """
        Send a command and return the response.

        Args:
            command: A command builder.
            retries: number of times to retry in case of timeout
            timeout: optional override of default timeout in seconds

        Returns: The command response

        Raises: SerialException
        """
        return await self.send_data(
            data=command.build(), retries=retries, timeout=timeout
        )

    async def send_dfu_command(self, command: CommandBuilder) -> None:
        """
        Send a dfu command to enter device bootloader.

        This method doesn't wait for a response after sending the command since the
        module port gets disconnected once it enters its bootloader.
        """
        encoded_command = command.build().encode()

        async with self._send_data_lock:
            log.debug(f"{self.name}: Write -> {encoded_command!r}")
            await self._serial.write(data=encoded_command)

    async def send_data(
        self, data: str, retries: int = 0, timeout: float | None = None
    ) -> str:
        """
        Send data and return the response.

        Args:
            data: The data to send.
            retries: number of times to retry in case of timeout
            timeout: optional override of default timeout in seconds

        Returns: The command response

        Raises: SerialException
        """
        async with (
            self._send_data_lock,
            self._serial.timeout_override("timeout", timeout),
        ):
            return await self._send_data(data=data, retries=retries)

    async def _send_data(self, data: str, retries: int) -> str:
        """
        Send data and return the response.

        Args:
            data: The data to send.
            retries: number of times to retry in case of timeout

        Returns: The command response

        Raises: SerialException
        """
        data_encode = data.encode()

        for retry in range(retries + 1):
            log.debug(f"{self.name}: Write -> {data_encode!r}")
            await self._serial.write(data=data_encode)

            response = await self._serial.read_until(match=self._ack)
            log.debug(f"{self.name}: Read <- {response!r}")

            if (
                self._ack in response
                or self._error_keyword.encode() in response.lower()
            ):
                # Remove ack from response
                response = response.replace(self._ack, b"")
                str_response = self.process_raw_response(
                    command=data, response=response.decode()
                )
                self.raise_on_error(response=str_response, request=data)
                return str_response

            log.info(f"{self.name}: retry number {retry}/{retries}")

            await self.on_retry()

        raise NoResponse(port=self._port, command=data)

    async def open(self) -> None:
        """Open the connection."""
        await self._serial.open()

    async def close(self) -> None:
        """Close the connection."""
        await self._serial.close()

    async def is_open(self) -> bool:
        """Check if connection is open."""
        return await self._serial.is_open()

    @property
    def port(self) -> str:
        return self._port

    @property
    def name(self) -> str:
        return self._name

    @property
    def send_data_lock(self) -> asyncio.Lock:
        return self._send_data_lock

    def raise_on_error(self, response: str, request: str) -> None:
        """
        Raise an error if the response contains an error

        Args:
            response: response
            request: the requesting command

        Returns: None

        Raises: SerialException
        """
        if not response or not request:
            return

        lower = response.lower()
        try:
            res_gcode = response.split()[0]
            req_gcode = request.split()[0]
        except IndexError:
            # this means the response is an empty string or something, which is weird
            # but not a canonical error
            return

        # Make sure this is not just a normal response that happens to contain the
        # `err` or `alarm` keyword in the message body by checking the gcode values
        # for both the request and response. If the gcodes are the same then this
        # is not an error response.
        if res_gcode == req_gcode:
            return

        if self._alarm_keyword in lower:
            raise AlarmResponse(port=self._port, response=response)

        if self._error_keyword.lower() in lower:
            # Check for specific error codes
            error_codes_dict = self._error_codes.get_error_codes()
            for code, error_code in error_codes_dict.items():
                if code in lower:
                    error_code.raise_exception(
                        port=self._port, response=response, command=request
                    )

            # If no specific error code was found, raise a generic ErrorResponse
            raise ErrorResponse(port=self._port, response=response)

    async def on_retry(self) -> None:
        """
        Opportunity for derived classes to perform action between retries. Default
        behaviour is to wait then re-open the connection.

        Returns: None
        """
        await asyncio.sleep(self._retry_wait_time_seconds)
        await self._serial.close()
        await self._serial.open()

    def process_raw_response(self, command: str, response: str) -> str:
        """
        Opportunity for derived classes to process the raw response. Default
         strips white space.

        Args:
            command: The sent command.
            response: The raw read response minus ack.

        Returns:
            processed response.
        """
        return response.strip()

    async def flush_input(self) -> None:
        """Empty the input buffer.

        This is a pretty gross utility that may take a while and is intended to consume
        blocks of text printed by the other side, for instance on boot.
        """
        self._serial.reset_input_buffer()
        log.info("flushing input")
        consecutive_empties = 0
        async with self._serial.timeout_override("timeout", 0.1):
            while True:
                try:
                    inp = await self._serial.read_until(b"\r\n")
                    log.info(f"flush_input read: {inp!r}")
                    if not inp:
                        consecutive_empties += 1
                        if consecutive_empties >= 5:
                            return
                    else:
                        consecutive_empties = 0
                except Exception:
                    log.exception("timeout exception is")
                    return


class AsyncResponseSerialConnection(SerialConnection):
    @classmethod
    async def create(
        cls,
        port: str,
        baud_rate: int,
        timeout: float,
        ack: str,
        name: str | None = None,
        retry_wait_time_seconds: float = 0.1,
        loop: asyncio.AbstractEventLoop | None = None,
        error_keyword: str | None = None,
        alarm_keyword: str | None = None,
        reset_buffer_before_write: bool = False,
        error_codes: Type[BaseErrorCode] = DefaultErrorCodes,
        async_error_ack: str | None = None,
        number_of_retries: int = 0,
    ) -> AsyncResponseSerialConnection:
        """
        Create a connection.

        Args:
            port: url or port to connect to
            baud_rate: baud rate
            timeout: timeout in seconds
            ack: the command response ack
            name: the connection name
            retry_wait_time_seconds: how long to wait between retries.
            loop: optional event loop.
            error_keyword: optional string that will cause an
                           ErrorResponse exception when detected
                           (default: error)
            alarm_keyword: optional string that will cause an
                           AlarmResponse exception when detected
                           (default: alarm)
            reset_buffer_before_write: whether to reset the read buffer before
              every write
            async_error_ack: optional string that will indicate an asynchronous
                             error when detected (default: async)
            number_of_retries: default number of retries
            error_codes: Enum class for error codes
                         (default: DefaultErrorCodes)

        Returns: AsyncResponseSerialConnection
        """
        serial = await super()._build_serial(
            port=port,
            baud_rate=baud_rate,
            timeout=timeout,
            loop=loop,
            reset_buffer_before_write=reset_buffer_before_write,
        )
        name = name or port
        obj = cls(
            serial=serial,
            port=port,
            name=name,
            ack=ack,
            retry_wait_time_seconds=retry_wait_time_seconds,
            error_keyword=error_keyword or "err",
            alarm_keyword=alarm_keyword or "alarm",
            async_error_ack=async_error_ack or "async",
            number_of_retries=number_of_retries,
            error_codes=error_codes,
        )
        return obj

    def __init__(
        self,
        serial: AsyncSerial,
        port: str,
        name: str,
        ack: str,
        retry_wait_time_seconds: float,
        error_keyword: str,
        alarm_keyword: str,
        async_error_ack: str,
        number_of_retries: int = 0,
        error_codes: Type[BaseErrorCode] = DefaultErrorCodes,
    ) -> None:
        """
        Constructor

        Args:
            serial: AsyncSerial object
            port: url or port to connect to
            ack: the command response ack
            name: the connection name
            retry_wait_time_seconds: how long to wait between retries.
            error_keyword: string that will cause an ErrorResponse
                           exception when detected
            alarm_keyword: string that will cause an AlarmResponse
                           exception when detected
            async_error_ack: string that will indicate an asynchronous
                             error when detected
            number_of_retries: default number of retries
            error_codes: Enum class for error codes
        """
        super().__init__(
            serial=serial,
            port=port,
            name=name,
            ack=ack,
            retry_wait_time_seconds=retry_wait_time_seconds,
            error_keyword=error_keyword,
            alarm_keyword=alarm_keyword,
            error_codes=error_codes,
        )
        self._serial = serial
        self._port = port
        self._name = name
        self._ack = ack.encode()
        self._retry_wait_time_seconds = retry_wait_time_seconds
        self._number_of_retries = number_of_retries
        self._error_keyword = error_keyword.lower()
        self._alarm_keyword = alarm_keyword.lower()
        self._async_error_ack = async_error_ack.lower()

    async def send_multiack_command(
        self,
        command: CommandBuilder,
        retries: int = 0,
        timeout: float | None = None,
        acks: int = 1,
    ) -> list[str]:
        """Send a command and return the responses.

        Some commands result in multiple responses; collate them and return them all.

        Args:
            command: A command builder.
            retries: number of times to retry in case of timeout
            timeout: optional override of default timeout in seconds
            acks: the number of acks to expect
        """
        return await self.send_data_multiack(
            data=command.build(), retries=retries, timeout=timeout, acks=acks
        )

    async def send_command(
        self,
        command: CommandBuilder,
        retries: int | None = None,
        timeout: float | None = None,
    ) -> str:
        """
        Send a command and return the response.

        Args:
            command: A command builder.
            retries: number of times to retry in case of timeout
            timeout: optional override of default timeout in seconds

        Returns: The command response

        Raises: SerialException
        """
        return await self.send_data(
            data=command.build(),
            retries=retries if retries is not None else self._number_of_retries,
            timeout=timeout,
        )

    async def send_data_multiack(
        self, data: str, retries: int = 0, timeout: float | None = None, acks: int = 1
    ) -> list[str]:
        """Send data and return all responses."""
        async with (
            super().send_data_lock,
            self._serial.timeout_override("timeout", timeout),
        ):
            return await self._send_data_multiack(
                data=data, retries=retries or self._number_of_retries, acks=acks
            )

    async def send_data(
        self, data: str, retries: int | None = None, timeout: float | None = None
    ) -> str:
        """
        Send data and return the response.

        Args:
            data: The data to send.
            retries: number of times to retry in case of timeout
            timeout: optional override of default timeout in seconds

        Returns: The command response

        Raises: SerialException
        """
        async with (
            super().send_data_lock,
            self._serial.timeout_override("timeout", timeout),
        ):
            return await self._send_data(
                data=data,
                retries=retries if retries is not None else self._number_of_retries,
            )

    async def _consume_responses(
        self, acks: int
    ) -> AsyncIterator[tuple[Literal["response", "error", "empty-unknown"], bytes]]:
        while acks > 0:
            data = await self._serial.read_until(match=self._ack)
            log.debug(f"{self._name}: Read <- {data!r}")
            if self._async_error_ack.encode() in data:
                yield "error", data
            elif self._ack in data:
                yield "response", data
                acks -= 1
            else:
                # A read timeout, end
                yield "empty-unknown", data

    def _raise_on_parser_error(self, data: str, response: bytes) -> None:
        """Raise an exception if this response contains an error from the gcode parser on the module.

        This has to be treated specially because multiack commands won't get multiple acks if the command
        fails at the parse stage. The errors handled here should be kept in sync with the module gcode
        parse code.
        """
        try:
            str_response = self.process_raw_response(
                command=data, response=response.replace(self._ack, b"").decode()
            )
            self.raise_on_error(response=str_response, request=data)
        except (UnhandledGcode, GCodeCacheFull):
            raise
        except Exception:
            pass

    async def _send_one_retry(self, data: str, acks: int) -> list[str]:
        data_encode = data.encode("utf-8")
        log.debug(f"{self._name}: Write -> {data_encode!r}")
        await self._serial.write(data=data_encode)

        command_acks: list[bytes] = []
        async_errors: list[bytes] = []
        # consume responses before raising so we don't raise and orphan
        # a response in the buffer
        async for response_type, response in self._consume_responses(acks):
            if response_type == "error":
                async_errors.append(response)
                self._raise_on_parser_error(data, response)
            elif response_type == "response":
                command_acks.append(response)
                self._raise_on_parser_error(data, response)
            else:
                break

        for async_error in async_errors:
            # Remove ack from response
            ackless_response = async_error.replace(self._ack, b"")
            str_response = self.process_raw_response(
                command=data, response=ackless_response.decode()
            )
            self.raise_on_error(response=str_response, request=data)

        ackless_responses: list[str] = []
        for command_ack in command_acks:
            # Remove ack from response
            ackless_response = command_ack.replace(self._ack, b"")
            str_response = self.process_raw_response(
                command=data, response=ackless_response.decode()
            )
            self.raise_on_error(response=str_response, request=data)
            ackless_responses.append(str_response)
        return ackless_responses

    async def _send_data_multiack(
        self, data: str, retries: int, acks: int
    ) -> list[str]:
        """
        Send data and return the response(s).

        Args:
            data: The data to send.
            retries: number of times to retry in case of timeout
            acks: The number of expected command responses

        This function retries (resends the command) up to (retries) times, and waits
        for (acks) responses. It also listens for async errors. These are an older
        mechanism where at the moment an error occurs, some modules will send a message
        like async error ERR:202:whatever

        This function will detect async error messages if they were sent before it
        sent the command or if they are sent before the final ack for the command is
        sent. It will not catch async errors otherwise.

        This function will always try and consume all the acknowledgements specified for
        its command if it sends the command, even if an async error happens in between.

        This should all work together to make sure that there aren't any leftover acks
        after the function ends, which could lead to the read/write mechanics getting out
        of sync.

        Returns: The command responses

        Raises: SerialException from an error ack to this command or an async error.
        """
        responses: list[str] = []

        for retry in range(retries + 1):
            responses = await self._send_one_retry(data, acks)
            if responses:
                return responses
            log.info(f"{self._name}: retry number {retry}/{retries}")
            await self.on_retry()

        raise NoResponse(port=self._port, command=data)

    async def _send_data(self, data: str, retries: int) -> str:
        return (await self._send_data_multiack(data, retries, 1))[0]
