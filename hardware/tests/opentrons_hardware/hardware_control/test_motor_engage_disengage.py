"""Tests for current settings."""
import pytest
from mock import AsyncMock

from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as md,
)
from opentrons_hardware.hardware_control.motor_enable_disable import (
    set_enable_motor,
    set_disable_motor,
    set_enable_tip_motor,
    set_disable_tip_motor,
)


@pytest.fixture
def mock_can_messenger() -> AsyncMock:
    """Mock communication."""
    return AsyncMock()


async def test_set_enable_current(mock_can_messenger: AsyncMock) -> None:
    """It should send a request to enable each node's motor."""
    nodes_to_enable = {NodeId.gantry_x, NodeId.gantry_y}
    await set_enable_motor(mock_can_messenger, nodes_to_enable)
    for node_id in nodes_to_enable:
        mock_can_messenger.ensure_send.assert_any_call(
            node_id=node_id,
            message=md.EnableMotorRequest(),
            expected_nodes=[node_id],
        )


async def test_set_disable_current(mock_can_messenger: AsyncMock) -> None:
    """It should send a request to disable each node's motor."""
    nodes_to_enable = {NodeId.gantry_x, NodeId.gantry_y}
    await set_disable_motor(mock_can_messenger, nodes_to_enable)
    for node_id in nodes_to_enable:
        mock_can_messenger.ensure_send.assert_any_call(
            node_id=node_id,
            message=md.DisableMotorRequest(),
            expected_nodes=[node_id],
        )


async def test_set_enable_tip_motor(mock_can_messenger: AsyncMock) -> None:
    """It should send a request to enable each node's motor."""
    nodes_to_enable = {NodeId.pipette_left, NodeId.gantry_y}
    await set_enable_tip_motor(mock_can_messenger, nodes_to_enable)
    for node_id in nodes_to_enable:
        mock_can_messenger.ensure_send.assert_any_call(
            node_id=node_id,
            message=md.GearEnableMotorRequest(),
            expected_nodes=[node_id],
        )


async def test_set_disable_tip_motor(mock_can_messenger: AsyncMock) -> None:
    """It should send a request to disable each node's motor."""
    nodes_to_enable = {NodeId.gantry_x, NodeId.gantry_y}
    await set_disable_tip_motor(mock_can_messenger, nodes_to_enable)
    for node_id in nodes_to_enable:
        mock_can_messenger.ensure_send.assert_any_call(
            node_id=node_id,
            message=md.GearDisableMotorRequest(),
            expected_nodes=[node_id],
        )
