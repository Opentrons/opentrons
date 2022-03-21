"""Tests for the sensor drivers."""
import pytest
import mock
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]


from tests.conftest import MockCanMessageNotifier

from opentrons_hardware.sensors import fdc1004, hdc2080, mmr920C04, sensor_abc
from opentrons_hardware.firmware_bindings import ArbitrationId, ArbitrationIdParts
from opentrons_hardware.firmware_bindings.constants import SensorType, NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt16Field,
    UInt32Field,
    Int32Field,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    BaselineSensorRequest,
    ReadFromSensorRequest,
    SetSensorThresholdRequest,
    WriteToSensorRequest,
    ReadFromSensorResponse,
    SensorThresholdResponse,
)
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.payloads import (
    BaselineSensorRequestPayload,
    ReadFromSensorRequestPayload,
    WriteToSensorRequestPayload,
    ReadFromSensorResponsePayload,
    SensorThresholdResponsePayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import SensorTypeField
from opentrons_hardware.sensors.utils import SensorDataType


@pytest.fixture
def pressure_sensor() -> mmr920C04.PressureSensor:
    """Fixture for pressure sensor driver."""
    return mmr920C04.PressureSensor()


@pytest.fixture
def capacitive_sensor() -> fdc1004.CapacitiveSensor:
    """Fixture for capacitive sensor driver."""
    return fdc1004.CapacitiveSensor()


@pytest.fixture
def temperature_sensor() -> hdc2080.EnvironmentSensor:
    """Fixture for temperature sensor driver."""
    return hdc2080.EnvironmentSensor(SensorType.temperature)


@pytest.fixture
def humidity_sensor() -> hdc2080.EnvironmentSensor:
    """Fixture for humidity sensor driver."""
    return hdc2080.EnvironmentSensor(SensorType.humidity)


@pytest.mark.parametrize(
    argnames=["sensor", "node", "message"],
    argvalues=[
        [
            lazy_fixture("pressure_sensor"),
            NodeId.pipette_left,
            BaselineSensorRequest(
                payload=BaselineSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.pressure),
                    sample_rate=UInt16Field(10),
                )
            ),
        ],
        [
            lazy_fixture("capacitive_sensor"),
            NodeId.pipette_left,
            BaselineSensorRequest(
                payload=BaselineSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.capacitive),
                    sample_rate=UInt16Field(10),
                )
            ),
        ],
    ],
)
async def test_polling(
    sensor: sensor_abc.AbstractAdvancedSensor, node: NodeId, message: MessageDefinition
) -> None:
    """Test that a polling function sends the expected message."""
    messenger = mock.AsyncMock(spec=CanMessenger)
    await sensor.poll(messenger, node, 10)
    messenger.send.assert_called_once_with(node_id=node, message=message)


@pytest.mark.parametrize(
    argnames=["sensor"],
    argvalues=[
        [lazy_fixture("pressure_sensor")],
        [lazy_fixture("capacitive_sensor")],
    ],
)
async def test_receive_data_polling(
    sensor: sensor_abc.AbstractAdvancedSensor,
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """Test that data is received from the polling function."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        can_message_notifier.notify(
            ReadFromSensorResponse(
                payload=ReadFromSensorResponsePayload(
                    sensor_data=Int32Field(256),
                    sensor=SensorTypeField(sensor._sensor_type),
                )
            ),
            ArbitrationId(
                parts=ArbitrationIdParts(
                    message_id=ReadFromSensorResponse.message_id,
                    node_id=NodeId.host,
                    function_code=0,
                    originating_node_id=node_id,
                )
            ),
        )

    mock_messenger.send.side_effect = responder
    return_data = await sensor.poll(mock_messenger, NodeId.pipette_left, 10)
    assert return_data == SensorDataType.build([0x0, 0x1, 0x0])


@pytest.mark.parametrize(
    argnames=["sensor", "node", "message"],
    argvalues=[
        [
            lazy_fixture("pressure_sensor"),
            NodeId.pipette_left,
            WriteToSensorRequest(
                payload=WriteToSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.pressure),
                    data=UInt32Field(SensorDataType.build([0x2, 0x2, 0x0, 0x0]).to_int),
                )
            ),
        ],
        [
            lazy_fixture("capacitive_sensor"),
            NodeId.pipette_left,
            WriteToSensorRequest(
                payload=WriteToSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.capacitive),
                    data=UInt32Field(SensorDataType.build([0x2, 0x2, 0x0, 0x0]).to_int),
                )
            ),
        ],
        [
            lazy_fixture("temperature_sensor"),
            NodeId.pipette_left,
            WriteToSensorRequest(
                payload=WriteToSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.temperature),
                    data=UInt32Field(SensorDataType.build([0x2, 0x2, 0x0, 0x0]).to_int),
                )
            ),
        ],
        [
            lazy_fixture("humidity_sensor"),
            NodeId.pipette_left,
            WriteToSensorRequest(
                payload=WriteToSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.humidity),
                    data=UInt32Field(SensorDataType.build([0x2, 0x2, 0x0, 0x0]).to_int),
                )
            ),
        ],
    ],
)
async def test_write(
    sensor: sensor_abc.AbstractAdvancedSensor, node: NodeId, message: MessageDefinition
) -> None:
    """Check that writing sensor data is successful."""
    data = SensorDataType.build([0x2, 0x2, 0x0, 0x0])
    messenger = mock.AsyncMock(spec=CanMessenger)
    await sensor.write(messenger, NodeId.pipette_left, data)
    messenger.send.assert_called_once_with(node_id=node, message=message)


@pytest.mark.parametrize(
    argnames=["sensor", "node", "message"],
    argvalues=[
        [
            lazy_fixture("pressure_sensor"),
            NodeId.pipette_left,
            ReadFromSensorRequest(
                payload=ReadFromSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.pressure),
                    offset_reading=UInt8Field(False),
                )
            ),
        ],
        [
            lazy_fixture("capacitive_sensor"),
            NodeId.pipette_left,
            ReadFromSensorRequest(
                payload=ReadFromSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.capacitive),
                    offset_reading=UInt8Field(False),
                )
            ),
        ],
        [
            lazy_fixture("temperature_sensor"),
            NodeId.pipette_left,
            ReadFromSensorRequest(
                payload=ReadFromSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.temperature),
                    offset_reading=UInt8Field(False),
                )
            ),
        ],
        [
            lazy_fixture("humidity_sensor"),
            NodeId.pipette_left,
            ReadFromSensorRequest(
                payload=ReadFromSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.humidity),
                    offset_reading=UInt8Field(False),
                )
            ),
        ],
    ],
)
async def test_read(
    sensor: sensor_abc.AbstractAdvancedSensor, node: NodeId, message: MessageDefinition
) -> None:
    """Test that a read function sends the expected message."""
    messenger = mock.AsyncMock(spec=CanMessenger)
    await sensor.read(messenger, node, False)
    messenger.send.assert_called_once_with(node_id=node, message=message)


@pytest.mark.parametrize(
    argnames=["sensor"],
    argvalues=[
        [lazy_fixture("pressure_sensor")],
        [lazy_fixture("capacitive_sensor")],
        [lazy_fixture("temperature_sensor")],
        [lazy_fixture("humidity_sensor")],
    ],
)
async def test_receive_data_read(
    sensor: sensor_abc.AbstractAdvancedSensor,
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """Test that data is received from the read function."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        can_message_notifier.notify(
            ReadFromSensorResponse(
                payload=ReadFromSensorResponsePayload(
                    sensor_data=Int32Field(256),
                    sensor=SensorTypeField(sensor._sensor_type),
                )
            ),
            ArbitrationId(
                parts=ArbitrationIdParts(
                    message_id=ReadFromSensorResponse.message_id,
                    node_id=NodeId.host,
                    function_code=0,
                    originating_node_id=node_id,
                )
            ),
        )

    mock_messenger.send.side_effect = responder
    return_data = await sensor.read(mock_messenger, NodeId.pipette_left, False, 10)
    assert return_data == SensorDataType.build([0x0, 0x1, 0x0])


@pytest.mark.parametrize(
    argnames=["sensor"],
    argvalues=[[lazy_fixture("pressure_sensor")], [lazy_fixture("capacitive_sensor")]],
)
async def test_threshold(
    sensor: sensor_abc.AbstractAdvancedSensor,
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """Test that data is received from the threshold function."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if isinstance(message, SetSensorThresholdRequest):
            can_message_notifier.notify(
                SensorThresholdResponse(
                    payload=SensorThresholdResponsePayload(
                        threshold=message.payload.threshold,
                        sensor=SensorTypeField(sensor._sensor_type),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=ReadFromSensorResponse.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )

    threshold = SensorDataType.build([0x0, 0x5])
    mock_messenger.send.side_effect = responder
    return_data = await sensor.send_zero_threshold(
        mock_messenger, NodeId.pipette_left, threshold, 10
    )
    assert return_data == threshold
