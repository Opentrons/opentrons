"""Test serial number setting."""
import asyncio
from typing import Type

import pytest

from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.fields import SerialField

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    GripperInfoResponse,
    PipetteInfoResponse,
    SetSerialNumber,
    InstrumentInfoRequest,
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
    argnames=["node_id", "info_response_type"],
    argvalues=[
        [NodeId.gripper, GripperInfoResponse],
        [NodeId.pipette_left, PipetteInfoResponse],
    ],
)
@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_set_serial(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    node_id: NodeId,
    info_response_type: Type[MessageDefinition],
) -> None:
    """It should write a serial number and read it back."""
    sns_datacodes = [b"202019072430", b"1234567890\x00\x00"]
    sns = [b"", b""]
    if node_id == NodeId.pipette_left:
        sns = [b"P1KSV" + sns_datacodes[0], b"P3HMV" + sns_datacodes[1]]
    else:
        sns = [b"GP" + sns_datacodes[0], b"GP" + sns_datacodes[1]]
    assert len(sns_datacodes) == len(sns)
    for i in range(len(sns)):
        s = SerialNumberPayload(serial=SerialField(sns[i]))

        await can_messenger.send(node_id=node_id, message=SetSerialNumber(payload=s))
        await can_messenger.send(node_id=node_id, message=InstrumentInfoRequest())
        response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

        assert arbitration_id.parts.originating_node_id == node_id
        assert arbitration_id.parts.message_id == info_response_type.message_id
        assert isinstance(response, GripperInfoResponse) or isinstance(
            response, PipetteInfoResponse
        )
        assert response.payload.serial.value == sns_datacodes[i]
