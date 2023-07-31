"""Test the estop.detector module."""
import pytest
from mock import AsyncMock
from typing import Type, List

from opentrons_hardware.hardware_control.estop.detector import (
    EstopSummary,
    EstopDetector,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
)
from opentrons_shared_data.errors.exceptions import (
    InternalUSBCommunicationError,
)

from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    EstopButtonDetectionChange,
    EstopStateChange,
    EstopButtonPresentRequest,
    EstopStateRequest,
    Ack,
    AckFailed,
)
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId


@pytest.fixture
async def mock_binary_messenger() -> AsyncMock:
    """Create a mocked binary messenger."""
    mock = AsyncMock(BinaryMessenger)
    return mock


@pytest.fixture
async def subject(mock_binary_messenger: AsyncMock) -> EstopDetector:
    """Create a mocked EstopDetector."""
    initial_state = EstopSummary(left_detected=True, right_detected=True, engaged=False)
    return EstopDetector(
        usb_messenger=mock_binary_messenger, initial_state=initial_state
    )


@pytest.mark.parametrize(
    "initial_state",
    [
        EstopSummary(left_detected=True, right_detected=False, engaged=False),
        EstopSummary(left_detected=False, right_detected=True, engaged=True),
    ],
)
async def test_estop_detector_builder(
    mock_binary_messenger: AsyncMock, initial_state: EstopSummary
) -> None:
    """Test the factory function for the estop detector."""

    async def mock_send_and_receive(
        message: BinaryMessageDefinition, response_type: Type[BinaryMessageDefinition]
    ) -> BinaryMessageDefinition:
        if isinstance(message, EstopButtonPresentRequest):
            return EstopButtonDetectionChange(
                aux1_detected=UInt8Field(1 if initial_state.left_detected else 0),
                aux2_detected=UInt8Field(1 if initial_state.right_detected else 0),
            )
        if isinstance(message, EstopStateRequest):
            return EstopStateChange(
                engaged=UInt8Field(1 if initial_state.engaged else 0)
            )
        return response_type()

    mock_binary_messenger.send_and_receive.side_effect = mock_send_and_receive
    subject = await EstopDetector.build(usb_messenger=mock_binary_messenger)

    assert subject.status == initial_state

    mock_binary_messenger.add_listener.assert_called_once()

    async def mock_send_and_receive_error(
        message: BinaryMessageDefinition, response_type: Type[BinaryMessageDefinition]
    ) -> BinaryMessageDefinition:
        return AckFailed()

    mock_binary_messenger.send_and_receive.side_effect = mock_send_and_receive_error
    with pytest.raises(InternalUSBCommunicationError):
        subject = await EstopDetector.build(usb_messenger=mock_binary_messenger)


async def test_estop_detector_listener(
    subject: EstopDetector, mock_binary_messenger: AsyncMock
) -> None:
    """Test the listener filtering."""
    callback = mock_binary_messenger.add_listener.call_args.args[0]
    filter = mock_binary_messenger.add_listener.call_args.args[1]

    assert not filter(BinaryMessageId.ack)
    assert filter(BinaryMessageId.estop_state_change)
    assert filter(BinaryMessageId.estop_button_detection_change)

    responses: List[EstopSummary] = []

    def test_listener(summary: EstopSummary) -> None:
        responses.append(summary)

    subject.add_listener(test_listener)

    # Callback should filter out unexpected messsages
    callback(Ack())
    assert len(responses) == 0

    # When getting a state change, the callback should fire
    callback(EstopStateChange(engaged=UInt8Field(1)))
    assert len(responses) == 1
    assert responses[0].engaged
    assert responses[0] == subject.status

    # When getting a second state cahnge, the state should only change as expected
    callback(
        EstopButtonDetectionChange(
            aux1_detected=UInt8Field(1), aux2_detected=UInt8Field(0)
        )
    )
    assert len(responses) == 2
    assert responses[1].engaged
    assert responses[1].left_detected
    assert not responses[1].right_detected
    assert responses[1] == subject.status

    # If we remove the listener, we should not get any more messages
    subject.remove_listener(test_listener)

    callback(EstopStateChange(engaged=UInt8Field(0)))
    assert len(responses) == 2
