"""Binary USB messenger class."""
from __future__ import annotations
import asyncio
from inspect import Traceback
from typing import Optional, Callable, Tuple, Dict

import logging

from opentrons_hardware.drivers.binary_usb.bin_serial import SerialUsbDriver
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId


from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
)

from opentrons_hardware.firmware_bindings.utils import BinarySerializableException

log = logging.getLogger(__name__)


BinaryMessageListenerCallback = Callable[[BinaryMessageDefinition], None]


BinaryMessageListenerCallbackFilter = Callable[[BinaryMessageId], bool]


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
        return bool((await self._drive.write(message=message)) == message.get_size())

    async def __aenter__(self) -> BinaryMessenger:
        """Start messenger."""
        self.start()
        return self

    async def __aexit__(
        self, exc_type: type, exc_val: BaseException, exc_tb: Traceback
    ) -> None:
        """Stop messenger."""
        await self.stop()

    def start(self) -> None:
        """Start the reader task."""
        if self._task:
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
        try:
            await self._read_task()
        except asyncio.CancelledError:
            pass
        except Exception:
            log.exception("Exception in read")
            raise

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
                log.error(f"Message {message_definition} is not recognized.")

    async def _handle_error(self, message_definition: BinaryMessageDefinition) -> None:
        log.error("Got a error message.")

    def get_driver(self) -> SerialUsbDriver:
        """Return the underling driver for this messenger."""
        return self._drive


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
