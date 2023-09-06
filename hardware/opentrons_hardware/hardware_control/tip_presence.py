"""Utilities for reading the current status of the tip presence photointerrupter."""
import asyncio
import logging

from typing_extensions import Literal
from typing import List

from opentrons_shared_data.errors.exceptions import CommandTimedOutError

from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    MultipleMessagesWaitableCallback,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    TipStatusQueryRequest,
    PushTipPresenceNotification,
)

from opentrons_hardware.firmware_bindings.constants import MessageId, NodeId

log = logging.getLogger(__name__)


async def get_tip_ejector_state(
    can_messenger: CanMessenger,
    node: Literal[NodeId.pipette_left, NodeId.pipette_right],
    expected_responses: int = 1,
    timeout: float = 1.0,
) -> List[int]:
    """Get the state of the tip presence interrupter.

    When the tip ejector flag is occuluded, then we
    know that there is a tip on the pipette.
    """

    def _filter(arbitration_id: ArbitrationId) -> bool:
        return (NodeId(arbitration_id.parts.originating_node_id) == node) and (
            MessageId(arbitration_id.parts.message_id)
            == MessageId.tip_presence_notification
        )

    async def gather_responses(reader: WaitableCallback) -> List[int]:
        data: List[int] = []
        async for response, _ in reader:
            assert isinstance(response, PushTipPresenceNotification)
            tip_ejector_state = response.payload.ejector_flag_status.value
            data.append(tip_ejector_state)
        return data

    with MultipleMessagesWaitableCallback(
        can_messenger,
        _filter,
        number_of_messages=expected_responses,
    ) as _reader:
        data_list: List[int] = []
        await can_messenger.send(node_id=node, message=TipStatusQueryRequest())
        try:

            data_list = await asyncio.wait_for(
                gather_responses(_reader),
                timeout,
            )
        except asyncio.TimeoutError as te:
            msg = f"Tip presence poll of {node} timed out"
            log.warning(msg)
            raise CommandTimedOutError(message=msg) from te
        finally:
            return data_list
