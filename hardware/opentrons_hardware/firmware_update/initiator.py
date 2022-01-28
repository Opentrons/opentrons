"""Firmware update"""
from dataclasses import dataclass

from opentrons_ot3_firmware import NodeId
from opentrons_ot3_firmware.messages import message_definitions, payloads

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback


@dataclass(frozen=True)
class Target:
    """Pair of a sub-system's node id with its bootloader's node id."""

    system_node: NodeId
    bootloader_node: NodeId


head = Target(system_node=NodeId.head, bootloader_node=NodeId.head_bootloader)
pipette = Target(system_node=NodeId.pipette, bootloader_node=NodeId.pipette_bootloader)
gantry_x = Target(
    system_node=NodeId.gantry_x, bootloader_node=NodeId.gantry_x_bootloader
)
gantry_y = Target(
    system_node=NodeId.gantry_y, bootloader_node=NodeId.gantry_y_bootloader
)


class FirmwareUpdateInitiator:
    """Class that initiates a FW update."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor."""
        self._messenger = messenger

    async def run(
        self, target: Target, retry_count: int, ready_wait_time_sec: float
    ) -> None:
        """Initiate FW update for target.

        Args:
            target: The system that should be updated.
            retry_count: How many times to try.
            ready_wait_time_sec: How long to wait for bootloader to be ready.

        Returns:
            None
        """
        with WaitableCallback(self._messenger) as reader:
            # send initiate
            initiate_message = message_definitions.FirmwareUpdateInitiate(
                payload=payloads.EmptyPayload()
            )
            await self._messenger.send(
                node_id=target.system_node, message=initiate_message
            )

            device_info_request_message = message_definitions.DeviceInfoRequest(
                payload=payloads.EmptyPayload()
            )
            await self._messenger.send(
                node_id=target.bootloader_node, message=device_info_request_message
            )

            response, arbitration_id = await reader.read()
            if (
                isinstance(response, message_definitions.DeviceInfoResponse)
                and arbitration_id.parts.originating_node_id == target.bootloader_node
            ):
                return
