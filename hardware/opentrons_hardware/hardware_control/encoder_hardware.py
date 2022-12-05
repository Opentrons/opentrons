"""A very simple script to run a move group and wait for it to complete."""
import asyncio
import logging
from typing import Dict, Set, Callable

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    MessageId,
    NodeId
)
from opentrons_hardware.firmware_bindings.messages import MessageDefinition

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    MotorPositionRequest,
    MotorPositionResponse,
)

from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from opentrons_hardware.drivers.gpio import OT3GPIO

log = logging.getLogger(__name__)

def _create_listener(
    nodes: Set[NodeId], event: asyncio.Event, responses: Dict[NodeId, int]
) -> Callable[[MessageDefinition, ArbitrationId], None]:
    def _listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
        except ValueError:
            log.warning(
                "unknown node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        if originator not in nodes:
            log.error(
                "got response from unexpected node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        if message.message_id != MessageId.motor_position_response:
            log.warning(f"unexpected message id: 0x{message.message_id:x}")
            return
        responses[originator] = message.payload.encoder_position
        if len(responses) == len(nodes):
            event.set()
    return _listener

async def get_encoder_position(messenger: CanMessenger, nodes: Set[NodeId]):
    """This function allows us to obtain encoder position from all axes"""
    encoder_positions = {}
    event = asyncio.Event()
    responses: Dict[NodeId, float] = dict()
    listener = _create_listener(nodes, event, responses)
    messenger.add_listener(listener)
    for node in nodes:
        await messenger.send(
            node_id=node,
            message=MotorPositionRequest(),
        )
    try:
        await asyncio.wait_for(event.wait(), 1.0)
        # print(responses)
        for ax in responses.keys():
            encoder_positions[ax] = responses[ax].value/1000.0
            print(f"{encoder_positions}")
        messenger.remove_listener(listener)
    except asyncio.TimeoutError:
        log.error("encoder request timed out before expected nodes responded")
    finally:
        messenger.remove_listener(listener)
    return encoder_positions
