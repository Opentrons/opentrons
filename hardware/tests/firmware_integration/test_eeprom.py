"""Tests for eeprom."""
import asyncio
from typing import Iterator

import pytest
from _pytest.fixtures import SubRequest

from opentrons_hardware.firmware_bindings import NodeId, ArbitrationId
from opentrons_hardware.firmware_bindings.messages.fields import EepromDataField
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ReadFromEEPromRequest,
    ReadFromEEPromResponse,
    WriteToEEPromRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    EEPromDataPayload,
    EEPromReadPayload,
)
from opentrons_hardware.firmware_bindings.utils import UInt16Field

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback


@pytest.fixture(
    scope="session",
    params=[
        NodeId.gripper,
        NodeId.pipette_left,
    ],
)
def eeprom_node_id(request: SubRequest) -> Iterator[NodeId]:
    """Node with eeprom."""
    yield request.param


def filter_func(arb: ArbitrationId) -> bool:
    """Message filtering function."""
    return bool(arb.parts.message_id == ReadFromEEPromResponse.message_id)


@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
@pytest.mark.parametrize(
    argnames=["address", "data"],
    argvalues=[
        [0, b"abcd"],
        [4, b"12345678"],
        [128, b"9"],
        [128, b"89"],
        [240, b"abcd"],
        [240, b"12345678"],
    ],
)
async def test_read_write(
    eeprom_node_id: NodeId,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    address: int,
    data: bytes,
) -> None:
    """It should be able to read and write eeprom values."""
    await can_messenger.send(
        node_id=eeprom_node_id,
        message=WriteToEEPromRequest(
            payload=EEPromDataPayload(
                address=UInt16Field(address),
                data_length=UInt16Field(len(data)),
                data=EepromDataField(data),
            )
        ),
    )

    read_message = ReadFromEEPromRequest(
        payload=EEPromReadPayload(
            address=UInt16Field(address), data_length=UInt16Field(len(data))
        )
    )
    await can_messenger.send(node_id=eeprom_node_id, message=read_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromEEPromResponse)
    assert response.payload.data.value[: len(data)] == data
    assert response.payload.address.value == address
    assert response.payload.data_length.value == len(data)
