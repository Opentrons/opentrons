"""Tests for FirmwareUpdateEraser."""
import pytest
from mock import AsyncMock

from opentrons_hardware.firmware_bindings import (
    NodeId,
    ErrorCode,
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
    message_definitions,
    payloads,
)
from opentrons_hardware.firmware_bindings.messages.fields import ErrorCodeField
from opentrons_hardware.firmware_update import FirmwareUpdateEraser
from opentrons_hardware.firmware_update.errors import ErrorResponse, TimeoutResponse
from tests.conftest import MockCanMessageNotifier


@pytest.fixture
def subject(mock_messenger: AsyncMock) -> FirmwareUpdateEraser:
    """Test subject fixture."""
    return FirmwareUpdateEraser(mock_messenger)


async def test_messaging(
    subject: FirmwareUpdateEraser,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should send erase message."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Mock send method."""
        if isinstance(message, message_definitions.FirmwareUpdateEraseAppRequest):
            response = message_definitions.FirmwareUpdateEraseAppResponse(
                payload=payloads.FirmwareUpdateAcknowledge(
                    error_code=ErrorCodeField(ErrorCode.ok)
                )
            )
            can_message_notifier.notify(
                message=response,
                arbitration_id=ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=response.message_id,
                        originating_node_id=node_id,
                        node_id=NodeId.host,
                        function_code=0,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder

    target_id = NodeId.head_bootloader

    await subject.run(target_id, 1)

    mock_messenger.send.assert_called_once_with(
        node_id=target_id,
        message=message_definitions.FirmwareUpdateEraseAppRequest(),
    )


async def test_error_message(
    subject: FirmwareUpdateEraser,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should raise on error response."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Mock send method."""
        if isinstance(message, message_definitions.FirmwareUpdateEraseAppRequest):
            response = message_definitions.FirmwareUpdateEraseAppResponse(
                payload=payloads.FirmwareUpdateAcknowledge(
                    error_code=ErrorCodeField(ErrorCode.hardware)
                )
            )
            can_message_notifier.notify(
                message=response,
                arbitration_id=ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=response.message_id,
                        originating_node_id=node_id,
                        node_id=NodeId.host,
                        function_code=0,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder

    with pytest.raises(ErrorResponse):
        await subject.run(NodeId.host, 1)


async def test_timeout(
    subject: FirmwareUpdateEraser, mock_messenger: AsyncMock
) -> None:
    """It should raise on timeout."""
    with pytest.raises(TimeoutResponse):
        await subject.run(NodeId.host, 0.05)
