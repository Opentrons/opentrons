"""Integration tests for the can_comm script."""
from typing import List

from mock import MagicMock

import pytest

from opentrons_ot3_firmware.message import (
    CanMessage,
)
from opentrons_ot3_firmware.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_ot3_firmware.messages.payloads import (
    GetStatusResponsePayload,
)
from opentrons_hardware.scripts import can_comm
from opentrons_ot3_firmware.constants import MessageId, NodeId


@pytest.fixture
def mock_get_input() -> MagicMock:
    """Mock get input."""
    return MagicMock(spec=input)


@pytest.fixture
def mock_output() -> MagicMock:
    """Mock get input."""
    return MagicMock(spec=print)


def test_prompt_message_without_payload(
    mock_get_input: MagicMock, mock_output: MagicMock
) -> None:
    """It should create a message without payload."""
    message_id = MessageId.get_status_request
    node_id = NodeId.pipette
    mock_get_input.side_effect = [
        str(list(MessageId).index(message_id)),
        str(list(NodeId).index(node_id)),
    ]
    r = can_comm.prompt_message(mock_get_input, mock_output)
    assert r == CanMessage(
        arbitration_id=ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message_id, node_id=node_id, originating_node_id=NodeId.host
            )
        ),
        data=b"",
    )


def test_prompt_message_with_payload(
    mock_get_input: MagicMock, mock_output: MagicMock
) -> None:
    """It should send a message with payload."""
    message_id = MessageId.device_info_response
    node_id = NodeId.pipette
    mock_get_input.side_effect = [
        str(list(MessageId).index(message_id)),
        str(list(NodeId).index(node_id)),
        str(0xFF00FF00),
    ]
    r = can_comm.prompt_message(mock_get_input, mock_output)
    assert r == CanMessage(
        arbitration_id=ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message_id, node_id=node_id, originating_node_id=NodeId.host
            )
        ),
        data=b"\xff\x00\xff\x00",
    )


@pytest.mark.parametrize(
    argnames=["user_input"],
    argvalues=[
        # Not a number
        [["b"]],
        # Out of range
        [["1000000000"]],
    ],
)
def test_prompt_enum_bad_input(
    user_input: List[str], mock_get_input: MagicMock, mock_output: MagicMock
) -> None:
    """It should raise on bad input."""
    mock_get_input.side_effect = user_input
    with pytest.raises(can_comm.InvalidInput):
        can_comm.prompt_enum(MessageId, mock_get_input, mock_output)


@pytest.mark.parametrize(
    argnames=["user_input"],
    argvalues=[
        # Not a number
        [["b"]],
    ],
)
def test_prompt_payload_bad_input(
    user_input: List[str], mock_get_input: MagicMock
) -> None:
    """It should raise on bad input."""
    mock_get_input.side_effect = user_input
    with pytest.raises(can_comm.InvalidInput):
        can_comm.prompt_payload(GetStatusResponsePayload, mock_get_input)


def test_prompt_message_bad_input(
    mock_get_input: MagicMock, mock_output: MagicMock
) -> None:
    """It should raise on bad input."""
    message_id = MessageId.get_status_response
    node_id = NodeId.pipette
    mock_get_input.side_effect = [
        str(list(MessageId).index(message_id)),
        str(list(NodeId).index(node_id)),
        "-123",
        # out of range for Uint32
        str(0x1FF00FF00),
    ]
    with pytest.raises(can_comm.InvalidInput):
        can_comm.prompt_message(mock_get_input, mock_output)
