"""Can messenger class."""
from __future__ import annotations
import asyncio
from inspect import Traceback
from typing import List, Optional, Callable, Tuple
import logging

from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.firmware_bindings.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.firmware_bindings.message import CanMessage
from opentrons_hardware.firmware_bindings.constants import NodeId, MessageId

from opentrons_hardware.firmware_bindings.messages.messages import (
    MessageDefinition,
    get_definition,
)
from opentrons_hardware.firmware_bindings.utils import BinarySerializableException

log = logging.getLogger(__name__)


MessageListenerCallback = Callable[[MessageDefinition, ArbitrationId], None]
"""Incoming message listener."""


class CanMessenger:
    """High level can messaging class wrapping a CanDriver.

    The background task can be controlled with start/stop methods.

    To receive message notifications add a listener using add_listener
    """

    def __init__(self, driver: AbstractCanDriver) -> None:
        """Constructor.

        Args:
            driver: The can bus driver to use.
        """
        self._drive = driver
        self._listeners: List[MessageListenerCallback] = []
        self._task: Optional[asyncio.Task[None]] = None

    async def send(self, node_id: NodeId, message: MessageDefinition) -> None:
        """Send a message."""
        # TODO (amit, 2021-11-05): Use function code when it is better defined.
        arbitration_id = ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message.message_id,
                node_id=node_id,
                function_code=0,
                originating_node_id=NodeId.host,
            )
        )
        data = message.payload.serialize()
        log.info(
            f"Sending -->\n\tarbitration_id: {arbitration_id},\n\t"
            f"payload: {message.payload}"
        )
        await self._drive.send(
            message=CanMessage(arbitration_id=arbitration_id, data=data)
        )

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

    def add_listener(self, listener: MessageListenerCallback) -> None:
        """Add a message listener."""
        self._listeners.append(listener)

    def remove_listener(self, listener: MessageListenerCallback) -> None:
        """Remove a message listener."""
        self._listeners.remove(listener)

    async def _read_task_shield(self) -> None:
        try:
            await self._read_task()
        except Exception:
            log.exception("Exception in read")
            raise

    async def _read_task(self) -> None:
        """Read task."""
        async for message in self._drive:
            message_definition = get_definition(
                MessageId(message.arbitration_id.parts.message_id)
            )
            if message_definition:
                try:
                    build = message_definition.payload_type.build(message.data)
                    log.info(
                        f"Received <--\n\tarbitration_id: {message.arbitration_id},\n\t"
                        f"payload: {build}"
                    )
                    for listener in self._listeners:
                        listener(message_definition(payload=build), message.arbitration_id)  # type: ignore[arg-type]  # noqa: E501
                except BinarySerializableException:
                    log.exception(f"Failed to build from {message}")
            else:
                log.error(f"Message {message} is not recognized.")


class WaitableCallback:
    """MessageListenerCallback that can be awaited or iterated."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor.

        Args:
            messenger: Messenger to listen on.
        """
        self._messenger = messenger
        self._queue: asyncio.Queue[
            Tuple[MessageDefinition, ArbitrationId]
        ] = asyncio.Queue()

    def __call__(
        self, message: MessageDefinition, arbitration_id: ArbitrationId
    ) -> None:
        """Callback."""
        self._queue.put_nowait((message, arbitration_id))

    def __enter__(self) -> WaitableCallback:
        """Enter context manager."""
        self._messenger.add_listener(self)
        return self

    def __exit__(
        self, exc_type: type, exc_val: BaseException, exc_tb: Traceback
    ) -> None:
        """Exit context manager."""
        self._messenger.remove_listener(self)

    def __aiter__(self) -> WaitableCallback:
        """Enter iterator."""
        return self

    async def __anext__(self) -> Tuple[MessageDefinition, ArbitrationId]:
        """Async next."""
        return await self.read()

    async def read(self) -> Tuple[MessageDefinition, ArbitrationId]:
        """Read next message."""
        return await self._queue.get()
