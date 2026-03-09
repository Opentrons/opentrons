"""Tip detector."""

import asyncio
import logging
from typing import List, Callable, Set

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
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
        debounce_interval: float = 0.5,
    ) -> None:
        """Initialize a tip detector for a pipette mount."""
        self._messenger = messenger
        self._node = node
        self._number_of_responses = number_of_sensors
        self._debounce_interval = debounce_interval
        self._subscribers: Set[TipChangeListener] = set()
        self._task = asyncio.create_task(self._main_task())
        self._latest = None

    def add_subscriber(self, subscriber: TipChangeListener) -> Callable[[], None]:
        """Add listener to tip change notification."""
        self._subscribers.add(subscriber)

        def remove_subscriber() -> None:
            self._subscribers.discard(subscriber)

        return remove_subscriber

    def remove_subscriber(self, subscriber: TipChangeListener) -> None:
        """Remove listener to tip change notification."""
        if subscriber in self._subscribers:
            self._subscribers.remove(subscriber)

    def _filter(self, arb_id: ArbitrationId) -> bool:
        return (arb_id.parts.message_id == PushTipPresenceNotification.message_id) and (
            NodeId(arb_id.parts.originating_node_id) == self._node
        )

    def cleanup(self) -> None:
        """Clean up."""
        if not self._task.done():
            self._task.cancel()

    async def _main_task(self) -> None:
        try:
            await self._main_task_protected()
        except Exception:
            raise

    async def _main_task_protected(self) -> None:
        with WaitableCallback(self._messenger, self._filter) as wc:
            await self._debounce_task(wc)

    async def _update_subscribers(self, update: TipNotification) -> None:
        for s in self._subscribers:
            s(update)

    async def _debounce_task(self, callback: WaitableCallback) -> None:
        async for response, _ in callback:
            update = _parse_tip_status(response)

            async def _keep_updating() -> None:
                nonlocal update
                async for response, _ in callback:
                    update = _parse_tip_status(response)

            try:
                await asyncio.wait_for(
                    _keep_updating(), timeout=self._debounce_interval
                )
            except asyncio.TimeoutError:
                pass
            finally:
                await self._update_subscribers(update)

    async def request_tip_status(
        self,
        timeout: float = 1.0,
    ) -> List[TipNotification]:
        """Explicitly send a request to get tip status value from a node."""

        async def gather_responses(
            reader: WaitableCallback,
        ) -> List[TipNotification]:
            data: List[TipNotification] = []
            async for response, _ in reader:
                assert isinstance(response, PushTipPresenceNotification)
                update = _parse_tip_status(response)
                # if we've already received a message from the same sensor,
                # replace it with the latest udpate
                data = [d for d in data if d.sensor != update.sensor]
                data.append(update)
                if len(data) == self._number_of_responses:
                    return data
            raise StopAsyncIteration

        with WaitableCallback(
            self._messenger,
            self._filter,
        ) as mc:
            await self._messenger.send(
                node_id=self._node, message=TipStatusQueryRequest()
            )
            try:
                status = await asyncio.wait_for(gather_responses(mc), timeout)
            except (asyncio.TimeoutError, StopAsyncIteration) as te:
                msg = f"Tip presence poll of {self._node} timed out"
                log.warning(msg)
                raise CommandTimedOutError(message=msg) from te
        return status
