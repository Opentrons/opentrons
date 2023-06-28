"""Binary USB messenger class."""
from __future__ import annotations
import asyncio
from inspect import Traceback
from typing import Optional, Callable, Tuple, Dict, Type, TypeVar
from traceback import format_exception

import logging

from opentrons_shared_data.errors.exceptions import (
    EnumeratedError,
    InternalUSBCommunicationError,
    PythonException,
)

from opentrons_hardware.drivers.binary_usb.bin_serial import SerialUsbDriver
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId


from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    AckFailed,
)

from opentrons_hardware.firmware_bindings.utils import BinarySerializableException

log = logging.getLogger(__name__)


BinaryMessageListenerCallback = Callable[[BinaryMessageDefinition], None]


BinaryMessageListenerCallbackFilter = Callable[[BinaryMessageId], bool]


class SendAndReceiveListener:
    """Helper class for sending a message and ensuring a response."""

    def __init__(
        self,
        messenger: BinaryMessenger,
        response_type: Type[BinaryMessageDefinition],
        timeout: float = 1.0,
    ) -> None:
        """Create a new SendAndReceiveListener."""
        self._event = asyncio.Event()
        self._messenger = messenger
        self._response_type = response_type
        self._timeout = timeout
        self._response: Optional[BinaryMessageDefinition] = None

    def __call__(self, message: BinaryMessageDefinition) -> None:
        """When called as a listener, mark the message as received."""
        if isinstance(message, self._response_type) or isinstance(message, AckFailed):
            self._response = message
            self._event.set()

    async def send_and_receive(
        self, message: BinaryMessageDefinition
    ) -> Optional[BinaryMessageDefinition]:
        """Send a message and await the response."""
        self._event.clear()
        self._response = None
        self._messenger.add_listener(
            self,
            lambda message_id: bool(
                int(message_id) == self._response_type().message_id.value
            ),
        )
        await self._messenger.send(message)
        try:
            await asyncio.wait_for(self._event.wait(), self._timeout)
        except asyncio.TimeoutError:
            log.error("response timed out")
        finally:
            self._messenger.remove_listener(self)

        return self._response


E = TypeVar("E", bound=BaseException)


class BinaryMessenger:
    """High level can messaging class wrapping a binary usb driver.

    The background task can be controlled with start/stop methods.

    To receive message notifications add a listener using add_listener
    """

    def __init__(self, driver: SerialUsbDriver) -> None:
        """Constructor.

        Args:
            driver: The can bus driver to use.
        """
        self._drive = driver
        self._listeners: Dict[
            BinaryMessageListenerCallback,
            Tuple[
                BinaryMessageListenerCallback,
                Optional[BinaryMessageListenerCallbackFilter],
            ],
        ] = {}
        self._task: Optional[asyncio.Task[None]] = None

    async def send(self, message: BinaryMessageDefinition) -> bool:
        """Send a message."""
        try:
            return bool(
                (await self._drive.write(message=message)) == message.get_size()
            )
        except EnumeratedError:
            raise
        except BaseException as exc:
            raise InternalUSBCommunicationError(
                message="Error in USB send",
                detail={"message": str(message)},
                wrapping=[PythonException(exc)],
            )

    async def __aenter__(self) -> BinaryMessenger:
        """Start messenger."""
        self.start()
        return self

    async def __aexit__(
        self, exc_type: Optional[Type[E]], exc_val: E, exc_tb: Optional[Traceback]
    ) -> None:
        """Stop messenger."""
        await self.stop()
        if exc_val:
            # type ignore because it's unclear what the type of exc_tb should be
            log.error(format_exception(exc_type, exc_val, exc_tb))  # type: ignore
            if isinstance(exc_val, EnumeratedError):
                raise exc_val
            raise PythonException(exc_val)

    def start(self) -> None:
        """Start the reader task."""
        if self.reader_is_active():
            log.warning("task already running.")
            return
        self._task = asyncio.get_event_loop().create_task(self._read_task_shield())

    async def stop(self) -> None:
        """Stop the reader task."""
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                log.info("Task cancelled.")

        else:
            log.warning("task not running.")

    def reader_is_active(self) -> bool:
        """Check if the reader task is currently active."""
        return self._task is not None and not self._task.done()

    def add_listener(
        self,
        listener: BinaryMessageListenerCallback,
        filter: Optional[BinaryMessageListenerCallbackFilter] = None,
    ) -> None:
        """Add a message listener."""
        self._listeners[listener] = listener, filter

    def remove_listener(self, listener: BinaryMessageListenerCallback) -> None:
        """Remove a message listener."""
        if listener in self._listeners:
            self._listeners.pop(listener)

    async def _read_task_shield(self) -> None:
        while True:
            try:
                await self._read_task()
            except (asyncio.CancelledError, StopAsyncIteration):
                return
            except (InternalUSBCommunicationError) as e:
                log.exception(f"Nonfatal error in USB read task: {e}")
                continue
            except BaseException as e:
                # Log this separately if it's some unknown error
                log.exception(f"Unexpected error in USB read task: {e}")
                continue

    async def _read_task(self) -> None:
        """Read task."""
        async for message_definition in self._drive:
            if message_definition:
                try:
                    for listener, filter in self._listeners.values():
                        if filter and not filter(
                            BinaryMessageId(message_definition.message_id.value)
                        ):
                            log.debug("message ignored by filter")
                            continue
                        listener(message_definition)
                    if (
                        message_definition.message_id.value
                        == BinaryMessageId.ack_failed
                    ):
                        await self._handle_error(message_definition)
                except BinarySerializableException:
                    log.exception("Failed to build message")
            else:
                log.debug("read timed out, calling read again")

    async def _handle_error(self, message_definition: BinaryMessageDefinition) -> None:
        log.error("Got a error message.")

    def get_driver(self) -> SerialUsbDriver:
        """Return the underling driver for this messenger."""
        return self._drive

    async def send_and_receive(
        self,
        message: BinaryMessageDefinition,
        response_type: Type[BinaryMessageDefinition],
        timeout: float = 1.0,
    ) -> Optional[BinaryMessageDefinition]:
        """Send a message and await a specific response message."""
        listener = SendAndReceiveListener(self, response_type, timeout)
        try:
            return await listener.send_and_receive(message)
        except EnumeratedError:
            raise
        except BaseException as exc:
            log.exception("Exception in send_and_receive")
            raise InternalUSBCommunicationError(
                message="Exception in internal USB send_and_receive",
                detail={"message": str(message)},
                wrapping=[PythonException(exc=exc)],
            )


class BinaryWaitableCallback:
    """MessageListenerCallback that can be awaited or iterated."""

    def __init__(
        self,
        messenger: BinaryMessenger,
        filter: Optional[BinaryMessageListenerCallbackFilter] = None,
    ) -> None:
        """Constructor.

        Args:
            messenger: Messenger to listen on.
            filter: Optional message filtering function
        """
        self._messenger = messenger
        self._filter = filter
        self._queue: asyncio.Queue[BinaryMessageDefinition] = asyncio.Queue()

    def __call__(self, message: BinaryMessageDefinition) -> None:
        """Callback."""
        self._queue.put_nowait(message)

    def __enter__(self) -> BinaryWaitableCallback:
        """Enter context manager."""
        self._messenger.add_listener(self, self._filter)
        return self

    def __exit__(
        self, exc_type: type, exc_val: BaseException, exc_tb: Traceback
    ) -> None:
        """Exit context manager."""
        self._messenger.remove_listener(self)

    def __aiter__(self) -> BinaryWaitableCallback:
        """Enter iterator."""
        return self

    async def __anext__(self) -> BinaryMessageDefinition:
        """Async next."""
        return await self.read()

    async def read(self) -> BinaryMessageDefinition:
        """Read next message."""
        return await self._queue.get()


class BinaryMultipleMessagesWaitableCallback(BinaryWaitableCallback):
    """MessageListenerCallback that can be awaited or iterated."""

    # TODO we should refactor the rest of the code that relies on
    # waitable callback to specify how many messages it would like to wait
    # for. Otherwise, the code will timeout unless you return directly
    # from an async for loop.
    def __init__(
        self,
        messenger: BinaryMessenger,
        filter: Optional[BinaryMessageListenerCallbackFilter] = None,
        number_of_messages: Optional[int] = None,
    ) -> None:
        """Constructor.

        Args:
            messenger: Messenger to listen on.
            filter: Optional message filtering function
            number_of_messages: Optional number of messages to wait for or
            default to 1.
        """
        super().__init__(messenger, filter)
        self._number_of_messages: int = number_of_messages or 1

    async def __anext__(self) -> BinaryMessageDefinition:
        """Async next."""
        if self._number_of_messages < 1:
            raise StopAsyncIteration
        self._number_of_messages -= 1
        return await self.read()
