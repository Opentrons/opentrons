"""Utilities for managing the CANbus network on the OT3."""
import asyncio
from dataclasses import dataclass
import logging
from typing import Any, Dict, Set, Optional, Union
from .types import PCBARevision
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    FirmwareTarget,
    USBTarget,
)
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
)
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoRequest as CanDeviceInfoRequest,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoResponse as CanDeviceInfoResponse,
)
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    DeviceInfoRequest as USBDeviceInfoRequest,
)
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    DeviceInfoResponse as USBDeviceInfoResponse,
)
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
)
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition

log = logging.getLogger(__name__)


@dataclass
class DeviceInfoCache:
    """Holds version information for a device on the network."""

    target: FirmwareTarget
    version: int
    shortsha: str
    flags: Any
    revision: PCBARevision
    subidentifier: int

    def __repr__(self) -> str:
        """Readable representation of the device info."""
        return f"<{self.__class__.__name__}: node={self.target}, version={self.version}, sha={self.shortsha}>"


class NetworkInfo:
    """This class is responsible for keeping track of all devices."""

    def __init__(
        self,
        can_messenger: CanMessenger,
        usb_messenger: Optional[BinaryMessenger] = None,
    ) -> None:
        """Construct.

        Args:
            can_messenger: The Can messenger
            usb_messenger: The usb messenger
        """
        self._can_network_info = CanNetworkInfo(can_messenger)
        self._usb_network_info = UsbNetworkInfo(usb_messenger)
        self._device_info_cache: Dict[FirmwareTarget, DeviceInfoCache] = dict()

    @property
    def device_info(self) -> Dict[FirmwareTarget, DeviceInfoCache]:
        """Dictionary containing known devices and their device info."""
        return self._device_info_cache

    @property
    def targets(self) -> Set[FirmwareTarget]:
        """Set of usb devices on the network."""
        return set(self._device_info_cache)

    async def probe(
        self, expected: Optional[Set[FirmwareTarget]] = None, timeout: float = 1.0
    ) -> Dict[FirmwareTarget, DeviceInfoCache]:
        """Probe for all connected devices.

        calls probe with both CanNetworkInfo and USBNetworkInfo and collects all devices

        The ideal call pattern is to build an expectation for targets and use this to verify that
        assumption

        Args:
            expected: Set of FirmwareTargets to expect
            timeout: time in seconds to wait for responses
        """
        expected_can: Optional[Set[NodeId]] = None
        expected_usb: Optional[Set[USBTarget]] = None
        if expected is not None:
            expected_can = {NodeId(target) for target in expected if target in NodeId}
            expected_usb = {
                USBTarget(target) for target in expected if target in USBTarget
            }
        can_device_info, usb_device_info = await asyncio.gather(
            self._can_network_info.probe(expected_can, timeout),
            self._usb_network_info.probe(expected_usb, timeout),
        )
        device_info: Dict[FirmwareTarget, DeviceInfoCache] = {
            node: cache for (node, cache) in can_device_info.items()
        }
        device_info.update(
            {target: cache for (target, cache) in usb_device_info.items()}
        )
        self._device_info_cache = device_info
        return device_info


class UsbNetworkInfo:
    """This class is responsible for keeping track of usb devices."""

    def __init__(self, usb_messenger: Optional[BinaryMessenger]) -> None:
        """Construct.

        Args:
            usb_messenger: The usb messenger
        """
        self._usb_messenger = usb_messenger
        self._device_info_cache: Dict[USBTarget, DeviceInfoCache] = dict()

    @property
    def device_info(self) -> Dict[USBTarget, DeviceInfoCache]:
        """Dictionary containing known usb devices and their device info."""
        return self._device_info_cache

    @property
    def targets(self) -> Set[USBTarget]:
        """Set of usb devices on the network."""
        return set(self._device_info_cache)

    async def probe(
        self, expected: Optional[Set[USBTarget]] = None, timeout: float = 1.0
    ) -> Dict[USBTarget, DeviceInfoCache]:
        """Probe for usb connected devices.

        Sends a status request to the usb messenger and waits for responses. Ends either
        when all devices in expected respond or when a timeout happens, whichever is first. A
        None timeout is infinite and is not recommended, but could be useful if this is
        wrapped in a task and cancelled externally.

        The ideal call pattern is to build an expectation for targets on the bus (i.e., fixed
        targets such as the rear panel) and use this method to verify the assumption.

        Args:
            expected: Set of USBTargets to expect
            timeout: time in seconds to wait for usb message responses
        """
        expected_targets = expected or set()
        event = asyncio.Event()
        targets: Dict[USBTarget, DeviceInfoCache] = dict()

        if self._usb_messenger is None:
            return targets

        def listener(message: BinaryMessageDefinition) -> None:
            if isinstance(message, USBDeviceInfoResponse):
                device_info_cache = _parse_usb_device_info_response(message)
                if device_info_cache:
                    targets[USBTarget(device_info_cache.target)] = device_info_cache
            if expected_targets and expected_targets.issubset(targets):
                event.set()

        self._usb_messenger.add_listener(listener)
        await self._usb_messenger.send(
            message=USBDeviceInfoRequest(),
        )
        try:
            await asyncio.wait_for(event.wait(), timeout)
        except asyncio.TimeoutError:
            if expected_targets:
                log.warning(
                    "probe timed out before expected targets found, missing "
                    f"{expected_targets.difference(targets)}"
                )
            else:
                log.debug("probe terminated (no expected set)")
        finally:
            self._usb_messenger.remove_listener(listener)
            self._device_info_cache = targets
        return targets


class CanNetworkInfo:
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
        self, expected: Optional[Set[NodeId]] = None, timeout: float = 1.0
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
        expected_nodes = expected or set()
        event = asyncio.Event()
        nodes: Dict[NodeId, DeviceInfoCache] = dict()

        def listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
            if isinstance(message, CanDeviceInfoResponse):
                device_info_cache = _parse_can_device_info_response(
                    message, arbitration_id
                )
                if device_info_cache:
                    nodes[NodeId(device_info_cache.target)] = device_info_cache
            if expected_nodes and expected_nodes.issubset(nodes):
                event.set()

        self._can_messenger.add_listener(listener)
        await self._can_messenger.send(
            node_id=NodeId.broadcast,
            message=CanDeviceInfoRequest(),
        )
        try:
            await asyncio.wait_for(event.wait(), timeout)
        except asyncio.TimeoutError:
            if expected_nodes:
                log.warning(
                    "probe timed out before expected nodes found, missing "
                    f"{expected_nodes.difference(nodes)}"
                )
            else:
                log.debug("probe terminated (no expected set)")
        finally:
            self._can_messenger.remove_listener(listener)
            self._device_info_cache = nodes
        return nodes


def _parse_usb_device_info_response(
    message: BinaryMessageDefinition,
) -> Union[DeviceInfoCache, None]:
    """Parses the DeviceInfoRequest message and returns DeviceInfoCache."""
    if isinstance(message, USBDeviceInfoResponse):
        target = USBTarget.rear_panel
        try:
            return DeviceInfoCache(
                target=target,
                version=int(message.version.value),
                shortsha=message.shortsha.value.decode(),
                flags=message.flags.value,
                revision=PCBARevision(
                    message.revision.revision, message.revision.tertiary
                ),
                subidentifier=message.subidentifier.value,
            )
        except (ValueError, UnicodeDecodeError) as e:
            log.error(f"Could not parse DeviceInfoResponse {e}")
    return None


def _parse_can_device_info_response(
    message: MessageDefinition, arbitration_id: ArbitrationId
) -> Union[DeviceInfoCache, None]:
    """Parses the DeviceInfoRequest message and returns DeviceInfoCache."""
    if isinstance(message, CanDeviceInfoResponse):
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
                target=node,
                version=int(message.payload.version.value),
                shortsha=message.payload.shortsha.value.decode(),
                flags=message.payload.flags.value,
                revision=PCBARevision(
                    message.payload.revision.revision, message.payload.revision.tertiary
                ),
                subidentifier=message.payload.subidentifier.value,
            )
        except (ValueError, UnicodeDecodeError) as e:
            log.error(f"Could not parse DeviceInfoResponse {e}")
    return None
