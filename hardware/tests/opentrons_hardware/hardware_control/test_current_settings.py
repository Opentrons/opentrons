"""Tests for current settings."""
import pytest
from mock import AsyncMock
from typing import Dict, Tuple

from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as md,
)
from opentrons_hardware.firmware_bindings.messages.payloads import MotorCurrentPayload
from opentrons_hardware.hardware_control.current_settings import (
    set_currents,
    set_hold_current,
    set_run_current,
    CompleteCurrentSettings,
    PartialCurrentSettings,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt32Field,
)


@pytest.fixture
def current_settings() -> CompleteCurrentSettings:
    """Current settings from default ot3 config."""
    return {
        NodeId.gantry_x: (0.1, 1.1),
        NodeId.gantry_y: (0.2, 1.2),
        NodeId.pipette_left: (0.3, 1.3),
        NodeId.pipette_right: (0.4, 1.4),
    }


@pytest.fixture
def partial_current_settings() -> PartialCurrentSettings:
    """Current settings from default ot3 config."""
    return {
        NodeId.gantry_x: 0.11,
        NodeId.gantry_y: 0.222,
        NodeId.pipette_left: 0.3333,
        NodeId.pipette_right: 0.44444,
    }


@pytest.fixture
def current_settings_in_uint32() -> Dict[NodeId, Tuple[UInt32Field, UInt32Field]]:
    """Current settings from default ot3 config."""
    return {
        NodeId.gantry_x: (UInt32Field(6553), UInt32Field(72089)),
        NodeId.gantry_y: (UInt32Field(13107), UInt32Field(78643)),
        NodeId.pipette_left: (UInt32Field(19660), UInt32Field(85196)),
        NodeId.pipette_right: (UInt32Field(26214), UInt32Field(91750)),
    }


@pytest.fixture
def partial_current_settings_in_uint32() -> Dict[NodeId, UInt32Field]:
    """Current settings from default ot3 config."""
    return {
        NodeId.gantry_x: UInt32Field(7208),
        NodeId.gantry_y: UInt32Field(14548),
        NodeId.pipette_left: UInt32Field(21843),
        NodeId.pipette_right: UInt32Field(29126),
    }


@pytest.fixture
def mock_can_messenger() -> AsyncMock:
    """Mock communication."""
    return AsyncMock()


async def test_complete_current_settings(
    mock_can_messenger: AsyncMock,
    current_settings: CompleteCurrentSettings,
    current_settings_in_uint32: Dict[NodeId, Tuple[UInt32Field, UInt32Field]],
) -> None:
    """It should send correct hold and run current to the correct nodes."""
    await set_currents(mock_can_messenger, current_settings)
    for node_id, currents in current_settings_in_uint32.items():
        mock_can_messenger.send.assert_any_call(
            node_id=node_id,
            message=md.WriteMotorCurrentRequest(
                payload=MotorCurrentPayload(
                    hold_current=currents[0],
                    run_current=currents[1],
                )
            ),
        )


async def test_send_hold_current_only(
    mock_can_messenger: AsyncMock,
    partial_current_settings: PartialCurrentSettings,
    partial_current_settings_in_uint32: Dict[NodeId, UInt32Field],
) -> None:
    """It should send correct hold current only to the correct nodes."""
    await set_hold_current(mock_can_messenger, partial_current_settings)
    for node_id, current in partial_current_settings_in_uint32.items():
        mock_can_messenger.send.assert_any_call(
            node_id=node_id,
            message=md.WriteMotorCurrentRequest(
                payload=MotorCurrentPayload(
                    hold_current=current,
                    run_current=UInt32Field(0),
                )
            ),
        )


async def test_send_run_current_only(
    mock_can_messenger: AsyncMock,
    partial_current_settings: PartialCurrentSettings,
    partial_current_settings_in_uint32: Dict[NodeId, UInt32Field],
) -> None:
    """It should send correct run current only to the correct nodes."""
    await set_run_current(mock_can_messenger, partial_current_settings)
    for node_id, current in partial_current_settings_in_uint32.items():
        mock_can_messenger.send.assert_any_call(
            node_id=node_id,
            message=md.WriteMotorCurrentRequest(
                payload=MotorCurrentPayload(
                    hold_current=UInt32Field(0),
                    run_current=current,
                )
            ),
        )
