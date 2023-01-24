"""Utilities for managing the CANbus network on the OT3."""
import asyncio
from dataclasses import dataclass
import logging
from typing import Dict, Set, Optional
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import NodeId, MessageId
from opentrons_hardware.drivers.can_bus.can_messenger import (
    MultipleMessagesWaitableCallback,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoRequest,
    DeviceInfoResponse,
)

log = logging.getLogger(__name__)


@dataclass
class DeviceInfoCache:
    node_id: int
    version: int
    shortsha: str
    flags: any

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: node={self.node_id}, version={self.version}, sha={self.shortsha}>"


class NetworkInfo:
    """This class is responsible for keeping track of nodes on the can bus."""

    def __init__(self, can_messenger) -> None:
        self._can_messenger = can_messenger
        self._device_info_cache: dict[NodeId, DeviceInfoCache] = {}

    @property
    def device_info(self) -> Dict[NodeId, DeviceInfoCache]:
        return self._device_info_cache

    @property
    def nodes(self) -> Set[NodeId]:
        return set(self._device_info_cache)

    async def probe(
        self, expected: Optional[Set[NodeId]], timeout: float = 1.0
    ) -> Dict[NodeId, DeviceInfoCache]:
        """Probe the bus and discover connected devices.
        Sends a status request to the broadcast address and waits for responses. Ends either
        when all nodes in expected respond or when a timeout happens, whichever is first. A
        None timeout is infinite and is not recommended, but could be useful if this is
        wrapped in a task and cancelled externally.

        The ideal call pattern is to build an expectation for nodes on the bus (i.e., fixed
        nodes such as gantry controllers and head plus whatever tools the head indicates
        are attached) and use this method to verify the assumption.
        """
        nodes: Dict[NodeId, DeviceInfoCache] = dict()

        def _listener_filter(arbitration_id: ArbitrationId) -> bool:
            return (
                not expected
                or NodeId(arbitration_id.parts.originating_node_id) in expected
            ) and (
                MessageId(arbitration_id.parts.message_id)
                == DeviceInfoResponse.message_id
            )

        message_count = len(expected) if expected else None
        with MultipleMessagesWaitableCallback(
            self._can_messenger,
            _listener_filter,
            message_count,
        ) as reader:
            await self._can_messenger.send(
                node_id=NodeId.broadcast, message=DeviceInfoRequest()
            )
            try:
                nodes = await asyncio.wait_for(
                    _parse_device_info_response(reader), timeout
                )
                # update internel cache
                self._network_info_received(nodes)
            except asyncio.TimeoutError:
                if expected:
                    log.warning(
                        "probe timed out before expected nodes found, missing "
                        f"{expected.difference(nodes)}"
                    )
        return self.nodes

    def _network_info_received(
        self, network_info: Dict[NodeId, DeviceInfoCache]
    ) -> None:
        device_info_cache = {}
        for node, device_info in network_info.items():
            old_device_info = self._device_info_cache.get(node)
            if old_device_info is None or device_info != old_device_info:
                log.debug(f"Updated device info cache {device_info}")
                device_info_cache[node] = device_info
        self._device_info_cache = device_info_cache


async def _parse_device_info_response(reader: WaitableCallback) -> DeviceInfoCache:
    async for response, arb_id in reader:
        assert isinstance(response, DeviceInfoResponse)
        try:
            node = NodeId(arb_id.parts.originating_node_id)
        except ValueError:
            log.error(
                "unknown node id on network: " f"0x{arb_id.parts.originating_node_id:x}"
            )
            return
        log.debug(f"got response from {node}")
        if arb_id.parts.message_id == MessageId.error_message:
            log.error(
                f"Recieved an error message {str(response)} from {str(response.parts)}"
            )
        return {
            node: DeviceInfoCache(
                node_id=node,
                version=response.payload.version.value,
                flags=response.payload.flags.value,
                shortsha=response.payload.shortsha.value.decode(),
            )
        }
    raise StopAsyncIteration
