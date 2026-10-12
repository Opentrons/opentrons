import logging

from opentrons_shared_data.pipette.pipette_definition import SupportedTipsDefinition

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_bindings.messages.fields import (
    PipetteFunctionDataField,
)

logger = logging.getLogger(__name__)

PIPETTING_FUNCTION_VALUE_BYTES = 3
PIPETTING_FUNCTION_DECIMAL_PRECISION = 3


class PipetteFunctionProcessor:
    def __init__(
        self,
        can_messenger: CanMessenger,
        support_tips_def: SupportedTipsDefinition,
        retry_count: int = 4,
        timeout_seconds: float = 60,
    ) -> None:
        """Initialize RunUpdate class.

        Args:
            can_messenger: The canbus messenger

        Returns:
            None
        """
        self._can_messenger = can_messenger
        self._support_tips_def = support_tips_def
        self._retry_count = retry_count
        self._timeout_seconds = timeout_seconds

    @property
    def formatted_pipetting_function(self) -> Dict[str, List[Tuple(float)]]:
        formatted_dict: Dict[str, List[Tuple(float)]] = {}
        for tip_size, tip_size_data in self._supported_tips_def.items():
            func_for_tip_size = tip_size_data.aspirate.default
            try:
                pip_func_key = max([int(key) for key in func_for_tip_size])
            except ValueError:
                raise ValueError(
                    f"Invalid key in pipetting function: {aspirate_outer_dict.keys()}"
                )
            formatted_dict[tip_size] = func_for_tip_size[pip_func_key]
        return formatted_dict

    async def pipetting_function_chunks(
        pip_function: Dict[str, List[Tuple[float]]],
    ) -> AsycnIterator[bytearray]:
        # pipetting_data_chunks = List[bytearray]
        bytes_index = 0
        current_message_bytes = bytearray(PipetteFunctionDataField.NUM_BYTES)
        data_values_in_buffer = (
            PipetteFunctionDataField.NUM_BYTES / PIPETTING_FUNCTION_VALUE_BYTES
        ) - 1
        for tip_size, pip_values in pip_function.items():
            # RESET THE BUFFER
            # pipetting_data_chunks.append(current_message_bytes)
            yield current_message_bytes
            current_message_bytes = bytearray(PipetteFunctionDataField.NUM_BYTES)
            bytes_index = 0
            # add the tip size to the first 3 bytes
            tip_size_bytes = int(tip_size).to_bytes(PIPETTING_FUNCTION_VALUE_BYTES)
            current_message_bytes[0:PIPETTING_FUNCTION_VALUE_BYTES] = tip_size_bytes
            for line in pip_values:
                for number in line:
                    if i >= data_values_in_buffer:
                        # RESET THE BUFFER and set the index to 3 to reserve space for tip length entries
                        yield current_message_bytes
                        # pipetting_data_chunks.append(current_message_bytes)
                        current_message_bytes = bytearray(
                            PipetteFunctionDataField.NUM_BYTES
                        )
                        i = PIPETTING_FUNCTION_VALUE_BYTES
                    # preserve 3 decimal places
                    pip_value_int = int(
                        number * 10**PIPETTING_FUNCTION_DECIMAL_PRECISION
                    )
                    pip_value_bytes = pip_value_int.to_bytes(
                        PIPETTING_FUNCTION_VALUE_BYTES
                    )
                    # use largest bit to indicate sign
                    sign_bit_place = 2 ** (8 * PIPETTING_FUNCTION_VALUE_BYTES - 1)
                    pip_value_bytes |= sign_bit_place * pip_value_int < 0
                    current_message_bytes[i : i + PIPETTING_FUNCTION_VALUE_BYTES] = (
                        pip_value_bytes
                    )
                    i += PIPETTING_FUNCTION_VALUE_BYTES
        return pipetting_data_chunks

    async def send_to_eeprom(self) -> bool:
        with WaitableCallback(self._messenger) as reader:
            num_messages = 0
            async for data_chunk in pipetting_function_chunks(
                pip_function=pip_function
            ):
                passed = False
                for retry in range(self.retry_count):
                    logger.debug(
                        f"Sending chunk {num_messages} to address {chunk.address:x} retry: {retry}."
                    )
                    data_bytes = bytes(data_chunk)
                    # Create and send message from this chunk
                    data_message = message_definitions.PipetteFunctionData(
                        payload=PipetteFunctionData(
                            num_bytes=PipetteFunctionDataField.NUM_BYTES,
                            data=data_chunk,
                        )
                    )
                    await self._messenger.send(node_id=node_id, message=data_message)
                    try:
                        # Wait for ack.
                        await asyncio.wait_for(
                            self._wait_data_message_ack(node_id, reader),
                            ack_wait_seconds,
                        )
                        passed = True
                        break
                    except asyncio.TimeoutError:
                        logger.warning(
                            f"Firmware update data ack timed out for chunk {num_messages}"
                        )
                # message was not successful
                if not passed:
                    raise TimeoutResponse(data_message, node_id)

                # need logger and await ack
                # need to send initiate message

    async def initiate_pipette_function_update(self, node_id: NodeId) -> None:
        initiate_acknowledged = False
        if node_id not in [NodeId.pipette_left, NodeId.pipette_right]:
            raise ValueError(
                f"tried to start pipette function EEPROM update with invalid node {node_id}."
            )
        with WaitableCallback(self._messenger) as reader:
            for retry in range(self.retry_count):
                asyncio.wait_for(
                    self._wait_for_initiate(node_id=node_id, reader=reader)
                )
        if not initiate_acknowledged:
            # make this an actual enumerated error
            raise ValueError(f"Initiate Pipette Function Update Timed out. ")

    async def _wait_for_initiate(
        self, node_id: NodeId, reader: WaitableCallback
    ) -> None:
        await self._messenger.send(
            node_id=node_id, message=message_definitions.PipetteFunctionUpdateInitiate()
        )
        # Poll for device info response.
        async for response, arbitration_id in reader:
            if (
                isinstance(
                    response, message_definitions.PipetteFunctionUpdateAcknowledge
                )
                and arbitration_id.parts.originating_node_id == node_id
            ):
                break
