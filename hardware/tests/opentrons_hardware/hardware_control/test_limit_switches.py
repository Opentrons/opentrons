"""Test the limit switches submodule."""
import pytest
import asyncio
from typing import List, Callable
from mock import AsyncMock

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings import (
    ArbitrationId,
    ArbitrationIdParts,
    utils,
)
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
    message_definitions,
    payloads,
)
from opentrons_hardware.firmware_bindings.constants import NodeId

from opentrons_hardware.hardware_control.limit_switches import get_limit_switches


@pytest.fixture
def mock_can_messenger() -> AsyncMock:
    """Mock communication."""
    return AsyncMock(spec=CanMessenger)


class MockStatusResponder:
    """A harness that will automatically send limit switch responses."""

    def __init__(
        self, mock_messenger: AsyncMock, respond_with_nodes: List[int]
    ) -> None:
        """Build the status responder."""
        self._mock_messenger = mock_messenger
        self._callbacks: List[Callable[[MessageDefinition, ArbitrationId], None]] = []
        self._mock_messenger.add_listener.side_effect = self.add_callback
        self._mock_messenger.send.side_effect = self.send
        self._respond_with_nodes = respond_with_nodes

    def add_callback(
        self, callback: Callable[[MessageDefinition, ArbitrationId], None]
    ) -> None:
        """Wrap the add_callback mock method."""
        self._callbacks.append(callback)

    def send(self, node_id: NodeId, message: MessageDefinition) -> None:
        """Wrap the send method to send predefined callbacks."""
        assert self._callbacks
        for callback in self._callbacks:
            for node in self._respond_with_nodes:
                response = message_definitions.ReadLimitSwitchResponse(
                    payload=payloads.GetLimitSwitchResponse(
                        switch_status=utils.UInt8Field(0),
                    )
                )
                asyncio.get_running_loop().call_soon(
                    callback,
                    response,
                    ArbitrationId(
                        parts=ArbitrationIdParts(
                            function_code=0,
                            node_id=NodeId.host.value,
                            originating_node_id=node,
                            message_id=response.message_id,
                        )
                    ),
                )


async def test_get_limit_switch_states(mock_can_messenger: AsyncMock) -> None:
    """Test that if the exact specified nodes exist, getting limit switch statuses works."""
    _ = MockStatusResponder(mock_can_messenger, [NodeId.gantry_x.value])
    switch_states = await asyncio.wait_for(
        get_limit_switches(mock_can_messenger, {NodeId.gantry_x}), 2.0
    )
    assert switch_states == {NodeId.gantry_x: 0}

    # We should have sent a request
    mock_can_messenger.send.assert_called_once_with(
        node_id=NodeId.gantry_x,
        message=message_definitions.ReadLimitSwitchRequest(),
    )
    # we should have added a listener
    mock_can_messenger.add_listener.assert_called_once()
    # and we should have removed the same one
    mock_can_messenger.remove_listener.assert_called_once_with(
        # these accesses are 1) first call 2) positional args 3) first positional
        mock_can_messenger.add_listener.call_args_list[0][0][0]
    )


async def test_completes_more_than_expected(mock_can_messenger: AsyncMock) -> None:
    """Test that if more than specified node exists, the probe works."""
    _ = MockStatusResponder(
        mock_can_messenger, [NodeId.gantry_y.value, NodeId.gantry_x.value]
    )
    switch_states = await asyncio.wait_for(
        get_limit_switches(mock_can_messenger, {NodeId.gantry_x}), 2.0
    )
    assert switch_states == {NodeId.gantry_x: 0}


async def test_handles_bad_node_ids(mock_can_messenger: AsyncMock) -> None:
    """Test that invalid node ids are swallowed silently."""
    _ = MockStatusResponder(mock_can_messenger, [0x01, NodeId.gantry_x.value])
    # same deal with the timeout
    switch_states = await asyncio.wait_for(
        get_limit_switches(mock_can_messenger, {NodeId.gantry_x}), 2.0
    )
    # we should get everything we prepped the network with and ignore the bad values
    assert switch_states == {NodeId.gantry_x: 0}
