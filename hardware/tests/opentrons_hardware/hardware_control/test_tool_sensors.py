"""Test the tool-sensor coordination code."""
import logging
from mock import patch, AsyncMock, ANY
import pytest
from contextlib import asynccontextmanager
from typing import Iterator, List, Tuple, AsyncIterator, Any
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ExecuteMoveGroupRequest,
    MoveCompleted,
)
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.payloads import MoveCompletedPayload
from opentrons_hardware.firmware_bindings.utils import UInt8Field, UInt32Field
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger


from tests.conftest import CanLoopback

from opentrons_hardware.hardware_control.tool_sensors import (
    capacitive_probe,
    ProbeTarget,
)
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorType,
    SensorThresholdMode,
)
from opentrons_hardware.sensors.scheduler import SensorScheduler
from opentrons_hardware.sensors.utils import (
    SensorThresholdInformation,
    SensorInformation,
    SensorDataType,
)


@pytest.fixture
def mock_sensor_threshold() -> Iterator[AsyncMock]:
    """Mock setting of sensor thresholds."""
    with patch(
        "opentrons_hardware.sensors.scheduler.SensorScheduler.send_threshold",
        AsyncMock(spec=SensorScheduler.send_threshold),
    ) as mock_threshold:

        async def echo_value(
            info: SensorThresholdInformation, messenger: CanMessenger
        ) -> SensorDataType:
            if info.mode == SensorThresholdMode.auto_baseline:
                return SensorDataType.build(11)
            return info.data

        mock_threshold.side_effect = echo_value
        yield mock_threshold


@pytest.fixture
def mock_bind_sync() -> Iterator[AsyncMock]:
    """Mock sensor output binding."""
    mock_bind = AsyncMock(spec=SensorScheduler.bind_sync)

    @asynccontextmanager
    async def _fake_bind(*args: Any, **kwargs: Any) -> AsyncIterator[None]:
        await mock_bind(*args, **kwargs)
        yield

    with patch(
        "opentrons_hardware.sensors.scheduler.SensorScheduler.bind_sync",
        _fake_bind,
    ):
        yield mock_bind


@pytest.mark.parametrize(
    "target_node,motor_node",
    [
        (NodeId.pipette_left, NodeId.head_l),
        (NodeId.pipette_right, NodeId.head_r),
        (NodeId.gripper, NodeId.gripper_z),
    ],
)
async def test_capacitive_probe(
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
    mock_sensor_threshold: AsyncMock,
    mock_bind_sync: AsyncMock,
    target_node: ProbeTarget,
    motor_node: NodeId,
    caplog: Any,
) -> None:
    """Test that capacitive_probe targets the right nodes."""
    caplog.set_level(logging.INFO)

    def move_responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, ExecuteMoveGroupRequest):
            return [
                (
                    NodeId.host,
                    MoveCompleted(
                        payload=MoveCompletedPayload(
                            group_id=UInt8Field(0),
                            seq_id=UInt8Field(0),
                            current_position_um=UInt32Field(10000),
                            encoder_position=UInt32Field(10000),
                            ack_id=UInt8Field(0),
                        )
                    ),
                    motor_node,
                )
            ]
        else:
            return []

    message_send_loopback.add_responder(move_responder)

    result = await capacitive_probe(mock_messenger, target_node, 10, 10)
    assert result == 10  # this comes from the current_position_um above
    # this mock assert is annoying because something's __eq__ doesn't work
    assert mock_sensor_threshold.call_args_list[0][0][0] == SensorThresholdInformation(
        sensor_type=SensorType.capacitive,
        node_id=target_node,
        data=SensorDataType.build(1.0),
        mode=SensorThresholdMode.auto_baseline,
    )
    # this mock assert is annoying because, see below
    mock_bind_sync.assert_called_once_with(
        ANY,  # this is a mock of a function on a class not a method so this is self
        SensorInformation(sensor_type=SensorType.capacitive, node_id=target_node),
        ANY,
        log=ANY,
    )
