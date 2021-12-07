"""Can messenger class."""
import asyncio
from typing import List, Optional
import logging

from opentrons_hardware.drivers.can_bus import (
    CanDriver,

)
from opentrons_ot3_firmware.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,

)
from opentrons_ot3_firmware.message import CanMessage
from opentrons_ot3_firmware.constants import NodeId, MessageId
from abc import ABC, abstractmethod

from opentrons_ot3_firmware.messages.messages import (
    MessageDefinition,
    get_definition,
)
from opentrons_ot3_firmware.utils import BinarySerializableException

log = logging.getLogger(__name__)


class MessageListener(ABC):
    """Incoming message listener."""

    @abstractmethod
    def on_message(self, message: MessageDefinition) -> None:
        """A new message arrived."""
        ...


class CanMessenger:
    """High level can messaging class wrapping a CanDriver.

    The background task can be controlled with start/stop methods.

    To receive message notifications add a listener using add_listener
    """

    def __init__(self, driver: CanDriver) -> None:
        """Constructor.

        Args:
            driver: The can bus driver to use.
        """
        self._drive = driver
        self._listeners: List[MessageListener] = []
        self._task: Optional[asyncio.Task[None]] = None

    async def send(self, node_id: NodeId, message: MessageDefinition) -> None:
        """Send a message."""
        # TODO (amit, 2021-11-05): Use function code when it is better defined.
        arbitration_id = ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message.message_id, node_id=node_id, function_code=0
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
        self._task = asyncio.get_event_loop().create_task(self._read_task())

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

    def add_listener(self, listener: MessageListener) -> None:
        """Add a message listener."""
        self._listeners.append(listener)

    def remove_listener(self, listener: MessageListener) -> None:
        """Remove a message listener."""
        self._listeners.remove(listener)

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
                        listener.on_message(message_definition(payload=build))  # type: ignore[arg-type]  # noqa: E501
                except BinarySerializableException:
                    log.exception(f"Failed to build from {message}")
            else:
                log.error(f"Message {message} is not recognized.")
