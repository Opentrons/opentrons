"""Tests for the tool detector."""

from typing import cast, List, Tuple
import pytest
from mock import AsyncMock
from opentrons_hardware.drivers.can_bus import CanMessenger

from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    MessageDefinition,
    fields,
)
from opentrons_hardware.firmware_bindings.constants import NodeId, ToolType, PipetteName
from opentrons_hardware.firmware_bindings.utils import UInt16Field
from opentrons_hardware.hardware_control.tools.detector import ToolDetector
from opentrons_hardware.hardware_control.tools.types import (
    ToolDetectionResult,
    PipetteInformation,
    GripperInformation,
)

from tests.conftest import CanLoopback


@pytest.fixture
def subject(mock_messenger: CanMessenger) -> ToolDetector:
    """The object under test."""
    return ToolDetector(messenger=mock_messenger)


async def test_detect_starts_with_stimulus(
    subject: ToolDetector,
    mock_messenger: CanMessenger,
    message_send_loopback: CanLoopback,
) -> None:
    """It should send a message when you begin detecting."""
    iterator = subject.detect()

    def _responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        return [
            (
                NodeId.host,
                message_definitions.PushToolsDetectedNotification(
                    payload=payloads.ToolsDetectedNotificationPayload(
                        fields.ToolField(0), fields.ToolField(0), fields.ToolField(0)
                    )
                ),
                NodeId.head,
            )
        ]

    message_send_loopback.add_responder(_responder)
    await iterator.__anext__()
    cast(AsyncMock, mock_messenger).send.assert_awaited_once_with(
        node_id=NodeId.head, message=message_definitions.AttachedToolsRequest()
    )


async def test_subject_detects(
    subject: ToolDetector,
    mock_messenger: CanMessenger,
    message_send_loopback: CanLoopback,
) -> None:
    """It should yield one detection result per notification."""
    iterator = subject.detect()

    responses = [
        payloads.ToolsDetectedNotificationPayload(
            fields.ToolField(ToolType.nothing_attached.value),
            fields.ToolField(ToolType.nothing_attached.value),
            fields.ToolField(ToolType.nothing_attached.value),
        ),
        payloads.ToolsDetectedNotificationPayload(
            fields.ToolField(ToolType.pipette.value),
            fields.ToolField(ToolType.nothing_attached.value),
            fields.ToolField(ToolType.nothing_attached.value),
        ),
        payloads.ToolsDetectedNotificationPayload(
            fields.ToolField(ToolType.pipette.value),
            fields.ToolField(ToolType.pipette.value),
            fields.ToolField(ToolType.nothing_attached.value),
        ),
        payloads.ToolsDetectedNotificationPayload(
            fields.ToolField(ToolType.nothing_attached.value),
            fields.ToolField(ToolType.pipette.value),
            fields.ToolField(ToolType.nothing_attached.value),
        ),
        payloads.ToolsDetectedNotificationPayload(
            fields.ToolField(ToolType.nothing_attached.value),
            fields.ToolField(ToolType.nothing_attached.value),
            fields.ToolField(ToolType.gripper.value),
        ),
        payloads.ToolsDetectedNotificationPayload(
            fields.ToolField(ToolType.pipette.value),
            fields.ToolField(ToolType.nothing_attached.value),
            fields.ToolField(ToolType.gripper.value),
        ),
        payloads.ToolsDetectedNotificationPayload(
            fields.ToolField(ToolType.pipette.value),
            fields.ToolField(ToolType.pipette.value),
            fields.ToolField(ToolType.gripper.value),
        ),
        payloads.ToolsDetectedNotificationPayload(
            fields.ToolField(ToolType.nothing_attached.value),
            fields.ToolField(ToolType.pipette.value),
            fields.ToolField(ToolType.gripper.value),
        ),
    ]

    def _responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        return [
            (
                NodeId.host,
                message_definitions.PushToolsDetectedNotification(payload=payload),
                NodeId.head,
            )
            for payload in responses
        ]

    message_send_loopback.add_responder(_responder)
    for response in responses:
        detected = await iterator.__anext__()
        assert detected.left == ToolType(response.z_motor.value)
        assert detected.right == ToolType(response.a_motor.value)
        assert detected.gripper == ToolType(response.gripper.value)


async def test_no_probe_for_no_tools(
    subject: ToolDetector,
    mock_messenger: CanMessenger,
    message_send_loopback: CanLoopback,
) -> None:
    """It should not hit the network to resolve if no tools are present."""
    await subject.resolve(
        ToolDetectionResult(
            left=ToolType.nothing_attached,
            right=ToolType.nothing_attached,
            gripper=ToolType.nothing_attached,
        )
    )
    cast(AsyncMock, mock_messenger).send.assert_not_called()


@pytest.mark.parametrize(
    "attached,messages",
    [
        (
            ToolDetectionResult(
                left=ToolType.nothing_attached,
                right=ToolType.pipette,
                gripper=ToolType.nothing_attached,
            ),
            [
                (
                    NodeId.host,
                    message_definitions.PipetteInfoResponse(
                        payload=payloads.PipetteInfoResponsePayload(
                            name=fields.PipetteNameField(PipetteName.p1000_multi.value),
                            model=UInt16Field(10),
                            serial=fields.SerialDataCodeField(b"hello"),
                        ),
                    ),
                    NodeId.pipette_right,
                ),
            ],
        ),
        (
            ToolDetectionResult(
                left=ToolType.pipette,
                right=ToolType.nothing_attached,
                gripper=ToolType.gripper,
            ),
            [
                (
                    NodeId.host,
                    message_definitions.PipetteInfoResponse(
                        payload=payloads.PipetteInfoResponsePayload(
                            name=fields.PipetteNameField(
                                PipetteName.p1000_single.value
                            ),
                            model=UInt16Field(10),
                            serial=fields.SerialDataCodeField(b"hello"),
                        ),
                    ),
                    NodeId.pipette_left,
                ),
                (
                    NodeId.host,
                    message_definitions.GripperInfoResponse(
                        payload=payloads.GripperInfoResponsePayload(
                            model=UInt16Field(13),
                            serial=fields.SerialDataCodeField(b"hello"),
                        )
                    ),
                    NodeId.gripper,
                ),
            ],
        ),
    ],
)
async def test_resolve_waits_only_needed(
    attached: ToolDetectionResult,
    messages: List[Tuple[NodeId, MessageDefinition, NodeId]],
    subject: ToolDetector,
    mock_messenger: CanMessenger,
    message_send_loopback: CanLoopback,
) -> None:
    """It should only wait for required tests."""

    def _responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        return messages

    message_send_loopback.add_responder(_responder)
    result = await subject.resolve(attached)
    if attached.left != ToolType.nothing_attached:
        assert result.left is not None
    else:
        assert result.left is None

    if attached.right != ToolType.nothing_attached:
        assert result.right is not None
    else:
        assert result.right is None

    if attached.gripper != ToolType.nothing_attached:
        assert result.gripper is not None
    else:
        assert result.gripper is None


async def test_resolve_handles_ok(
    subject: ToolDetector,
    mock_messenger: CanMessenger,
    message_send_loopback: CanLoopback,
) -> None:
    """It should resolve tool types correctly if they respond correctly."""

    def _responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        return [
            (
                NodeId.host,
                message_definitions.PipetteInfoResponse(
                    payload=payloads.PipetteInfoResponsePayload(
                        name=fields.PipetteNameField(PipetteName.p1000_single.value),
                        model=UInt16Field(34),
                        serial=fields.SerialDataCodeField(b"leftserial"),
                    ),
                ),
                NodeId.pipette_left,
            ),
            (
                NodeId.host,
                message_definitions.PipetteInfoResponse(
                    payload=payloads.PipetteInfoResponsePayload(
                        name=fields.PipetteNameField(PipetteName.p50_multi.value),
                        model=UInt16Field(33),
                        serial=fields.SerialDataCodeField(b"rightserial"),
                    ),
                ),
                NodeId.pipette_right,
            ),
            (
                NodeId.host,
                message_definitions.GripperInfoResponse(
                    payload=payloads.GripperInfoResponsePayload(
                        model=UInt16Field(10),
                        serial=fields.SerialDataCodeField(b"gripperserial"),
                    )
                ),
                NodeId.gripper,
            ),
        ]

    message_send_loopback.add_responder(_responder)
    resolved = await subject.resolve(
        ToolDetectionResult(
            left=ToolType.pipette, right=ToolType.pipette, gripper=ToolType.gripper
        )
    )
    assert resolved.left == PipetteInformation(
        name=PipetteName.p1000_single,
        name_int=PipetteName.p1000_single.value,
        model="3.4",
        serial="leftserial",
    )
    assert resolved.right == PipetteInformation(
        name=PipetteName.p50_multi,
        name_int=PipetteName.p50_multi.value,
        model="3.3",
        serial="rightserial",
    )
    assert resolved.gripper == GripperInformation(model="1.0", serial="gripperserial")
