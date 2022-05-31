"""Test serial number setting."""
import asyncio
from typing import Type, Union

import pytest

from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.fields import SerialField
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    GripperInfoResponse,
    PipetteInfoResponse,
    PipetteInfoRequest,
    GripperInfoRequest,
    SetSerialNumber,
)

from opentrons_hardware.firmware_bindings import NodeId, ArbitrationId
from opentrons_hardware.firmware_bindings.messages.payloads import (
    SerialNumberPayload,
)
from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback


def filter_func(arb: ArbitrationId) -> bool:
    """Message filtering function."""
    return bool(
        arb.parts.message_id
        in {PipetteInfoResponse.message_id, GripperInfoResponse.message_id}
    )


@pytest.mark.parametrize(
    argnames=["node_id", "info_request_type", "info_response_type"],
    argvalues=[
        [NodeId.gripper, GripperInfoRequest, GripperInfoResponse],
        [NodeId.pipette_left, PipetteInfoRequest, PipetteInfoResponse],
    ],
)
@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_set_serial(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    node_id: NodeId,
    info_request_type: Type[MessageDefinition],
    info_response_type: Type[MessageDefinition],
) -> None:
    """It should write a serial number and read it back."""
    sns = [b"01234567\x00\x00\x00\x00", b"76543210\x00\x00\x00\x00"]
    for sn in sns:
        s = SerialNumberPayload(serial=SerialField(sn))

        await can_messenger.send(node_id=node_id, message=SetSerialNumber(payload=s))
        await can_messenger.send(node_id=node_id, message=info_request_type())
        response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

        assert arbitration_id.parts.originating_node_id == node_id
        assert arbitration_id.parts.message_id == info_response_type.message_id
        assert isinstance(response, GripperInfoResponse) or isinstance(response, PipetteInfoResponse)
        assert response.payload.serial == s.serial
