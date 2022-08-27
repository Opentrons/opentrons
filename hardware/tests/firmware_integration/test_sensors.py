"""Tests for eeprom."""
import asyncio

import pytest
from typing import Union, Tuple
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
    SensorThresholdMode,
)
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
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorTypeField,
    SensorIdField,
    SensorThresholdModeField,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt16Field,
    UInt32Field,
    Int32Field,
)

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.sensors.types import SensorDataType


@pytest.mark.parametrize(
    argnames=["sensor_type", "register_address"],
    argvalues=[
        [SensorType.capacitive, 0xFF],
        [SensorType.pressure, 0xC2],
    ],
)
@pytest.mark.requires_emulator
@pytest.mark.skip("need to refactor sensor write command")
async def test_write_to_sensors(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
    register_address: UInt8Field,
) -> None:
    """We should be able to write configuration values to all sensors."""
    data_to_write = UInt32Field(200)
    write_message = WriteToSensorRequest(
        payload=WriteToSensorRequestPayload(
            sensor=SensorTypeField(sensor_type),
            sensor_id=SensorIdField(SensorId.S0),
            data=data_to_write,
            reg_address=register_address,
        )
    )
    await can_messenger.send(node_id=NodeId.pipette_left, message=write_message)


@pytest.mark.parametrize(
    argnames=["sensor_type", "expected_data"],
    argvalues=[
        [SensorType.capacitive, 0.02],
        # Data should be 12.7291 for humidity
        [SensorType.environment, (0.0, 57.67)],
        [SensorType.pressure, 0.02],
    ],
)
@pytest.mark.requires_emulator
async def test_read_from_sensors(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
    expected_data: Union[float, Tuple[float, float]],
) -> None:
    """We should be able to read from all the sensors."""
    # TODO when the data sizing bug is fixed in bit_utils.hpp
    # we should change the humidity sensor expected data
    # back to the correct value.
    read_message = ReadFromSensorRequest(
        payload=ReadFromSensorRequestPayload(
            sensor=SensorTypeField(sensor_type),
            sensor_id=SensorIdField(SensorId.S0),
            offset_reading=UInt8Field(0),
        )
    )

    await can_messenger.send(node_id=NodeId.pipette_left, message=read_message)
    response, _ = await asyncio.wait_for(can_messenger_queue.read(), 3)

    if sensor_type == SensorType.environment and isinstance(expected_data, tuple):
        response2, _ = await asyncio.wait_for(can_messenger_queue.read(), 3)
        assert isinstance(response, ReadFromSensorResponse)
        assert isinstance(response2, ReadFromSensorResponse)
        assert (
            round(
                SensorDataType.build(
                    response.payload.sensor_data, response.payload.sensor
                ).to_float(),
                2,
            )
            == expected_data[0]
        )
        assert (
            round(
                SensorDataType.build(
                    response2.payload.sensor_data, response.payload.sensor
                ).to_float(),
                2,
            )
            == expected_data[1]
        )
    else:
        assert isinstance(response, ReadFromSensorResponse)
        assert (
            round(
                SensorDataType.build(
                    response.payload.sensor_data, response.payload.sensor
                ).to_float(),
                2,
            )
            == expected_data
        )


@pytest.mark.parametrize(
    argnames=["sensor_type", "expected_value"],
    argvalues=[
        [SensorType.environment, (0.0, 57.67)],
    ],
)
@pytest.mark.requires_emulator
async def test_baseline_poll_environment(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
    expected_value: Tuple[float, float],
) -> None:
    """We should be able to poll the pressure and capacitive sensor."""
    poll_sensor = BaselineSensorRequest(
        payload=BaselineSensorRequestPayload(
            sensor=SensorTypeField(sensor_type),
            sensor_id=SensorIdField(SensorId.S0),
            sample_rate=UInt16Field(5),
        )
    )
    await can_messenger.send(node_id=NodeId.pipette_left, message=poll_sensor)

    for response_idx in range(10):
        try:
            response, arbitration_id = await asyncio.wait_for(
                can_messenger_queue.read(), 1
            )
        except Exception as e:
            pytest.fail(f"Did not get response #{response_idx+1}: {str(e)}")
        assert isinstance(response, ReadFromSensorResponse)
        assert response.payload.sensor.value in (
            SensorType.humidity.value,
            SensorType.temperature.value,
        )
        if response.payload.sensor.value == SensorType.temperature.value:
            assert (
                round(
                    SensorDataType.build(
                        response.payload.sensor_data, response.payload.sensor
                    ).to_float(),
                    2,
                )
                == expected_value[1]
            )
        else:
            assert (
                round(
                    SensorDataType.build(
                        response.payload.sensor_data, response.payload.sensor
                    ).to_float(),
                    2,
                )
                == expected_value[0]
            )


@pytest.mark.parametrize(
    argnames=["sensor_type", "expected_value"],
    argvalues=[
        [SensorType.capacitive, 0.02],
    ],
)
@pytest.mark.requires_emulator
async def test_baseline_poll_capacitance(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
    expected_value: float,
) -> None:
    """We should be able to poll the pressure and capacitive sensor."""
    poll_sensor = BaselineSensorRequest(
        payload=BaselineSensorRequestPayload(
            sensor=SensorTypeField(sensor_type),
            sensor_id=SensorIdField(SensorId.S0),
            sample_rate=UInt16Field(5),
        )
    )
    await can_messenger.send(node_id=NodeId.pipette_left, message=poll_sensor)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 5)
    assert isinstance(response, ReadFromSensorResponse)
    assert response.payload.sensor.value == sensor_type.value
    assert (
        round(
            SensorDataType.build(
                response.payload.sensor_data, response.payload.sensor
            ).to_float(),
            2,
        )
        == expected_value
    )


@pytest.mark.parametrize(
    argnames=["sensor_type", "expected_value"],
    argvalues=[
        [SensorType.pressure, 0.02],
    ],
)
@pytest.mark.requires_emulator
async def test_baseline_poll_pressure(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
    expected_value: float,
) -> None:
    """We should be able to poll the pressure and capacitive sensor."""
    poll_sensor = BaselineSensorRequest(
        payload=BaselineSensorRequestPayload(
            sensor=SensorTypeField(sensor_type),
            sensor_id=SensorIdField(SensorId.S0),
            sample_rate=UInt16Field(5),
        )
    )
    await can_messenger.send(node_id=NodeId.pipette_left, message=poll_sensor)
    await can_messenger.send(
        node_id=NodeId.pipette_left,
        message=ReadFromSensorRequest(
            payload=ReadFromSensorRequestPayload(
                sensor=SensorTypeField(sensor_type),
                sensor_id=SensorIdField(SensorId.S0),
                offset_reading=UInt8Field(0),
            )
        ),
    )

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)
    assert isinstance(response, ReadFromSensorResponse)
    assert response.payload.sensor.value == sensor_type.value
    assert (
        round(
            SensorDataType.build(
                response.payload.sensor_data, response.payload.sensor
            ).to_float(),
            2,
        )
        == expected_value
    )


@pytest.mark.parametrize(
    argnames=["sensor_type"], argvalues=[[SensorType.capacitive], [SensorType.pressure]]
)
@pytest.mark.requires_emulator
async def test_set_threshold_sensors(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    sensor_type: SensorType,
) -> None:
    """We should be able to set thresholds for the pressure and capacitive sensor."""
    set_threshold = SetSensorThresholdRequest(
        payload=SetSensorThresholdRequestPayload(
            sensor=SensorTypeField(sensor_type),
            sensor_id=SensorIdField(SensorId.S0),
            threshold=Int32Field(0x1),
            mode=SensorThresholdModeField(SensorThresholdMode.absolute.value),
        )
    )
    await can_messenger.send(node_id=NodeId.pipette_left, message=set_threshold)

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)
    assert isinstance(response, SensorThresholdResponse)
    expected_data = set_threshold.payload.threshold.value

    assert response.payload.threshold.value == expected_data
