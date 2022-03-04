"""Tests for FirmwareUpdateInitiator."""
import pytest
from mock import AsyncMock, call
from opentrons_hardware.firmware_bindings import (
    NodeId,
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.firmware_bindings.utils import UInt32Field

from opentrons_hardware.firmware_update import initiator
from opentrons_hardware.firmware_update.errors import BootloaderNotReady
from tests.conftest import MockCanMessageNotifier


@pytest.fixture
def subject(mock_messenger: AsyncMock) -> initiator.FirmwareUpdateInitiator:
    """The test subject."""
    return initiator.FirmwareUpdateInitiator(mock_messenger)


async def test_messaging(
    subject: initiator.FirmwareUpdateInitiator,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
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
                        originating_node_id=node_id,
                        node_id=NodeId.host,
                        function_code=0,
                    )
                ),
            )

    target = initiator.head

    mock_messenger.send.side_effect = responder

    await subject.run(target, 1, 1)

    assert mock_messenger.send.mock_calls == [
        call(
            node_id=target.system_node,
            message=message_definitions.FirmwareUpdateInitiate(),
        ),
        call(
            node_id=target.bootloader_node,
            message=message_definitions.FirmwareUpdateInitiate(),
        ),
        call(
            node_id=target.bootloader_node,
            message=message_definitions.DeviceInfoRequest(),
        ),
    ]


async def test_retry(
    subject: initiator.FirmwareUpdateInitiator,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should retry device info request."""
    responses = [
        message_definitions.DeviceInfoResponse(
            payload=payloads.DeviceInfoResponsePayload(version=UInt32Field(0))
        ),
        None,
        None,
    ]
    retry_count = len(responses)

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Mock send method."""
        if isinstance(message, message_definitions.DeviceInfoRequest):
            response = responses.pop()
            if response:
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

    target = initiator.head

    mock_messenger.send.side_effect = responder

    await subject.run(target, retry_count=retry_count + 1, ready_wait_time_sec=0.1)

    assert (
        mock_messenger.send.mock_calls
        == [
            call(
                node_id=target.system_node,
                message=message_definitions.FirmwareUpdateInitiate(),
            ),
            call(
                node_id=target.bootloader_node,
                message=message_definitions.FirmwareUpdateInitiate(),
            ),
        ]
        + [
            call(
                node_id=target.bootloader_node,
                message=message_definitions.DeviceInfoRequest(),
            ),
        ]
        * retry_count
    )


async def test_bootloader_not_ready(
    subject: initiator.FirmwareUpdateInitiator,
    mock_messenger: AsyncMock,
) -> None:
    """It should raise an error when bootloader never responds."""
    target = initiator.head

    retry_count = 3
    with pytest.raises(BootloaderNotReady):
        await subject.run(target, retry_count=retry_count, ready_wait_time_sec=0.1)

    assert (
        mock_messenger.send.mock_calls
        == [
            call(
                node_id=target.system_node,
                message=message_definitions.FirmwareUpdateInitiate(),
            ),
            call(
                node_id=target.bootloader_node,
                message=message_definitions.FirmwareUpdateInitiate(),
            ),
        ]
        + [
            call(
                node_id=target.bootloader_node,
                message=message_definitions.DeviceInfoRequest(
                    payload=payloads.EmptyPayload()
                ),
            ),
        ]
        * retry_count
    )
