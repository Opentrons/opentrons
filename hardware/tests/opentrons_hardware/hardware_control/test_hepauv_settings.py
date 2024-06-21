"""Tests for hepa/uv settings."""

from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
import pytest
from mock import AsyncMock
from typing import List, Tuple, cast

from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as md,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    SetHepaFanStateRequestPayload,
    GetHepaFanStatePayloadResponse,
    SetHepaUVStateRequestPayload,
    GetHepaUVStatePayloadResponse,
)
from opentrons_hardware.hardware_control.hepa_uv_settings import (
    set_hepa_fan_state,
    set_hepa_uv_state,
    get_hepa_fan_state,
    get_hepa_uv_state,
    HepaFanState,
    HepaUVState,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt16Field,
    UInt32Field,
)
from tests.conftest import CanLoopback


@pytest.fixture
def mock_can_messenger() -> AsyncMock:
    """Mock communication."""
    return AsyncMock()


def create_hepa_fan_state_response(
    fan_on: bool, duty_cycle: int, fan_rpm: int
) -> MessageDefinition:
    """Create a GetHepaFanStateResponse."""
    return md.GetHepaFanStateResponse(
        payload=GetHepaFanStatePayloadResponse(
            fan_on=UInt8Field(fan_on),
            duty_cycle=UInt32Field(duty_cycle),
            fan_rpm=UInt16Field(fan_rpm),
        )
    )


def create_hepa_uv_state_response(
    light_on: bool,
    duration: int,
    remaining_time: int,
    uv_current: int,
    safety_relay_active: bool,
) -> MessageDefinition:
    """Create a GetHepaUVStateResponse."""
    return md.GetHepaUVStateResponse(
        payload=GetHepaUVStatePayloadResponse(
            uv_light_on=UInt8Field(light_on),
            uv_duration_s=UInt32Field(duration),
            remaining_time_s=UInt32Field(remaining_time),
            uv_current_ma=UInt16Field(uv_current),
            safety_relay_active=UInt8Field(safety_relay_active),
        )
    )


@pytest.mark.parametrize(
    ("fan_on", "duty_cycle"), [[True, 0], [True, 75], [False, 0], [False, 75]]
)
async def test_set_hepa_fan_state(
    mock_can_messenger: AsyncMock,
    fan_on: bool,
    duty_cycle: int,
) -> None:
    """We should set the fan state and duty cycle for the hepa/uv node."""
    await set_hepa_fan_state(mock_can_messenger, fan_on, duty_cycle)
    mock_can_messenger.ensure_send.assert_any_call(
        node_id=NodeId.hepa_uv,
        message=md.SetHepaFanStateRequest(
            payload=SetHepaFanStateRequestPayload(
                fan_on=UInt8Field(fan_on),
                duty_cycle=UInt32Field(duty_cycle),
            )
        ),
        expected_nodes=[NodeId.hepa_uv],
    )


@pytest.mark.parametrize(
    ("light_on", "duration"), [[True, 0], [True, 900], [False, 3600], [False, 7200]]
)
async def test_set_hepa_uv_state(
    mock_can_messenger: AsyncMock,
    light_on: bool,
    duration: int,
) -> None:
    """We should set the uv light state and duration for the hepa/uv node."""
    await set_hepa_uv_state(mock_can_messenger, light_on, duration)
    mock_can_messenger.ensure_send.assert_any_call(
        node_id=NodeId.hepa_uv,
        message=md.SetHepaUVStateRequest(
            payload=SetHepaUVStateRequestPayload(
                uv_light_on=UInt8Field(light_on),
                uv_duration_s=UInt32Field(duration),
            )
        ),
        expected_nodes=[NodeId.hepa_uv],
    )


@pytest.mark.parametrize(
    "response",
    [
        (NodeId.host, create_hepa_fan_state_response(True, 50, 4540), NodeId.hepa_uv),
        (NodeId.host, create_hepa_fan_state_response(True, 75, 6790), NodeId.hepa_uv),
        (NodeId.host, create_hepa_fan_state_response(True, 0, 0), NodeId.hepa_uv),
        (NodeId.host, create_hepa_fan_state_response(False, 75, 0), NodeId.hepa_uv),
        (NodeId.host, create_hepa_fan_state_response(False, 100, 0), NodeId.hepa_uv),
    ],
)
async def test_get_hepa_fan_state(
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
    response: Tuple[NodeId, MessageDefinition, NodeId],
) -> None:
    """We should get the fan state and duty cycle for the hepa/uv node."""

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, md.GetHepaFanStateRequest):
            return [response]
        return []

    message_send_loopback.add_responder(responder)

    res = await get_hepa_fan_state(mock_messenger)

    # Make sure we send out the request
    mock_messenger.send.assert_any_call(
        node_id=NodeId.hepa_uv,
        message=md.GetHepaFanStateRequest(),
    )

    # Make sure the result matches the payload response
    payload = cast(GetHepaFanStatePayloadResponse, response[1].payload)
    assert (
        HepaFanState(
            bool(payload.fan_on.value),
            int(payload.duty_cycle.value),
            int(payload.fan_rpm.value),
        )
        == res
    )


@pytest.mark.parametrize(
    "response",
    [
        (
            NodeId.host,
            create_hepa_uv_state_response(True, 900, 300, 3300, True),
            NodeId.hepa_uv,
        ),
        (
            NodeId.host,
            create_hepa_uv_state_response(True, 0, 0, 33000, True),
            NodeId.hepa_uv,
        ),
        (
            NodeId.host,
            create_hepa_uv_state_response(True, 0, 0, 33000, False),
            NodeId.hepa_uv,
        ),
        (
            NodeId.host,
            create_hepa_uv_state_response(False, 0, 0, 0, True),
            NodeId.hepa_uv,
        ),
        (
            NodeId.host,
            create_hepa_uv_state_response(False, 900, 0, 0, False),
            NodeId.hepa_uv,
        ),
    ],
)
async def test_get_hepa_uv_state(
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
    response: Tuple[NodeId, MessageDefinition, NodeId],
) -> None:
    """We should get the uv light state and duration for the hepa/uv node."""

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, md.GetHepaUVStateRequest):
            return [response]
        return []

    message_send_loopback.add_responder(responder)

    res = await get_hepa_uv_state(mock_messenger)

    # Make sure we send out the request
    mock_messenger.send.assert_any_call(
        node_id=NodeId.hepa_uv,
        message=md.GetHepaUVStateRequest(),
    )

    # Make sure the result matches the payload response
    payload = cast(GetHepaUVStatePayloadResponse, response[1].payload)
    assert (
        HepaUVState(
            bool(payload.uv_light_on.value),
            int(payload.uv_duration_s.value),
            int(payload.remaining_time_s.value),
            int(payload.uv_current_ma.value),
            bool(payload.safety_relay_active.value),
        )
        == res
    )
