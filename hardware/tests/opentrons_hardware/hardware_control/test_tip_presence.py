from mock import AsyncMock

from typing import List, Tuple

from opentrons_hardware.hardware_control.tip_presence import get_tip_ejector_state
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
    message_definitions,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    PushTipPresenceNotificationPayload,
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.firmware_bindings import NodeId
from tests.conftest import CanLoopback


async def test_get_tip_ejector_state(
    mock_messenger: AsyncMock, message_send_loopback: CanLoopback
) -> None:
    """Test that get tip ejector state sends the correct request and receives a response."""
    node = NodeId.pipette_left

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        """Mock send method."""
        if isinstance(message, message_definitions.TipStatusQueryRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PushTipPresenceNotification(
                        payload=PushTipPresenceNotificationPayload(
                            ejector_flag_status=UInt8Field(1)
                        )
                    ),
                    node,
                )
            ]
        return []

    message_send_loopback.add_responder(responder)

    res = await get_tip_ejector_state(mock_messenger, node)

    # We should have sent a request
    mock_messenger.ensure_send.assert_called_once_with(
        node_id=node,
        message=message_definitions.TipStatusQueryRequest(),
        expected_nodes=[node],
    )

    assert res == True


async def test_tip_ejector_state_times_out(mock_messenger: AsyncMock) -> None:
    """Test that a timeout is handled."""
    node = NodeId.pipette_left

    res = await get_tip_ejector_state(mock_messenger, node)
    assert res == False
