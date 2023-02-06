"""Utilities for managing the CANbus network on the OT3."""
import asyncio
from dataclasses import dataclass
import logging
from typing import Any, Dict, Set, Optional, Union
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoRequest,
    DeviceInfoResponse,
)
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition

log = logging.getLogger(__name__)


@dataclass
class DeviceInfoCache:
    """Holds version information for a device on the network."""

    node_id: NodeId
    version: int
    shortsha: str
    flags: Any

    def __repr__(self) -> str:
        """Readable representation of the device info."""
        return f"<{self.__class__.__name__}: node={self.node_id}, version={self.version}, sha={self.shortsha}>"


class NetworkInfo:
    """This class is responsible for keeping track of nodes on the can bus."""

    def __init__(self, can_messenger: CanMessenger) -> None:
        """Construct.

        Args:
            can_messenger: The Can messenger
        """
        self._can_messenger = can_messenger
        self._device_info_cache: Dict[NodeId, DeviceInfoCache] = dict()

    @property
    def device_info(self) -> Dict[NodeId, DeviceInfoCache]:
        """Dictionary containing known nodes and their device info."""
        return self._device_info_cache

    @property
    def nodes(self) -> Set[NodeId]:
        """Set of NodeIds on the network."""
        return set(self._device_info_cache)

    async def probe(
        self, expected: Optional[Set[NodeId]] = set(), timeout: float = 1.0
    ) -> Dict[NodeId, DeviceInfoCache]:
        """Probe the bus and discover connected devices.

        Sends a status request to the broadcast address and waits for responses. Ends either
        when all nodes in expected respond or when a timeout happens, whichever is first. A
        None timeout is infinite and is not recommended, but could be useful if this is
        wrapped in a task and cancelled externally.

        The ideal call pattern is to build an expectation for nodes on the bus (i.e., fixed
        nodes such as gantry controllers and head plus whatever tools the head indicates
        are attached) and use this method to verify the assumption.

        Args:
            expected: Set of NodeIds to expect
            timeout: time in seconds to wait for can message responses
        """
        event = asyncio.Event()
        nodes: Dict[NodeId, DeviceInfoCache] = dict()

        def listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
            if isinstance(message, DeviceInfoResponse):
                device_info_cache = _parse_device_info_response(message, arbitration_id)
                if device_info_cache:
                    nodes[device_info_cache.node_id] = device_info_cache
            if expected and expected.issubset(nodes):
                event.set()

        self._can_messenger.add_listener(listener)
        await self._can_messenger.send(
            node_id=NodeId.broadcast,
            message=DeviceInfoRequest(),
        )
        try:
            await asyncio.wait_for(event.wait(), timeout)
        except asyncio.TimeoutError:
            if expected:
                log.warning(
                    "probe timed out before expected nodes found, missing "
                    f"{expected.difference(nodes)}"
                )
            else:
                log.debug("probe terminated (no expected set)")
        finally:
            self._can_messenger.remove_listener(listener)
            self._device_info_cache = nodes
        return nodes


def _parse_device_info_response(
    message: MessageDefinition, arbitration_id: ArbitrationId
) -> Union[DeviceInfoCache, None]:
    """Parses the DeviceInfoRequest message and returns DeviceInfoCache."""
    if isinstance(message, DeviceInfoResponse):
        try:
            node = NodeId(arbitration_id.parts.originating_node_id)
        except ValueError:
            log.error(
                "unknown node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return None
        try:
            return DeviceInfoCache(
                node_id=node,
                version=int(message.payload.version.value),
                shortsha=message.payload.shortsha.value.decode(),
                flags=message.payload.flags.value,
            )
        except (ValueError, UnicodeDecodeError) as e:
            log.error(f"Could not parse DeviceInfoResponse {e}")
    return None
