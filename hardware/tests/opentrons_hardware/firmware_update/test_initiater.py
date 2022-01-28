"""Tests for FirmwareUpdateInitiator."""
import pytest
from mock import AsyncMock, call
from opentrons_ot3_firmware import NodeId, ArbitrationId, ArbitrationIdParts
from opentrons_ot3_firmware.messages import MessageDefinition
from opentrons_ot3_firmware.messages import message_definitions, payloads
from opentrons_ot3_firmware.utils import UInt32Field

from opentrons_hardware.firmware_update import initiator
from tests.conftest import MockCanMessageNotifier


@pytest.fixture
def subject(mock_messenger: AsyncMock) -> initiator.FirmwareUpdateInitiator:
    """The test subject."""
    return initiator.FirmwareUpdateInitiator(mock_messenger)


async def test_messaging(
    subject: initiator.FirmwareUpdateInitiator,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
    target: initiator.Target,
) -> None:
    """It should initiate update and prepare for update."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Mock send method."""
        if isinstance(message, message_definitions.DeviceInfoRequest):
            response = message_definitions.DeviceInfoResponse(
                payload=payloads.DeviceInfoResponsePayload(version=UInt32Field(0))
            )
            can_message_notifier.notify(
                message=response,
                arbitration_id=ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=response.message_id,
                        originating_node_id=target.bootloader_node,
                        node_id=NodeId.host,
                        function_code=0,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder

    await subject.run(target)

    mock_messenger.send.assert_has_calls(
        [
            call(
                node_id=target.system_node,
                message=message_definitions.FirmwareUpdateInitiate(
                    payload=payloads.EmptyPayload()
                ),
            ),
            call(
                node_id=target.bootloader_node,
                message=message_definitions.DeviceInfoRequest(
                    payload=payloads.EmptyPayload()
                ),
            ),
        ]
    )
