"""Test one-shot tool detector."""
from opentrons_hardware.firmware_bindings.constants import ToolType, PipetteName
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
)
import pytest
from mock import AsyncMock, call

from opentrons_hardware.firmware_bindings.messages.fields import (
    ToolField,
    PipetteNameField,
    SerialDataCodeField,
)
from opentrons_hardware.firmware_bindings.utils import UInt16Field
from opentrons_hardware.hardware_control.tools import detector, types
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.firmware_bindings import (
    NodeId,
)
from tests.conftest import CanLoopback
from typing import List, Tuple


@pytest.fixture
def subject(
    mock_messenger: AsyncMock,
) -> detector.OneshotToolDetector:
    """The test subject."""
    return detector.OneshotToolDetector(messenger=mock_messenger)


async def test_suppresses_undefined(
    subject: detector.OneshotToolDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
) -> None:
    """It should not query tools that are undefined."""

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        """Replaces mock send method."""
        if isinstance(message, message_definitions.AttachedToolsRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PushToolsDetectedNotification(
                        payload=payloads.ToolsDetectedNotificationPayload(
                            z_motor=ToolField(ToolType.nothing_attached.value),
                            a_motor=ToolField(ToolType.nothing_attached.value),
                            gripper=ToolField(ToolType.nothing_attached.value),
                        )
                    ),
                    NodeId.head,
                )
            ]
        return []

    message_send_loopback.add_responder(responder)
    tools = await subject.detect()

    assert tools.left is None
    assert tools.right is None
    assert tools.gripper is None
    # Only the tools request should be sent - no followups for mounts with nothing on
    # them
    mock_messenger.send.assert_called_once_with(
        node_id=NodeId.head,
        message=message_definitions.AttachedToolsRequest(),
    )


async def test_handles_not_attached(
    subject: detector.OneshotToolDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
) -> None:
    """It should not query tools that are undefined."""

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        """Replaces mock send method."""
        if isinstance(message, message_definitions.AttachedToolsRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PushToolsDetectedNotification(
                        payload=payloads.ToolsDetectedNotificationPayload(
                            z_motor=ToolField(ToolType.nothing_attached.value),
                            a_motor=ToolField(ToolType.nothing_attached.value),
                            gripper=ToolField(ToolType.nothing_attached.value),
                        )
                    ),
                    NodeId.head,
                )
            ]
        return []

    message_send_loopback.add_responder(responder)

    tools = await subject.detect()

    assert tools.left is None
    assert tools.right is None
    assert tools.gripper is None

    # Only the tools request should be sent - no followups for mounts with nothing on
    # them
    mock_messenger.send.assert_called_once_with(
        node_id=NodeId.head,
        message=message_definitions.AttachedToolsRequest(
            payload=payloads.EmptyPayload()
        ),
    )


async def test_sends_only_required_followups(
    subject: detector.OneshotToolDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
) -> None:
    """It should send pipette info followups only for present tools."""

    def attached_tool_responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.AttachedToolsRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PushToolsDetectedNotification(
                        payload=payloads.ToolsDetectedNotificationPayload(
                            z_motor=ToolField(ToolType.nothing_attached.value),
                            a_motor=ToolField(ToolType.pipette.value),
                            gripper=ToolField(ToolType.nothing_attached.value),
                        )
                    ),
                    NodeId.head,
                )
            ]
        return []

    def instrument_info_responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.InstrumentInfoRequest):
            payload = payloads.PipetteInfoResponsePayload(
                name=PipetteNameField(PipetteName.p1000_single.value),
                model=UInt16Field(2),
                serial=SerialDataCodeField(b"20220809A022"),
            )
            return [
                (
                    NodeId.host,
                    message_definitions.PipetteInfoResponse(payload=payload),
                    NodeId.pipette_right,
                )
            ]
        return []

    message_send_loopback.add_responder(attached_tool_responder)
    message_send_loopback.add_responder(instrument_info_responder)

    tools = await subject.detect()

    assert tools.left is None
    assert tools.right == types.PipetteInformation(
        name=PipetteName.p1000_single,
        name_int=PipetteName.p1000_single.value,
        model="0.2",
        serial="20220809A022",
    )
    assert tools.gripper is None

    assert mock_messenger.send.mock_calls == [
        call(
            node_id=NodeId.head,
            message=message_definitions.AttachedToolsRequest(),
        ),
        call(
            node_id=NodeId.broadcast,
            message=message_definitions.InstrumentInfoRequest(),
        ),
    ]


async def test_sends_all_required_followups(
    subject: detector.OneshotToolDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
) -> None:
    """It should send pipette info followups only for present tools."""

    def attached_tool_responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.AttachedToolsRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PushToolsDetectedNotification(
                        payload=payloads.ToolsDetectedNotificationPayload(
                            z_motor=ToolField(ToolType.pipette.value),
                            a_motor=ToolField(ToolType.pipette.value),
                            gripper=ToolField(ToolType.gripper.value),
                        )
                    ),
                    NodeId.head,
                )
            ]
        return []

    def instrument_info_responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.InstrumentInfoRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PipetteInfoResponse(
                        payload=payloads.PipetteInfoResponsePayload(
                            name=PipetteNameField(PipetteName.p1000_single.value),
                            model=UInt16Field(2),
                            serial=SerialDataCodeField(b"20220809A022"),
                        )
                    ),
                    NodeId.pipette_left,
                ),
                (
                    NodeId.host,
                    message_definitions.PipetteInfoResponse(
                        payload=payloads.PipetteInfoResponsePayload(
                            name=PipetteNameField(PipetteName.p1000_multi.value),
                            model=UInt16Field(34),
                            serial=SerialDataCodeField(b"20231005A220"),
                        )
                    ),
                    NodeId.pipette_right,
                ),
                (
                    NodeId.host,
                    message_definitions.GripperInfoResponse(
                        payload=payloads.GripperInfoResponsePayload(
                            model=UInt16Field(1),
                            serial=SerialDataCodeField(b"20220531A01"),
                        )
                    ),
                    NodeId.gripper,
                ),
            ]
        return []

    message_send_loopback.add_responder(attached_tool_responder)
    message_send_loopback.add_responder(instrument_info_responder)

    tools = await subject.detect()

    assert tools.left == types.PipetteInformation(
        name=PipetteName.p1000_single,
        name_int=PipetteName.p1000_single.value,
        model="0.2",
        serial="20220809A022",
    )
    assert tools.right == types.PipetteInformation(
        name=PipetteName.p1000_multi,
        name_int=PipetteName.p1000_multi.value,
        model="3.4",
        serial="20231005A220",
    )
    assert tools.gripper == types.GripperInformation(model="0.1", serial="20220531A01")

    assert mock_messenger.send.mock_calls == [
        call(
            node_id=NodeId.head,
            message=message_definitions.AttachedToolsRequest(
                payload=payloads.EmptyPayload()
            ),
        ),
        call(
            node_id=NodeId.broadcast,
            message=message_definitions.InstrumentInfoRequest(),
        ),
    ]


@pytest.mark.parametrize(
    "bad_serial,parsed_serial",
    [
        (
            # if it's decodable, it's decoded
            b"\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c",
            "\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c",
        ),
        (
            # if it has a 0, that ends the serial
            b"asbasdb\x00abasc",
            "asbasdb",
        ),
    ],
)
async def test_handles_bad_serials(
    subject: detector.OneshotToolDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
    bad_serial: bytes,
    parsed_serial: str,
) -> None:
    """It should accept serial values that cannot be decoded."""

    def attached_tool_responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.AttachedToolsRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PushToolsDetectedNotification(
                        payload=payloads.ToolsDetectedNotificationPayload(
                            z_motor=ToolField(ToolType.pipette.value),
                            a_motor=ToolField(ToolType.nothing_attached.value),
                            gripper=ToolField(ToolType.nothing_attached.value),
                        )
                    ),
                    NodeId.head,
                )
            ]
        return []

    def pipette_info_responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.InstrumentInfoRequest):
            payload = payloads.PipetteInfoResponsePayload(
                name=PipetteNameField(100),
                model=UInt16Field(31),
                serial=SerialDataCodeField(bad_serial),
            )
            return [
                (
                    NodeId.host,
                    message_definitions.PipetteInfoResponse(payload=payload),
                    NodeId.pipette_left,
                )
            ]
        return []

    message_send_loopback.add_responder(attached_tool_responder)
    message_send_loopback.add_responder(pipette_info_responder)

    tools = await subject.detect()

    assert tools.left == types.PipetteInformation(
        name=PipetteName.unknown, name_int=100, model="3.1", serial=parsed_serial
    )


async def test_no_instrument_info_response(
    subject: detector.OneshotToolDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
) -> None:
    """It should not crash when a tool does not respond."""

    def attached_tool_responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.AttachedToolsRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PushToolsDetectedNotification(
                        payload=payloads.ToolsDetectedNotificationPayload(
                            z_motor=ToolField(ToolType.nothing_attached.value),
                            a_motor=ToolField(ToolType.pipette.value),
                            gripper=ToolField(ToolType.nothing_attached.value),
                        )
                    ),
                    NodeId.head,
                )
            ]
        return []

    message_send_loopback.add_responder(attached_tool_responder)

    responses = await subject.detect(timeout_sec=0.1)
    assert responses.left is None
    assert responses.right is None
    assert responses.gripper is None
