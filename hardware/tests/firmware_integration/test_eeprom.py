"""Tests for eeprom."""
import asyncio

import pytest
from opentrons_ot3_firmware import NodeId
from opentrons_ot3_firmware.messages.message_definitions import (
    ReadFromEEPromRequest,
    ReadFromEEPromResponse,
    WriteToEEPromRequest,
)
from opentrons_ot3_firmware.messages.payloads import (
    EmptyPayload,
    WriteToEEPromRequestPayload,
)
from opentrons_ot3_firmware.utils import UInt8Field

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback


@pytest.mark.requires_emulator
async def test_read_write(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
) -> None:
    """It should be able to read and write eeprom values."""
    read_message = ReadFromEEPromRequest(payload=EmptyPayload())
    await can_messenger.send(node_id=NodeId.pipette_left, message=read_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromEEPromResponse)
    expected_data = response.payload.serial_number.value + 1

    # Write to the again
    await can_messenger.send(
        node_id=NodeId.pipette_left,
        message=WriteToEEPromRequest(
            payload=WriteToEEPromRequestPayload(serial_number=UInt8Field(expected_data))
        ),
    )

    # Read from eeprom again
    await can_messenger.send(node_id=NodeId.pipette_left, message=read_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromEEPromResponse)
    assert response.payload.serial_number.value == expected_data
