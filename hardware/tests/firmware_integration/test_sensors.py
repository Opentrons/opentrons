"""Tests for eeprom."""
import asyncio

import pytest
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    BaselineSensorRequest,
    ReadFromSensorRequest,
    ReadFromSensorResponse,
    SensorThresholdResponse,
    SetSensorThresholdRequest,
    WriteToSensorRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    ReadFromSensorRequestPayload,
    BaselineSensorRequestPayload,
    SetSensorThresholdRequestPayload,
    WriteToSensorRequestPayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import SensorTypeField
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt16Field,
    UInt32Field,
    Int32Field,
)

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback


@pytest.mark.parametrize(
    argnames=["sensor_type", "register", "data_to_write"],
    argvalues=[
        [SensorType.capacitive, 0x01, 0x5],
        [SensorType.humidity, 0x02, 0x10],
        [SensorType.temperature, 0x00, 0x4],
    ],
)
@pytest.mark.requires_emulator
async def test_read_and_write_from_sensors(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
    register: int,
    data_to_write: int,
) -> None:
    """We should be able to read and write from sensors."""
    format_for_write = (register << 24) | (0x1 << 16) | data_to_write
    print(format_for_write)
    write_message = WriteToSensorRequest(
        payload=WriteToSensorRequestPayload(
            sensor=SensorTypeField(sensor_type),
            data=UInt32Field(data_to_write),
        )
    )
    print(write_message)
    await can_messenger.send(node_id=NodeId.pipette_left, message=write_message)

    read_message = ReadFromSensorRequest(
        payload=ReadFromSensorRequestPayload(
            sensor=SensorTypeField(sensor_type),
            offset_reading=UInt8Field(0),
        )
    )

    await can_messenger.send(node_id=NodeId.pipette_left, message=read_message)
    response, _ = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromSensorResponse)
    assert response.payload.sensor_data == Int32Field(data_to_write)


@pytest.mark.parametrize(
    argnames=["sensor_type", "expected_value"], argvalues=[[SensorType.capacitive, 5]]
)
@pytest.mark.requires_emulator
async def test_baseline_poll_sensors(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
    expected_value: int,
) -> None:
    """We should be able to poll the pressure and capacitive sensor."""
    poll_sensor = BaselineSensorRequest(
        payload=BaselineSensorRequestPayload(
            sensor=SensorTypeField(sensor_type),
            sample_rate=UInt16Field(5),
        )
    )
    await can_messenger.send(node_id=NodeId.pipette_left, message=poll_sensor)

    # Read the value from polling
    await can_messenger.send(
        node_id=NodeId.pipette_left,
        message=ReadFromSensorRequest(
            payload=ReadFromSensorRequestPayload(
                sensor=SensorTypeField(sensor_type),
                offset_reading=UInt8Field(0),
            )
        ),
    )

    response, _ = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, ReadFromSensorResponse)
    assert response.payload.sensor_data.value == expected_value


@pytest.mark.parametrize(argnames=["sensor_type"], argvalues=[[SensorType.capacitive]])
@pytest.mark.requires_emulator
async def test_set_threshold_sensors(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
) -> None:
    """We should be able to set thresholds for the pressure and capacitive sensor."""
    set_threshold = SetSensorThresholdRequest(
        payload=SetSensorThresholdRequestPayload(
            sensor=SensorTypeField(sensor_type), threshold=Int32Field(0x1)
        )
    )
    await can_messenger.send(node_id=NodeId.pipette_left, message=set_threshold)

    response, _ = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, SensorThresholdResponse)
    expected_data = set_threshold.payload.threshold.value

    assert response.payload.threshold.value == Int32Field(expected_data)
