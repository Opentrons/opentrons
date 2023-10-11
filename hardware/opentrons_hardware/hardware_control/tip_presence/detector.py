"""Tip detector."""

import asyncio
import logging
from typing import List
from typing_extensions import Literal

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
        number_of_sensors: Literal[1, 2] = 1,
    ) -> None:
        self._messenger = messenger
        self._node = node
        self._number_of_responses = number_of_sensors
        self._subscribers: List[TipChangeListener] = []

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

    def start(self) -> None:
        self._messenger.add_listener(self._dispatch_tip_notification, self._filter)

    def _dispatch_tip_notification(
        self, response: MessageDefinition, arb_id: ArbitrationId
    ) -> None:
        if isinstance(response, PushTipPresenceNotification):
            tip_change = _parse_tip_status(response)
            for subscriber in self._subscribers:
                subscriber(tip_change)

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
