"""Test serial number setting."""
import asyncio

import pytest

from opentrons_hardware.firmware_bindings.messages.fields import SerialField
from opentrons_hardware.pipettes.serials import (
    serial_val_from_parts,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    GripperInfoResponse,
    PipetteInfoResponse,
    SetSerialNumber,
    InstrumentInfoRequest,
)

from opentrons_hardware.firmware_bindings import NodeId, ArbitrationId
from opentrons_hardware.firmware_bindings.constants import PipetteName
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


@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_set_serial_gripper(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
) -> None:
    """It should write a serial number and read it back."""
    node_id = NodeId.gripper
    sns_datacodes = [b"202019072430", b"1234567890\x00\x00"]
    sns = [b"GP" + sns_datacodes[0], b"GP" + sns_datacodes[1]]
    for i in range(len(sns)):
        s = SerialNumberPayload(serial=SerialField(sns[i]))

        await can_messenger.send(node_id=node_id, message=SetSerialNumber(payload=s))
        await can_messenger.send(node_id=node_id, message=InstrumentInfoRequest())
        response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

        assert arbitration_id.parts.originating_node_id == node_id
        assert isinstance(response, GripperInfoResponse)
        assert (
            response.payload.serial.value[: len(sns_datacodes[i])] == sns_datacodes[i]
        )


@pytest.mark.parametrize(
    "name,model,datecode",
    [
        (PipetteName.p1000_single, 31, b"2020190802A02"),
        (PipetteName.p50_multi, 500, b""),
        (PipetteName.p50_single, 0, b"asdasdasdasdasda"),
        (PipetteName.unknown, 0xFFFF, b"\xff" * 16),
    ],
)
@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_set_serial_pipette(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    name: PipetteName,
    model: int,
    datecode: bytes,
) -> None:
    """It should write a serial number and read it back."""
    node_id = NodeId.pipette_left
    serial_bytes = serial_val_from_parts(name, model, datecode)
    s = SerialNumberPayload(serial=SerialField(serial_bytes))

    await can_messenger.send(node_id=node_id, message=SetSerialNumber(payload=s))
    await can_messenger.send(node_id=node_id, message=InstrumentInfoRequest())
    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert arbitration_id.parts.originating_node_id == node_id
    assert isinstance(response, PipetteInfoResponse)
    assert response.payload.name.value == name.value
    assert response.payload.model.value == model
    assert response.payload.serial.value[: len(datecode)] == datecode
