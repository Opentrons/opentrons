"""Tests for eeprom."""
import asyncio

import pytest
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
from opentrons_hardware.firmware_bindings.utils import UInt8Field

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback


def filter_func(arb: ArbitrationId) -> bool:
    """Message filtering function."""
    return bool(arb.parts.message_id == ReadFromEEPromResponse.message_id)


@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_read_write(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
) -> None:
    """It should be able to read and write eeprom values."""
    read_message = ReadFromEEPromRequest(
        payload=EEPromReadPayload(address=UInt8Field(0), data_length=UInt8Field(10))
    )
    await can_messenger.send(node_id=NodeId.pipette_left, message=read_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromEEPromResponse)
    expected_data = bytes(reversed(response.payload.data.value))

    # Write to the again
    await can_messenger.send(
        node_id=NodeId.pipette_left,
        message=WriteToEEPromRequest(
            payload=EEPromDataPayload(
                address=UInt8Field(0),
                data_length=UInt8Field(10),
                data=EepromDataField(expected_data),
            )
        ),
    )

    # Read from eeprom again
    await can_messenger.send(node_id=NodeId.pipette_left, message=read_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromEEPromResponse)
    assert response.payload.data.value == expected_data
