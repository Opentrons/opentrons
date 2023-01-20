"""Utilities for gathering device info for OT3 submodules."""


import asyncio
import logging
from typing import Set
from opentrons.hardware_control.types import DeviceInfoCache

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger, MultipleMessagesWaitableCallback, WaitableCallback
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import MessageId, NodeId
from opentrons_hardware.firmware_bindings.messages.message_definitions import DeviceInfoRequest, DeviceInfoResponse
from opentrons_hardware.hardware_control.types import NodeMap


log = logging.getLogger(__name__)


DeviceInfoMap = NodeMap[DeviceInfoCache]


async def get_device_info(
    can_messenger: CanMessenger, nodes: Set[NodeId], timeout: float = 1.0
) -> DeviceInfoMap:
    """Request node to respond with device info."""
    data: DeviceInfoMap = {}

    def _listener_filter(arbitration_id: ArbitrationId) -> bool:
        return (NodeId(arbitration_id.parts.originating_node_id) in nodes) and (
            MessageId(arbitration_id.parts.message_id)
            == DeviceInfoResponse.message_id
        )

    expected_nodes = len(nodes) if nodes else None
    listener_filter = _listener_filter if nodes else None
    with MultipleMessagesWaitableCallback(
        can_messenger,
        listener_filter,
        expected_nodes,
    ) as reader:
        await can_messenger.send(
            node_id=NodeId.broadcast, message=DeviceInfoRequest()
        )
        try:
            data = await asyncio.wait_for(
                _parse_device_info_response(reader),
                timeout,
            )
        except asyncio.TimeoutError:
            log.warning("Motor position timed out")
    return data


async def _parse_device_info_response(
    reader: WaitableCallback, expected: NodeId
) -> DeviceInfoCache:
    async for response, arb_id in reader:
        assert isinstance(response, DeviceInfoResponse)
        node = NodeId(arb_id.parts.originating_node_id)
        if node == expected:
            return (
                DeviceInfoCache(
                    node_id=node,
                    version=response.payload.version.value,
                    flags=response.payload.flags.value,
                    shortsha=response.payload.shortsha.value.decode())
            )
    raise StopAsyncIteration
