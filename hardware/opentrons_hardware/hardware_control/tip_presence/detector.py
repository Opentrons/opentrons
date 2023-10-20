"""Tip detector."""

import asyncio
import logging
from typing import Any, List, Callable, Set

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    MultipleMessagesWaitableCallback,
    WaitableCallback,
)

from opentrons_hardware.firmware_bindings.constants import SensorId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    TipStatusQueryRequest,
    PushTipPresenceNotification,
)
from opentrons_hardware.firmware_bindings import NodeId, ArbitrationId
from opentrons_shared_data.errors.exceptions import CommandTimedOutError

from .types import TipChangeListener, TipNotification

log = logging.getLogger(__name__)


def _parse_tip_status(response: MessageDefinition) -> TipNotification:
    assert isinstance(response, PushTipPresenceNotification)
    sensor_id = SensorId(response.payload.sensor_id.value)
    status = bool(response.payload.ejector_flag_status.value)
    return TipNotification(sensor_id, status)


class TipDetector:
    """Class to listen to tip presence notifications from pipette firmware."""

    def __init__(
        self,
        messenger: CanMessenger,
        node: NodeId,
        number_of_sensors: int = 1,
    ) -> None:
        """Initialize a tip detector for a pipette mount."""
        self._messenger = messenger
        self._node = node
        self._number_of_responses = number_of_sensors
        self._subscribers: List[TipChangeListener] = []
        self._messenger.add_listener(self._receive_message, self._filter)
        self._waiters: Set[Callable[[TipNotification], None]] = set()
        self._tasks: Set[asyncio.Task[Any]] = set()

    def add_subscriber(self, subscriber: TipChangeListener) -> None:
        """Add listener to tip change notification."""
        if subscriber not in self._subscribers:
            self._subscribers.append(subscriber)

    def remove_subscriber(self, subscriber: TipChangeListener) -> None:
        """Remove listener to tip change notification."""
        if subscriber in self._subscribers:
            self._subscribers.remove(subscriber)

    def _filter(self, arb_id: ArbitrationId) -> bool:
        return (arb_id.parts.message_id == PushTipPresenceNotification.message_id) and (
            NodeId(arb_id.parts.originating_node_id) == self._node
        )

    def __del__(self) -> None:
        self._messenger.remove_listener(self._receive_message)
        for task in self._tasks:
            task.cancel()

    def _receive_message(
        self, response: MessageDefinition, arb_id: ArbitrationId
    ) -> None:
        if isinstance(response, PushTipPresenceNotification):
            tip_change = _parse_tip_status(response)

        # pass new update to active waiters
        for waiter in self._waiters:
            waiter(tip_change)
        # create a task that ends up broadcasting this update
        self._create_reject_debounce_task(tip_change)

    async def _broadcast(
        self, fut: asyncio.Future[None], tip_change: TipNotification
    ) -> None:
        # wait for the future to time out before broadcasting the update
        try:
            asyncio.wait_for(fut, timeout=1.0)
            # this tip change is rejected, end the task here
            return
        except asyncio.TimeoutError:
            # debounce check timed out, broadcast tip update to subscribers
            for subscriber in self._subscribers:
                subscriber(tip_change)
        except asyncio.CancelledError:
            # fut is canceled before timing out, tip update is lost
            log.error("A tip update debounce task was unexpectedly canceled")

    async def _create_reject_debounce_task(self, tip_change: TipNotification) -> None:
        fut: asyncio.Future[None] = asyncio.Future()

        def _debounce_waiter(next_update: TipNotification) -> None:
            # monitor next updates and make sure it's not a debounce
            if next_update.presence != tip_change.presence:
                # Debounced, do not broadcast
                fut.set_result(None)

        # starts the broadcasting task
        waiter = _debounce_waiter
        task = asyncio.create_task(self._broadcast(fut, tip_change))
        self._tasks.add(task)
        self._waiters.add(waiter)

        def _done_waiting(fut: asyncio.Future[None]) -> None:
            # waiter has done its job and can be removed
            self._waiters.discard(waiter)

        fut.add_done_callback(_done_waiting)
        task.add_done_callback(lambda t: self._tasks.discard(t))

    async def request_tip_status(
        self,
        timeout: float = 1.0,
    ) -> List[TipNotification]:
        """Explicitly send a request to get tip status value from a node."""

        async def gather_responses(
            reader: WaitableCallback,
        ) -> List[TipNotification]:
            data = []
            async for response, _ in reader:
                assert isinstance(response, PushTipPresenceNotification)
                data.append(_parse_tip_status(response))
                if len(data) == self._number_of_responses:
                    return data
            raise StopAsyncIteration

        with MultipleMessagesWaitableCallback(
            self._messenger,
            self._filter,
            self._number_of_responses,
        ) as mc:
            await self._messenger.send(
                node_id=self._node, message=TipStatusQueryRequest()
            )
            try:
                status = await asyncio.wait_for(gather_responses(mc), timeout)
            except asyncio.TimeoutError as te:
                msg = f"Tip presence poll of {self._node} timed out"
                log.warning(msg)
                raise CommandTimedOutError(message=msg) from te
        return status
