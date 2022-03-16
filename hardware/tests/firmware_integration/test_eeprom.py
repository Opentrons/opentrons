"""Tests for eeprom."""
import asyncio

import pytest
from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ReadFromEEPromRequest,
    ReadFromEEPromResponse,
    WriteToEEPromRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    WriteToEEPromRequestPayload,
)
from opentrons_hardware.firmware_bindings.utils import UInt16Field

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback


@pytest.mark.skip("eeprom simulator is broken")
@pytest.mark.requires_emulator
async def test_read_write(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
) -> None:
    """It should be able to read and write eeprom values."""
    read_message = ReadFromEEPromRequest()
    await can_messenger.send(node_id=NodeId.pipette_left, message=read_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromEEPromResponse)
    expected_data = response.payload.serial_number.value + 1

    # Write to the again
    await can_messenger.send(
        node_id=NodeId.pipette_left,
        message=WriteToEEPromRequest(
            payload=WriteToEEPromRequestPayload(
                serial_number=UInt16Field(expected_data)
            )
        ),
    )

    # Read from eeprom again
    await can_messenger.send(node_id=NodeId.pipette_left, message=read_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromEEPromResponse)
    assert response.payload.serial_number.value == expected_data
