"""Tests for reading the current status of the tip presence photointerrupter."""
import pytest
from mock import AsyncMock

from typing import List, Tuple

from opentrons_hardware.hardware_control.tip_presence import TipDetector, types
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
    message_definitions,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    PushTipPresenceNotificationPayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import SensorIdField
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorId
from opentrons_shared_data.errors.exceptions import CommandTimedOutError
from tests.conftest import CanLoopback


async def test_get_tip_ejector_state(
    mock_messenger: AsyncMock, message_send_loopback: CanLoopback
) -> None:
    """Test that get tip ejector state sends the correct request and receives a response."""
    node = NodeId.pipette_left
    detector = TipDetector(mock_messenger, node)

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
                            ejector_flag_status=UInt8Field(1),
                            sensor_id=SensorIdField(SensorId.S0),
                        )
                    ),
                    node,
                )
            ]
        return []

    message_send_loopback.add_responder(responder)

    res = await detector.request_tip_status()

    # We should have sent a request
    mock_messenger.send.assert_called_once_with(
        node_id=node, message=message_definitions.TipStatusQueryRequest()
    )

    assert res == [types.TipNotification(SensorId.S0, True)]


async def test_tip_ejector_state_times_out(mock_messenger: AsyncMock) -> None:
    """Test that a timeout is handled."""
    node = NodeId.pipette_left
    detector = TipDetector(mock_messenger, node, 2)

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
                            ejector_flag_status=UInt8Field(1),
                            sensor_id=SensorIdField(SensorId.S0),
                        )
                    ),
                    node,
                )
            ]
        return []

    with pytest.raises(CommandTimedOutError):
        res = await detector.request_tip_status()
        assert not res
