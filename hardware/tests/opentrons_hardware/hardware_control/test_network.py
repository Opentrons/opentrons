"""Test the network submodule."""
import pytest
import asyncio
import datetime
from typing import List, Callable
from mock import AsyncMock

from opentrons_hardware.drivers.binary_usb.binary_messenger import BinaryMessenger
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
    fields,
    BinaryMessageDefinition,
    binary_message_definitions,
)
from opentrons_hardware.firmware_bindings.constants import NodeId, USBTarget

from opentrons_hardware.hardware_control.network import NetworkInfo


@pytest.fixture
def mock_can_messenger() -> AsyncMock:
    """Mock communication."""
    return AsyncMock(spec=CanMessenger)


@pytest.fixture
def mock_usb_messenger() -> AsyncMock:
    """Mock communication."""
    return AsyncMock(spec=BinaryMessenger)


class MockCanStatusResponder:
    """A harness that will automatically send status responses."""

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
                response = message_definitions.DeviceInfoResponse(
                    payload=payloads.DeviceInfoResponsePayload(
                        version=utils.UInt32Field(0),
                        flags=fields.VersionFlagsField(0),
                        shortsha=fields.FirmwareShortSHADataField(b"abcdef0"),
                        revision=fields.OptionalRevisionField.build(b""),
                        subidentifier=utils.UInt8Field(0),
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


class MockUSBStatusResponder:
    """A harness that will automatically send status responses."""

    def __init__(
        self, mock_messenger: AsyncMock, respond_with_nodes: List[int]
    ) -> None:
        """Build the status responder."""
        self._mock_messenger = mock_messenger
        self._callbacks: List[Callable[[BinaryMessageDefinition], None]] = []
        self._mock_messenger.add_listener.side_effect = self.add_callback
        self._mock_messenger.send.side_effect = self.send
        self._respond_with_nodes = respond_with_nodes

    def add_callback(self, callback: Callable[[BinaryMessageDefinition], None]) -> None:
        """Wrap the add_callback mock method."""
        self._callbacks.append(callback)

    def send(self, message: BinaryMessageDefinition) -> None:
        """Wrap the send method to send predefined callbacks."""
        assert self._callbacks
        for callback in self._callbacks:
            for node in self._respond_with_nodes:
                response = binary_message_definitions.DeviceInfoResponse(
                    version=utils.UInt32Field(0),
                    flags=fields.VersionFlagsField(0),
                    shortsha=fields.FirmwareShortSHADataField(b"abcdef0"),
                    revision=fields.OptionalRevisionField.build(b""),
                    subidentifier=utils.UInt8Field(0),
                )
                asyncio.get_running_loop().call_soon(
                    callback,
                    response,
                )


async def test_timeout_fires(mock_can_messenger: AsyncMock) -> None:
    """Test that the timeout functionality works."""
    then = datetime.datetime.utcnow()
    # we expect a timeout, but a handled timeout, and we don't want to hang the tests
    # if it didn't work, so wrap it in a wait_for of our own with a bigger timeout
    # that will raise if it fails
    network_info = NetworkInfo(mock_can_messenger)
    nodes = set(
        await asyncio.wait_for(
            network_info.probe({NodeId.gantry_x, NodeId.gantry_y}, 0.5), 1.0
        )
    )
    now = datetime.datetime.utcnow()
    # we should have taken the full time allotted
    assert (now - then).total_seconds() >= 0.5
    # we should have no nodes
    assert not nodes

    # We should have sent a request
    mock_can_messenger.send.assert_called_once_with(
        node_id=NodeId.broadcast,
        message=message_definitions.DeviceInfoRequest(),
    )
    # we should have added a listener
    mock_can_messenger.add_listener.assert_called_once()
    # and we should have removed the same one
    mock_can_messenger.remove_listener.assert_called_once_with(
        # these accesses are 1) first call 2) positional args 3) first positional
        mock_can_messenger.add_listener.call_args_list[0][0][0]
    )


async def test_completes_exact_equality(mock_can_messenger: AsyncMock) -> None:
    """Test that if the exact specified nodes exist the probe works."""
    _ = MockCanStatusResponder(mock_can_messenger, [NodeId.gantry_x.value])
    # we should not get to the timeout, but if we did we wouldn't know because it
    # doesn't raise, so wrap it in a smaller timeout so it will raise (it should
    # complete basically instantly)
    network_info = NetworkInfo(mock_can_messenger)
    probed = set(await asyncio.wait_for(network_info.probe({NodeId.gantry_x}), 2.0))
    assert probed == {NodeId.gantry_x}


async def test_completes_more_than_expected(mock_can_messenger: AsyncMock) -> None:
    """Test that if more than specified node exists, the probe works."""
    _ = MockCanStatusResponder(
        mock_can_messenger, [NodeId.gantry_y.value, NodeId.gantry_x.value]
    )
    # same deal with the timeout
    network_info = NetworkInfo(mock_can_messenger)
    probed = set(await asyncio.wait_for(network_info.probe({NodeId.gantry_x}), 2.0))
    # we should get everything we prepped the network with
    assert probed == {NodeId.gantry_x, NodeId.gantry_y}


async def test_handles_bad_node_ids(mock_can_messenger: AsyncMock) -> None:
    """Test that invalid node ids are swalloed silently."""
    _ = MockCanStatusResponder(mock_can_messenger, [0x01, NodeId.gantry_x.value])
    # same deal with the timeout
    network_info = NetworkInfo(mock_can_messenger)
    probed = set(await asyncio.wait_for(network_info.probe({NodeId.gantry_x}), 2.0))
    # we should get everything we prepped the network with and ignore the bad values
    assert probed == {NodeId.gantry_x}


async def test_handles_usb_target(
    mock_can_messenger: AsyncMock, mock_usb_messenger: AsyncMock
) -> None:
    """Test that network probe handles rear-panel usb target."""
    _ = MockUSBStatusResponder(mock_usb_messenger, [USBTarget.rear_panel])
    network_info = NetworkInfo(mock_can_messenger, mock_usb_messenger)
    probed = set(
        await asyncio.wait_for(network_info.probe({USBTarget.rear_panel}), 2.0)
    )
    assert probed == {USBTarget.rear_panel}
