"""Firmware upgrade."""
from opentrons_ot3_firmware import NodeId
from opentrons_ot3_firmware.utils import UInt32Field

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_upgrade.hex_file import HexRecordProcessor
from opentrons_ot3_firmware.messages import message_definitions, payloads


class FirmwareUpgradeDownloader:
    """Class that performs a FW upgrade using CAN messages."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor."""
        self._messenger = messenger

    async def run(self, node_id: NodeId, hex_processor: HexRecordProcessor) -> None:
        """Download hex record chunks to node.

        Args:
            node_id: The target node id.
            hex_processor: The producer of hex chunks.

        Returns:
            None
        """
        with WaitableCallback(self._messenger) as reader:
            num_messages = 0
            for chunk in hex_processor.process(
                payloads.FirmwareUpdateDataField.NUM_BYTES
            ):
                data_message = message_definitions.FirmwareUpdateData(
                    payload=payloads.FirmwareUpdateData.create(
                        address=chunk.address, data=bytes(chunk.data)
                    )
                )
                await self._messenger.send(node_id=node_id, message=data_message)

                async for response, arbitration_id in reader:
                    if arbitration_id.parts.originating_node_id == node_id:
                        if isinstance(
                            response, message_definitions.FirmwareUpdateDataAcknowledge
                        ):
                            break

                num_messages += 1

            complete_message = message_definitions.FirmwareUpdateComplete(
                payload=payloads.FirmwareUpdateComplete(
                    num_messages=UInt32Field(num_messages)
                )
            )
            await self._messenger.send(node_id=node_id, message=complete_message)

            async for response, arbitration_id in reader:
                if arbitration_id.parts.originating_node_id == node_id:
                    if isinstance(
                        response, message_definitions.FirmwareUpdateCompleteAcknowledge
                    ):
                        break
