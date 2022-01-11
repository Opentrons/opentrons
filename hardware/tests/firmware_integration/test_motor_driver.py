"""Tests for motor drivers."""
import asyncio
from typing import Tuple

import pytest
from opentrons_ot3_firmware import NodeId, ArbitrationId
from opentrons_ot3_firmware.messages.message_definitions import (
    ReadMotorDriverRequest,
    ReadMotorDriverResponse,
    WriteMotorDriverRegister,
)
from opentrons_ot3_firmware.messages import MessageDefinition
from opentrons_ot3_firmware.messages.payloads import (
    MotorDriverRegisterPayload,
    MotorDriverRegisterDataPayload,
)
from opentrons_ot3_firmware.utils import UInt8Field, UInt32Field

from opentrons_hardware.drivers.can_bus import CanMessenger


@pytest.mark.requires_emulator
async def test_read_write(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: "asyncio.Queue[Tuple[MessageDefinition, ArbitrationId]]",
    motor_node_id: NodeId,
) -> None:
    """It should be able to read and write motor driver registers."""
    register = 1

    # Read from a register
    read_reg_message = ReadMotorDriverRequest(
        payload=MotorDriverRegisterPayload(reg_addr=UInt8Field(register))
    )
    await can_messenger.send(node_id=motor_node_id, message=read_reg_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.get(), 1)

    assert isinstance(response, ReadMotorDriverResponse)
    assert response.payload.reg_addr.value == register

    expected_data = response.payload.data.value + 1

    # Write to the again
    await can_messenger.send(
        node_id=motor_node_id,
        message=WriteMotorDriverRegister(
            payload=MotorDriverRegisterDataPayload(
                reg_addr=UInt8Field(register), data=UInt32Field(expected_data)
            )
        ),
    )

    # Read from the register again
    await can_messenger.send(node_id=motor_node_id, message=read_reg_message)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.get(), 1)

    assert isinstance(response, ReadMotorDriverResponse)
    assert response.payload.reg_addr.value == register
    assert response.payload.data.value == expected_data
