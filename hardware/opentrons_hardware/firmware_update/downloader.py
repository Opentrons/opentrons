"""Firmware download."""
import asyncio
import logging

from opentrons_ot3_firmware import NodeId
from opentrons_ot3_firmware.constants import ErrorCode, ToolType
from opentrons_ot3_firmware.utils import UInt32Field

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_update.errors import ErrorResponse, TimeoutResponse
from opentrons_hardware.firmware_update.hex_file import HexRecordProcessor
from opentrons_ot3_firmware.messages import message_definitions, payloads


logger = logging.getLogger(__name__)


class FirmwareUpdateDownloader:
    """Class that downloads FW using CAN messages."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor."""
        self._messenger = messenger

    async def run(
        self,
        node_id: NodeId,
        hex_processor: HexRecordProcessor,
        ack_wait_seconds: float,
    ) -> None:
        """Download hex record chunks to node.

        Args:
            node_id: The target node id.
            hex_processor: The producer of hex chunks.
            ack_wait_seconds: Number of seconds to wait for an ACK

        Returns:
            None
        """
        with WaitableCallback(self._messenger) as reader:
            num_messages = 0
            for chunk in hex_processor.process(
                payloads.FirmwareUpdateDataField.NUM_BYTES
            ):
                logger.debug(
                    f"Sending chunk {num_messages} to address {chunk.address}."
                )
                # Create and send message from this chunk
                data_message = message_definitions.FirmwareUpdateData(
                    payload=payloads.FirmwareUpdateData.create(
                        address=chunk.address, data=bytes(chunk.data)
                    )
                )
                await self._messenger.send(node_id=node_id, message=data_message)
                try:
                    # Wait for ack.
                    await asyncio.wait_for(
                        self._wait_data_message_ack(node_id, reader), ack_wait_seconds
                    )
                except asyncio.TimeoutError:
                    raise TimeoutResponse(data_message)

                num_messages += 1

            # Create and send firmware update complete message.
            complete_message = message_definitions.FirmwareUpdateComplete(
                payload=payloads.FirmwareUpdateComplete(
                    num_messages=UInt32Field(num_messages)
                )
            )
            await self._messenger.send(node_id=node_id, message=complete_message)
            try:
                # wait for ack.
                await asyncio.wait_for(
                    self._wait_update_complete_ack(node_id, reader), ack_wait_seconds
                )
            except asyncio.TimeoutError:
                raise TimeoutResponse(complete_message)

    @staticmethod
    async def _wait_data_message_ack(node_id: NodeId, reader: WaitableCallback) -> None:
        """Wait for response to data."""
        async for response, arbitration_id in reader:
            if arbitration_id.parts.originating_node_id == node_id:
                if isinstance(
                    response, message_definitions.FirmwareUpdateDataAcknowledge
                ):
                    if response.payload.error_code.value != ErrorCode.ok:
                        raise ErrorResponse(response)
                    break

    @staticmethod
    async def _wait_update_complete_ack(
        node_id: NodeId, reader: WaitableCallback
    ) -> None:
        """Wait for response to update complete."""
        async for response, arbitration_id in reader:
            if arbitration_id.parts.originating_node_id == node_id:
                if isinstance(
                    response, message_definitions.FirmwareUpdateCompleteAcknowledge
                ):
                    if response.payload.error_code.value != ErrorCode.ok:
                        raise ErrorResponse(response)
                    break
