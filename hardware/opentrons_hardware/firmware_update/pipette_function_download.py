"""Send a pipetting function from shared data to the EEPROM over CAN."""

import asyncio
from typing import Dict, Iterator, List, Tuple

from opentrons_shared_data.pipette.pipette_definition import SupportedTipsDefinition
from opentrons_shared_data.pipette.types import PipetteTipType

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings import NodeId, utils
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.firmware_bindings.messages.fields import (
    PipetteConfigDataField,
)
from opentrons_hardware.firmware_update.errors import TimeoutResponse

PIPETTING_FUNCTION_VALUE_BYTES = 3
PIPETTING_FUNCTION_DECIMAL_PRECISION = 3


class PipetteFunctionDownloader:
    """Takes in a shared data SupportedTips definition and sends the pipetting function over CAN."""

    def __init__(
        self,
        node_id: NodeId,
        can_messenger: CanMessenger,
        supported_tips_def: Dict[PipetteTipType, SupportedTipsDefinition],
        retry_count: int = 4,
        ack_wait_seconds: int = 5,
        timeout_seconds: float = 60,
    ) -> None:
        """Initialize RunUpdate class.

        Args:
            node_id: Node Id of the pipette whose function to send
            can_messenger: The canbus messenger
            supported_tips_def: The SupportedTips definition from the pipette config
            retry_count: How many times to retry sending and receiving an ack from the pipette firmware
            ack_wait_seconds: How long to wait for an ack before retrying
            timeout_seconds: How long to wait for an ack to initiate download

        Returns:
            None
        """
        self._can_messenger = can_messenger
        if node_id not in [NodeId.pipette_left, NodeId.pipette_right]:
            raise ValueError(
                f"tried to start pipette function EEPROM update with invalid node {node_id}."
            )
        self._node_id = node_id
        self._supported_tips_def = supported_tips_def
        self._retry_count = retry_count
        self._ack_wait_seconds = ack_wait_seconds
        self._timeout_seconds = timeout_seconds

    @property
    def formatted_pipetting_function(
        self,
    ) -> Dict[int, List[Tuple[float, float, float]]]:
        """Reformats the pipetting function from shared data to be converted to bytes."""
        formatted_dict: Dict[int, List[Tuple[float, float, float]]] = {}
        for tip_size, tip_size_data in self._supported_tips_def.items():
            func_for_tip_size = tip_size_data.aspirate.default
            assert len(list(func_for_tip_size.items())) == 1, ValueError(
                "Invalid pipette function format."
            )
            formatted_dict[int(tip_size.value)] = list(func_for_tip_size.values())[0]
        return formatted_dict

    def pipetting_function_chunks(
        self,
    ) -> Iterator[bytearray]:
        """Generator that yields a pipetting function in 48-byte chunks."""
        bytes_index = 0
        current_message_bytes = bytearray(PipetteConfigDataField.NUM_BYTES)
        for tip_size, pip_values in self.formatted_pipetting_function.items():
            # RESET THE BUFFER and set the index to 3 to reserve space for tip length entries
            current_message_bytes = bytearray(PipetteConfigDataField.NUM_BYTES)
            bytes_index = PIPETTING_FUNCTION_VALUE_BYTES
            # add the tip size to the first 3 bytes
            tip_size_bytes = tip_size.to_bytes(PIPETTING_FUNCTION_VALUE_BYTES)
            current_message_bytes[:PIPETTING_FUNCTION_VALUE_BYTES] = tip_size_bytes
            for line in pip_values:
                for number in line:
                    if bytes_index >= PipetteConfigDataField.NUM_BYTES:
                        yield current_message_bytes
                        # RESET THE BUFFER and set the index to 3 to reserve space for tip length entries
                        current_message_bytes = bytearray(
                            PipetteConfigDataField.NUM_BYTES
                        )
                        bytes_index = PIPETTING_FUNCTION_VALUE_BYTES
                    # preserve 3 decimal places
                    pip_value_int = int(
                        number * 10**PIPETTING_FUNCTION_DECIMAL_PRECISION
                    )
                    is_negative = pip_value_int < 0
                    pip_value_bytes = bytearray(
                        abs(pip_value_int).to_bytes(PIPETTING_FUNCTION_VALUE_BYTES)
                    )
                    # use largest bit to indicate sign
                    sign_bit_place = 2**7
                    pip_value_bytes[0] |= sign_bit_place * is_negative
                    current_message_bytes[
                        bytes_index : bytes_index + PIPETTING_FUNCTION_VALUE_BYTES
                    ] = pip_value_bytes
                    bytes_index += PIPETTING_FUNCTION_VALUE_BYTES
            yield current_message_bytes

    async def send_to_eeprom(self, reader: WaitableCallback) -> None:
        """Formats the pipette's function from shared data and sends it over CAN."""
        for data_chunk in self.pipetting_function_chunks():
            passed = False
            for retry in range(self._retry_count):
                data_bytes = bytes(data_chunk)
                # Create and send message from this chunk
                data_message = message_definitions.PipetteConfigData(
                    payload=payloads.PipetteConfigData(
                        num_bytes=utils.UInt8Field(PipetteConfigDataField.NUM_BYTES),
                        data=PipetteConfigDataField(data_bytes),
                    )
                )
                await self._can_messenger.send(
                    node_id=self._node_id, message=data_message
                )
                try:
                    # Wait for ack
                    await asyncio.wait_for(
                        self._wait_for_data_ack(reader),
                        self._ack_wait_seconds,
                    )
                    passed = True
                    break
                except asyncio.TimeoutError:
                    raise TimeoutResponse(data_message, self._node_id)
            # message was not successful
            if not passed:
                raise TimeoutResponse(data_message, self._node_id)

    async def initiate_pipette_function_update(self, reader: WaitableCallback) -> None:
        """Sends initiate message and waits for ack."""
        initiate_acknowledged = False
        with WaitableCallback(self._can_messenger) as reader:
            initiate_message = message_definitions.PipetteConfigUpdateInitiate()
            for retry in range(self._retry_count):
                await self._can_messenger.send(
                    node_id=self._node_id,
                    message=initiate_message,
                )
                await asyncio.wait_for(
                    self._wait_for_initiate(reader=reader), self._timeout_seconds
                )
        if not initiate_acknowledged:
            raise TimeoutResponse(initiate_message, self._node_id)

    async def run_update_pipette_function(self) -> None:
        """Starts, executes, and confirms ack of pipette function download."""
        with WaitableCallback(self._can_messenger) as reader:
            # send initiate message and wait for ack
            await self.initiate_pipette_function_update(reader)
            # process pipette function and send it over CAN
            await self.send_to_eeprom(reader)
            # send complete message
            complete_message = message_definitions.PipetteConfigUpdateComplete(
                payload=payloads.PipetteConfigUpdateComplete()
            )
            await self._can_messenger.send(
                node_id=self._node_id, message=complete_message
            )
            try:
                await asyncio.wait_for(
                    self._wait_for_pipette_function_update_complete(reader),
                    self._ack_wait_seconds,
                )
            except asyncio.TimeoutError:
                # make this an actual enum error
                raise ValueError("response timed out")
                # raise TimeoutResponse(complete_message, self._node_id)

    async def _wait_for_initiate(self, reader: WaitableCallback) -> None:
        async for response, arbitration_id in reader:
            if (
                isinstance(response, message_definitions.PipetteConfigDataAcknowledge)
                and arbitration_id.parts.originating_node_id == self._node_id
            ):
                break

    async def _wait_for_data_ack(self, reader: WaitableCallback) -> None:
        async for response, arbitration_id in reader:
            if (
                isinstance(response, message_definitions.PipetteConfigDataAcknowledge)
                and arbitration_id.parts.originating_node_id == self._node_id
            ):
                break

    async def _wait_for_pipette_function_update_complete(
        self, reader: WaitableCallback
    ) -> None:
        async for response, arbitration_id in reader:
            if (
                isinstance(
                    response,
                    message_definitions.PipetteConfigDataCompleteAcknowledge,
                )
                and arbitration_id.parts.originating_node_id == self._node_id
            ):
                break
