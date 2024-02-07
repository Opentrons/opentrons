"""Tests for the sensor drivers."""
import pytest
import mock
from typing import Union, List
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]

from unittest.mock import patch
from mock.mock import AsyncMock

from tests.conftest import MockCanMessageNotifier

from opentrons_hardware.firmware_bindings import ArbitrationId, ArbitrationIdParts
from opentrons_hardware.firmware_bindings.constants import SensorType, SensorId, NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt16Field,
    UInt32Field,
    Int32Field,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    BaselineSensorRequest,
    BaselineSensorResponse,
    ReadFromSensorRequest,
    SetSensorThresholdRequest,
    WriteToSensorRequest,
    ReadFromSensorResponse,
    SensorThresholdResponse,
    BindSensorOutputRequest,
    PeripheralStatusRequest,
    PeripheralStatusResponse,
)
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.payloads import (
    BaselineSensorRequestPayload,
    ReadFromSensorRequestPayload,
    WriteToSensorRequestPayload,
    ReadFromSensorResponsePayload,
    SensorThresholdResponsePayload,
    BindSensorOutputRequestPayload,
    PeripheralStatusResponsePayload,
    BaselineSensorResponsePayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorTypeField,
    SensorIdField,
    SensorOutputBindingField,
)
from opentrons_hardware.sensors.types import SensorDataType, EnvironmentSensorDataType
from opentrons_hardware.sensors.sensor_types import (
    CapacitiveSensor,
    PressureSensor,
    EnvironmentSensor,
    BaseSensorType,
    ThresholdSensorType,
)
from opentrons_hardware.sensors.sensor_driver import SensorDriver
from opentrons_hardware.firmware_bindings.constants import SensorOutputBinding


@pytest.fixture
def pressure_sensor() -> PressureSensor:
    """Fixture for pressure sensor driver."""
    return PressureSensor.build(SensorId.S0, NodeId.pipette_left)


@pytest.fixture
def capacitive_sensor() -> CapacitiveSensor:
    """Fixture for capacitive sensor driver."""
    return CapacitiveSensor.build(SensorId.S0, NodeId.pipette_left)


@pytest.fixture
def environment_sensor() -> EnvironmentSensor:
    """Fixture for humidity sensor driver."""
    return EnvironmentSensor.build(SensorId.S0, NodeId.pipette_left)


@pytest.fixture
def sensor_driver() -> SensorDriver:
    """Fixture for humidity sensor driver."""
    return SensorDriver()


@pytest.mark.parametrize(
    argnames=["sensor_type", "message"],
    argvalues=[
        [
            lazy_fixture("pressure_sensor"),
            BaselineSensorRequest(
                payload=BaselineSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.pressure),
                    sensor_id=SensorIdField(SensorId.S0),
                    number_of_reads=UInt16Field(10),
                )
            ),
        ],
        [
            lazy_fixture("capacitive_sensor"),
            BaselineSensorRequest(
                payload=BaselineSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.capacitive),
                    sensor_id=SensorIdField(SensorId.S0),
                    number_of_reads=UInt16Field(10),
                )
            ),
        ],
    ],
)
async def test_polling(
    sensor_driver: SensorDriver, sensor_type: BaseSensorType, message: MessageDefinition
) -> None:
    """Test that a polling function sends the expected message."""
    messenger = mock.AsyncMock(spec=CanMessenger)
    await sensor_driver.get_baseline(messenger, sensor_type, 10, 10)
    messenger.send.assert_called_once_with(
        node_id=sensor_type.sensor.node_id, message=message
    )


@pytest.mark.parametrize(
    argnames=["sensor_type"],
    argvalues=[
        [lazy_fixture("pressure_sensor")],
        [lazy_fixture("capacitive_sensor")],
        [lazy_fixture("environment_sensor")],
    ],
)
async def test_baseline_averaging(
    sensor_driver: SensorDriver,
    sensor_type: BaseSensorType,
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """Test that data is received from the polling function."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if sensor_type.sensor.sensor_type == SensorType.environment:
            can_message_notifier.notify(
                BaselineSensorResponse(
                    payload=BaselineSensorResponsePayload(
                        offset_average=Int32Field(256),
                        sensor_id=SensorIdField(SensorId.S0),
                        sensor=SensorTypeField(SensorType.humidity),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=BaselineSensorResponse.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )
            can_message_notifier.notify(
                BaselineSensorResponse(
                    payload=BaselineSensorResponsePayload(
                        offset_average=Int32Field(256),
                        sensor_id=SensorIdField(SensorId.S0),
                        sensor=SensorTypeField(SensorType.temperature),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=BaselineSensorResponse.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )
        else:
            can_message_notifier.notify(
                BaselineSensorResponse(
                    payload=BaselineSensorResponsePayload(
                        offset_average=Int32Field(256),
                        sensor_id=SensorIdField(SensorId.S0),
                        sensor=SensorTypeField(sensor_type.sensor.sensor_type),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=BaselineSensorResponse.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder
    return_data = await sensor_driver.get_baseline(mock_messenger, sensor_type, 10, 10)
    if isinstance(return_data, EnvironmentSensorDataType):
        expected_list = [
            SensorDataType.build([0x0, 0x1, 0x0], SensorTypeField(0x05)),
            SensorDataType.build([0x0, 0x1, 0x0], SensorTypeField(0x06)),
        ]
        assert return_data == EnvironmentSensorDataType.build(expected_list)
    else:
        assert return_data == SensorDataType.build(
            [0x0, 0x1, 0x0], SensorTypeField(sensor_type.sensor.sensor_type)
        )


@pytest.mark.parametrize(
    argnames=["sensor_type", "message"],
    argvalues=[
        [
            lazy_fixture("pressure_sensor"),
            WriteToSensorRequest(
                payload=WriteToSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.pressure),
                    sensor_id=SensorIdField(SensorId.S0),
                    data=UInt32Field(
                        SensorDataType.build(
                            [0x2, 0x2, 0x0, 0x0], SensorTypeField(SensorType.pressure)
                        ).to_int
                    ),
                    reg_address=UInt8Field(0x0),
                )
            ),
        ],
        [
            lazy_fixture("capacitive_sensor"),
            WriteToSensorRequest(
                payload=WriteToSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.capacitive),
                    sensor_id=SensorIdField(SensorId.S0),
                    data=UInt32Field(
                        SensorDataType.build(
                            [0x2, 0x2, 0x0, 0x0], SensorTypeField(SensorType.capacitive)
                        ).to_int
                    ),
                    reg_address=UInt8Field(0x0),
                )
            ),
        ],
    ],
)
async def test_write(
    sensor_driver: SensorDriver,
    sensor_type: ThresholdSensorType,
    message: MessageDefinition,
) -> None:
    """Check that writing sensor data is successful."""
    data = SensorDataType.build(
        [0x2, 0x2, 0x0, 0x0], SensorTypeField(sensor_type.sensor.sensor_type)
    )
    messenger = mock.AsyncMock(spec=CanMessenger)
    await sensor_driver.write(messenger, sensor_type, data)
    messenger.ensure_send.assert_called_once_with(
        node_id=sensor_type.sensor.node_id,
        message=message,
        expected_nodes=[sensor_type.sensor.node_id],
    )


@pytest.mark.parametrize(
    argnames=["sensor_type", "message"],
    argvalues=[
        [
            lazy_fixture("pressure_sensor"),
            ReadFromSensorRequest(
                payload=ReadFromSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.pressure),
                    sensor_id=SensorIdField(SensorId.S0),
                    offset_reading=UInt8Field(False),
                )
            ),
        ],
        [
            lazy_fixture("capacitive_sensor"),
            ReadFromSensorRequest(
                payload=ReadFromSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.capacitive),
                    sensor_id=SensorIdField(SensorId.S0),
                    offset_reading=UInt8Field(False),
                )
            ),
        ],
        [
            lazy_fixture("environment_sensor"),
            ReadFromSensorRequest(
                payload=ReadFromSensorRequestPayload(
                    sensor=SensorTypeField(SensorType.environment),
                    sensor_id=SensorIdField(SensorId.S0),
                    offset_reading=UInt8Field(False),
                )
            ),
        ],
    ],
)
async def test_read(
    sensor_driver: SensorDriver, sensor_type: BaseSensorType, message: MessageDefinition
) -> None:
    """Test that a read function sends the expected message."""
    messenger = mock.AsyncMock(spec=CanMessenger)
    await sensor_driver.read(messenger, sensor_type, False)
    messenger.send.assert_called_once_with(
        node_id=sensor_type.sensor.node_id, message=message
    )


@pytest.mark.parametrize(
    argnames=["sensor_type"],
    argvalues=[
        [lazy_fixture("pressure_sensor")],
        [lazy_fixture("capacitive_sensor")],
        [lazy_fixture("environment_sensor")],
    ],
)
async def test_receive_data_read(
    sensor_driver: SensorDriver,
    sensor_type: BaseSensorType,
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """Test that data is received from the read function."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if sensor_type.sensor.sensor_type == SensorType.environment:
            # humidity reading
            can_message_notifier.notify(
                ReadFromSensorResponse(
                    payload=ReadFromSensorResponsePayload(
                        sensor_data=Int32Field(256),
                        sensor_id=SensorIdField(SensorId.S0),
                        sensor=SensorTypeField(SensorType.humidity),
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
            # temperature reading
            can_message_notifier.notify(
                ReadFromSensorResponse(
                    payload=ReadFromSensorResponsePayload(
                        sensor_data=Int32Field(50),
                        sensor_id=SensorIdField(SensorId.S0),
                        sensor=SensorTypeField(SensorType.temperature),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=ReadFromSensorResponse.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=NodeId.pipette_left,
                    )
                ),
            )
        else:
            can_message_notifier.notify(
                ReadFromSensorResponse(
                    payload=ReadFromSensorResponsePayload(
                        sensor_data=Int32Field(256),
                        sensor_id=SensorIdField(SensorId.S0),
                        sensor=SensorTypeField(sensor_type.sensor.sensor_type),
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
    return_data = await sensor_driver.read(mock_messenger, sensor_type, False, 10)
    if sensor_type.sensor.sensor_type == SensorType.environment:
        expected_list = [
            SensorDataType.build(Int32Field(256), SensorTypeField(SensorType.humidity)),
            SensorDataType.build(
                Int32Field(50), SensorTypeField(SensorType.temperature)
            ),
        ]
        assert return_data == EnvironmentSensorDataType.build(expected_list)
    else:
        assert return_data == SensorDataType.build(
            [0x0, 0x1, 0x0], SensorTypeField(sensor_type.sensor.sensor_type)
        )


@pytest.mark.parametrize(
    argnames=["sensor_type"],
    argvalues=[[lazy_fixture("pressure_sensor")], [lazy_fixture("capacitive_sensor")]],
)
async def test_threshold(
    sensor_driver: SensorDriver,
    sensor_type: ThresholdSensorType,
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
                        sensor=SensorTypeField(sensor_type.sensor.sensor_type),
                        sensor_id=SensorIdField(SensorId.S0),
                        mode=message.payload.mode,
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=SensorThresholdResponse.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )

    threshold = SensorDataType.build(
        [0x0, 0x5], SensorTypeField(sensor_type.sensor.sensor_type)
    )
    mock_messenger.send.side_effect = responder
    sensor_type.zero_threshold = threshold.to_float()
    return_data = await sensor_driver.send_zero_threshold(
        mock_messenger, sensor_type, 10
    )
    assert return_data == threshold


@pytest.mark.parametrize(
    argnames=["timeout", "sensor_type"],
    argvalues=[
        [1, lazy_fixture("pressure_sensor")],
        [5, lazy_fixture("capacitive_sensor")],
        [5, lazy_fixture("environment_sensor")],
    ],
)
async def test_bind_to_sync(
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
    sensor_driver: SensorDriver,
    sensor_type: BaseSensorType,
    timeout: int,
) -> None:
    """Test for bind_to_sync.

    Tests that bind_to_sync does in fact
    send out a BindSensorOutputRequest.
    """
    async with sensor_driver.bind_output(
        mock_messenger,
        sensor_type,
        [SensorOutputBinding.sync],
    ):
        mock_messenger.send.assert_called_with(
            node_id=sensor_type.sensor.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(sensor_type.sensor.sensor_type),
                    sensor_id=SensorIdField(SensorId.S0),
                    binding=SensorOutputBindingField(SensorOutputBinding.sync),
                )
            ),
        )
    mock_messenger.send.assert_called_with(
        node_id=sensor_type.sensor.node_id,
        message=BindSensorOutputRequest(
            payload=BindSensorOutputRequestPayload(
                sensor=SensorTypeField(sensor_type.sensor.sensor_type),
                sensor_id=SensorIdField(SensorId.S0),
                binding=SensorOutputBindingField(SensorOutputBinding.none),
            )
        ),
    )


@pytest.mark.slow
@pytest.mark.parametrize(
    argnames=["sensor_type", "timeout"],
    argvalues=[
        [lazy_fixture("capacitive_sensor"), 10],
        [lazy_fixture("pressure_sensor"), 2],
        [lazy_fixture("environment_sensor"), 2],
    ],
)
async def test_get_baseline(
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
    sensor_driver: SensorDriver,
    sensor_type: BaseSensorType,
    timeout: int,
) -> None:
    """Test for get_baseline.

    Tests that a BaselineSensorRequest gets sent,
    and reads BaselineSensorResponse message containing the
    correct information.
    """

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if isinstance(message, BaselineSensorRequest):
            if sensor_type.sensor.sensor_type == SensorType.environment:
                can_message_notifier.notify(
                    BaselineSensorResponse(
                        payload=BaselineSensorResponsePayload(
                            offset_average=Int32Field(50),
                            sensor_id=SensorIdField(SensorId.S0),
                            sensor=SensorTypeField(SensorType.humidity),
                        )
                    ),
                    ArbitrationId(
                        parts=ArbitrationIdParts(
                            message_id=BaselineSensorResponse.message_id,
                            node_id=NodeId.host,
                            function_code=0,
                            originating_node_id=node_id,
                        )
                    ),
                )
                can_message_notifier.notify(
                    BaselineSensorResponse(
                        payload=BaselineSensorResponsePayload(
                            offset_average=Int32Field(50),
                            sensor_id=SensorIdField(SensorId.S0),
                            sensor=SensorTypeField(SensorType.temperature),
                        )
                    ),
                    ArbitrationId(
                        parts=ArbitrationIdParts(
                            message_id=BaselineSensorResponse.message_id,
                            node_id=NodeId.host,
                            function_code=0,
                            originating_node_id=node_id,
                        )
                    ),
                )
            else:
                can_message_notifier.notify(
                    BaselineSensorResponse(
                        payload=BaselineSensorResponsePayload(
                            sensor=SensorTypeField(sensor_type.sensor.sensor_type),
                            sensor_id=SensorIdField(SensorId.S0),
                            offset_average=Int32Field(50),
                        )
                    ),
                    ArbitrationId(
                        parts=ArbitrationIdParts(
                            message_id=BaselineSensorResponse.message_id,
                            node_id=node_id,
                            function_code=0,
                            originating_node_id=node_id,
                        )
                    ),
                )

    mock_messenger.send.side_effect = responder
    baseline = await sensor_driver.get_baseline(
        mock_messenger, sensor_type, 100, timeout
    )
    if sensor_type.sensor.sensor_type == SensorType.environment:
        expected_list = [
            SensorDataType.build(Int32Field(50), SensorTypeField(SensorType.humidity)),
            SensorDataType.build(
                Int32Field(50), SensorTypeField(SensorType.temperature)
            ),
        ]
        assert baseline == EnvironmentSensorDataType.build(expected_list)
    else:
        baseline = await sensor_driver.get_baseline(
            mock_messenger, sensor_type, 100, timeout
        )
        assert baseline == SensorDataType.build(
            Int32Field(50), SensorTypeField(sensor_type.sensor.sensor_type)
        )


@pytest.mark.slow
@pytest.mark.parametrize(
    argnames=["sensor_type", "timeout", "data_points"],
    argvalues=[
        [
            lazy_fixture("capacitive_sensor"),
            2,
            [SensorDataType.build(50, SensorTypeField(SensorType.capacitive))],
        ],
        [
            lazy_fixture("pressure_sensor"),
            3,
            [SensorDataType.build(50, SensorTypeField(SensorType.pressure))],
        ],
        [
            lazy_fixture("environment_sensor"),
            3,
            [
                SensorDataType.build(50, SensorTypeField(SensorType.humidity)),
                SensorDataType.build(50, SensorTypeField(SensorType.temperature)),
            ],
        ],
    ],
)
async def test_debug_poll(
    mock_messenger: mock.AsyncMock,
    sensor_driver: SensorDriver,
    sensor_type: BaseSensorType,
    timeout: int,
    data_points: List[SensorDataType],
) -> None:
    """Test for debug poll."""
    async with sensor_driver.bind_output(
        mock_messenger, sensor_type, [SensorOutputBinding.report]
    ):
        with patch.object(
            sensor_driver._scheduler,
            "_multi_wait_for_response",
            new=AsyncMock(return_value=data_points),
        ):

            data = await sensor_driver.get_report(sensor_type, mock_messenger, timeout)
            if isinstance(data, EnvironmentSensorDataType):
                expected_result: Union[
                    EnvironmentSensorDataType, SensorDataType
                ] = EnvironmentSensorDataType.build(data_points)
            else:
                expected_result = data_points[0]
            assert data == expected_result
    mock_messenger.send.assert_called_with(
        node_id=sensor_type.sensor.node_id,
        message=BindSensorOutputRequest(
            payload=BindSensorOutputRequestPayload(
                sensor=SensorTypeField(sensor_type.sensor.sensor_type),
                sensor_id=SensorIdField(SensorId.S0),
                binding=SensorOutputBindingField(SensorOutputBinding.none),
            )
        ),
    )


@pytest.mark.slow
@pytest.mark.parametrize(
    argnames=["sensor_type", "timeout"],
    argvalues=[
        [lazy_fixture("capacitive_sensor"), 2],
        [lazy_fixture("pressure_sensor"), 3],
        [lazy_fixture("environment_sensor"), 2],
    ],
)
async def test_peripheral_status(
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
    sensor_driver: SensorDriver,
    sensor_type: BaseSensorType,
    timeout: int,
) -> None:
    """Test for getting peripheral device status."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if isinstance(message, PeripheralStatusRequest):
            can_message_notifier.notify(
                PeripheralStatusResponse(
                    payload=PeripheralStatusResponsePayload(
                        sensor=SensorTypeField(sensor_type.sensor.sensor_type),
                        sensor_id=SensorIdField(SensorId.S0),
                        status=UInt8Field(0x1),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=PeripheralStatusResponse.message_id,
                        node_id=node_id,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder
    status = await sensor_driver.get_device_status(mock_messenger, sensor_type, timeout)
    assert status
