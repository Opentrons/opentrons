"""Test serial number setting."""
import asyncio

import pytest

from opentrons_hardware.firmware_bindings.messages.fields import SerialField
from opentrons_hardware.instruments.pipettes.serials import (
    serial_val_from_parts,
)
from opentrons_hardware.instruments.gripper.serials import (  # noqa: F401
    gripper_serial_val_from_parts,
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


# TODO: (2022-11-15 AA) Enable this test when the gripper EEPROM rework is complete
# @pytest.mark.parametrize(
#     "model,datecode",
#     [
#         (31, b"2020190802A02"),
#         (500, b""),
#         (0, b"asdasdasdasdasda"),
#         (0xFFFF, b"\xff" * 16),
#     ],
# )
# @pytest.mark.requires_emulator
# @pytest.mark.can_filter_func.with_args(filter_func)
# async def test_set_serial_gripper(
#     can_messenger: CanMessenger,
#     can_messenger_queue: WaitableCallback,
#     model: int,
#     datecode: bytes,
# ) -> None:
#     """It should write a serial number and read it back."""
#     node_id = NodeId.gripper
#     gripper_serial = gripper_serial_val_from_parts(model, datecode)
#     s = SerialNumberPayload(serial=SerialField(gripper_serial))
#     await can_messenger.send(node_id=node_id, message=SetSerialNumber(payload=s))
#     await can_messenger.send(node_id=node_id, message=InstrumentInfoRequest())
#     response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)
#     assert arbitration_id.parts.originating_node_id == node_id
#     assert isinstance(response, GripperInfoResponse)
#     assert response.payload.model.value == model
#     assert response.payload.serial.value[: len(datecode)] == datecode


# TODO: (2022-11-15 AA) This tests the temporary serial number for the gripper
@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_temp_serial_gripper(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
) -> None:
    """It should write a serial number and read it back."""
    node_id = NodeId.gripper
    temp_model = 1
    temp_serial = b"20221115A01"

    await can_messenger.send(node_id=node_id, message=InstrumentInfoRequest())
    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert arbitration_id.parts.originating_node_id == node_id
    assert isinstance(response, GripperInfoResponse)
    assert response.payload.model.value == temp_model
    assert response.payload.serial.value[: len(temp_serial)] == temp_serial


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
