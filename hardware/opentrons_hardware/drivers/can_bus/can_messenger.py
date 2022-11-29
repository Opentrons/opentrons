"""Can messenger class."""
from __future__ import annotations
import asyncio
from inspect import Traceback
from typing import Optional, Callable, Tuple, Dict, Union, List

import logging

from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.firmware_bindings.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.firmware_bindings.message import CanMessage
from opentrons_hardware.firmware_bindings.utils.binary_serializable import (
    BinarySerializable,
)

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    MessageId,
    FunctionCode,
    ErrorSeverity,
    ErrorCode,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    Acknowledgement,
    ErrorMessage,
)

from opentrons_hardware.firmware_bindings.messages.messages import (
    MessageDefinition,
    get_definition,
)

from opentrons_hardware.firmware_bindings.messages.payloads import ErrorMessagePayload

from opentrons_hardware.firmware_bindings.utils import BinarySerializableException

from .errors import AsyncHardwareError

log = logging.getLogger(__name__)


MessageListenerCallback = Callable[[MessageDefinition, ArbitrationId], None]
"""Incoming message listener."""


MessageListenerCallbackFilter = Callable[[ArbitrationId], bool]
"""A function used to filter incoming messages. Returns true to accept message."""


_AckResponses = Union[ErrorMessage, Acknowledgement]
_AckPacket = Tuple[ArbitrationId, _AckResponses]
_Acks = List[_AckPacket]
_AckIdFilter = [MessageId.acknowledgement, MessageId.error_message]

_Basic_Nodes: List[NodeId] = [NodeId.gantry_x, NodeId.gantry_y, NodeId.head]
_Gripper_SubNodes: List[NodeId] = [NodeId.gripper_g, NodeId.gripper_z]
_Head_SubNodes: List[NodeId] = [NodeId.head_l, NodeId.head_r]


class AcknowledgeListener:
    """Helper clas for CanMessenger to listen for Acks back from commands."""

    def __init__(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        message: MessageDefinition,
        timeout: float,
        expected_nodes: List[NodeId],
    ) -> None:
        """Build this listener class and ready the queue."""
        self._can_messenger = can_messenger
        self._node_id = node_id
        self._message = message
        self._timeout = timeout
        self._event = asyncio.Event()
        # todo add ability to know how many nodes will ack to a broadcast
        # we can assume at least 3 for the gantry and head boards
        self._expected_nodes = expected_nodes
        self._expected_gripper_subnodes = (
            _Gripper_SubNodes.copy() if NodeId.gripper in expected_nodes else []
        )
        self._expected_head_subnodes = (
            _Head_SubNodes.copy() if NodeId.head in expected_nodes else []
        )
        self._ack_queue: asyncio.Queue[_AckPacket] = asyncio.Queue()

    def __call__(
        self, message: MessageDefinition, arbitration_id: ArbitrationId
    ) -> None:
        """Called by can messenger when a message arrives."""
        if isinstance(message, Acknowledgement) or isinstance(message, ErrorMessage):
            self.handle_ack(message, arbitration_id)

    def handle_ack(self, message: _AckResponses, arbitration_id: ArbitrationId) -> None:
        """Add the ack to the queue if it matches the message_index of the sent message."""
        if message.payload.message_index == self._message.payload.message_index:
            if arbitration_id.parts.originating_node_id in self._expected_nodes:
                self._expected_nodes.remove(arbitration_id.parts.originating_node_id)
            # this is a bit of a hack, some nodes don't responde with the same originating nodes
            # and respond with their subnodes instead, this should take care of that
            # by removing the higher order node when all the subnodes respond
            elif (
                arbitration_id.parts.originating_node_id
                in self._expected_gripper_subnodes
            ):
                self._expected_gripper_subnodes.remove(
                    arbitration_id.parts.originating_node_id
                )
                if len(self._expected_gripper_subnodes) == 0:
                    self._expected_nodes.remove(NodeId.gripper)
            elif (
                arbitration_id.parts.originating_node_id in self._expected_head_subnodes
            ):
                self._expected_head_subnodes.remove(
                    arbitration_id.parts.originating_node_id
                )
                if len(self._expected_head_subnodes) == 0:
                    self._expected_nodes.remove(NodeId.head)
            self._ack_queue.put_nowait((arbitration_id, message))
        # If we've recieved all responses exit the listener
        if len(self._expected_nodes) == 0:
            self._event.set()

    async def send_and_verify_recieved(self) -> ErrorCode:
        """Send the message and wait for an Ack."""
        try:
            self._can_messenger.add_listener(
                self,
                lambda arbitration_id: bool(
                    arbitration_id.parts.message_id in _AckIdFilter
                ),
            )
            self._event.clear()
            await self._can_messenger.send(self._node_id, self._message)
            await asyncio.wait_for(
                self._event.wait(),
                max(1.0, self._timeout),
            )
        except asyncio.TimeoutError:
            log.error(
                f"Message did not receive ack for message index {self._message.payload.message_index}"
            )
            return ErrorCode.timeout
        finally:
            self._can_messenger.remove_listener(self)

        while not self._ack_queue.empty():
            ack = self._ack_queue.get_nowait()
            if isinstance(ack, ErrorMessage):
                return ack.payload.error_code.value
        return ErrorCode.ok


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
        self._listeners: Dict[
            MessageListenerCallback,
            Tuple[MessageListenerCallback, Optional[MessageListenerCallbackFilter]],
        ] = {}
        self._task: Optional[asyncio.Task[None]] = None

    async def send(self, node_id: NodeId, message: MessageDefinition) -> None:
        """Send a message."""
        func = (
            FunctionCode.error
            if message.message_id == MessageId.error_message
            else FunctionCode.network_management
        )

        arbitration_id = ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message.message_id,
                node_id=node_id,
                function_code=func,
                originating_node_id=NodeId.host,
            )
        )
        data = message.payload.serialize()
        log.debug(
            f"Sending -->\n\tarbitration_id: {arbitration_id},\n\t"
            f"payload: {message.payload}"
        )
        await self._drive.send(
            message=CanMessage(arbitration_id=arbitration_id, data=data)
        )

    async def ensure_send(
        self,
        node_id: NodeId,
        message: MessageDefinition,
        timeout: float = 3,
        expected_nodes: List[NodeId] = [],
    ) -> ErrorCode:
        """Send a message and wait for the ack."""
        if len(expected_nodes) == 0:
            log.warning("Expected Nodes should have been specified")
            if node_id == NodeId.broadcast:
                expected_nodes = _Basic_Nodes.copy()
            else:
                expected_nodes = [node_id]

        listener = AcknowledgeListener(
            can_messenger=self,
            node_id=node_id,
            message=message,
            timeout=timeout,
            expected_nodes=expected_nodes,
        )
        return await listener.send_and_verify_recieved()

    async def __aenter__(self) -> CanMessenger:
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
        listener: MessageListenerCallback,
        filter: Optional[MessageListenerCallbackFilter] = None,
    ) -> None:
        """Add a message listener."""
        self._listeners[listener] = listener, filter

    def remove_listener(self, listener: MessageListenerCallback) -> None:
        """Remove a message listener."""
        if listener in self._listeners:
            del self._listeners[listener]

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
        async for message in self._drive:
            message_definition = get_definition(
                MessageId(message.arbitration_id.parts.message_id)
            )
            if message_definition:
                try:
                    build = message_definition.payload_type.build(message.data)
                    log.debug(
                        f"Received <--\n\tarbitration_id: {message.arbitration_id},\n\t"
                        f"payload: {build}"
                    )
                    for listener, filter in self._listeners.values():
                        if filter and not filter(message.arbitration_id):
                            log.debug("message ignored by filter")
                            continue
                        listener(message_definition(payload=build), message.arbitration_id)  # type: ignore[arg-type]
                    if message.arbitration_id == MessageId.error_message:
                        self._handle_error(build)
                except BinarySerializableException:
                    log.exception(f"Failed to build from {message}")
            else:
                log.error(f"Message {message} is not recognized.")

    def _handle_error(self, build: BinarySerializable) -> None:
        err_msg = ErrorMessage(payload=build)  # type: ignore[arg-type]
        error_payload: ErrorMessagePayload = err_msg.payload
        error_name = ""
        if error_payload.error_code.value in [err.value for err in ErrorCode]:
            error_name = str(ErrorCode(error_payload.error_code.value).name)
        else:
            error_name = "UNKNOWN ERROR"
        if error_payload.severity == ErrorSeverity.warning:
            log.warning(f"recived a firmware warning {error_name}")
        elif error_payload.severity == ErrorSeverity.recoverable:
            log.error(f"recived a firmware recoverable error {error_name}")
        elif error_payload.severity == ErrorSeverity.unrecoverable:
            log.critical(f"recived a firmware critical error {error_name}")

        if error_payload.message_index == 0:
            log.error(
                f"error {str(err_msg)} recieved is asyncronous, raising exception"
            )
            raise AsyncHardwareError(
                "Async firmware error: " + str(err_msg),
                ErrorCode(error_payload.error_code.value),
                ErrorSeverity(error_payload.severity.value),
            )


class WaitableCallback:
    """MessageListenerCallback that can be awaited or iterated."""

    def __init__(
        self,
        messenger: CanMessenger,
        filter: Optional[MessageListenerCallbackFilter] = None,
    ) -> None:
        """Constructor.

        Args:
            messenger: Messenger to listen on.
            filter: Optional message filtering function
        """
        self._messenger = messenger
        self._filter = filter
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
        self._messenger.add_listener(self, self._filter)
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


class MultipleMessagesWaitableCallback(WaitableCallback):
    """MessageListenerCallback that can be awaited or iterated."""

    # TODO we should refactor the rest of the code that relies on
    # waitable callback to specify how many messages it would like to wait
    # for. Otherwise, the code will timeout unless you return directly
    # from an async for loop.
    def __init__(
        self,
        messenger: CanMessenger,
        filter: Optional[MessageListenerCallbackFilter] = None,
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

    async def __anext__(self) -> Tuple[MessageDefinition, ArbitrationId]:
        """Async next."""
        if self._number_of_messages < 1:
            raise StopAsyncIteration
        self._number_of_messages -= 1
        return await self.read()
