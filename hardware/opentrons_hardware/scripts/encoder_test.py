"""A very simple script to run a move group and wait for it to complete."""
import argparse
import asyncio
import logging
import dataclasses
from numpy import float64
import numpy as np
from logging.config import dictConfig
from enum import Enum, unique
from typing import Dict, Set, Callable

from opentrons_hardware.drivers.can_bus import build, CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import MessageId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EncoderPositionRequest,
)

from opentrons_hardware.firmware_bindings.constants import (
    MessageId,
    NodeId,
)

from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from opentrons_hardware.drivers.gpio import OT3GPIO


class EncoderPosition(int, Enum):
    encoder_position_um: np.int32

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
        if message.message_id != MessageId.encoder_position_response:
            log.warning(f"unexpected message id: 0x{message.message_id:x}")
            return
        responses[originator] = message.payload.encoder_position
        if len(responses) == len(nodes):
            event.set()

    return _listener

async def _get_encoder_position(messenger: CanMessenger):
    """This function allows us to obtain encoder position from all axes"""
    try:
        nodes = [
            NodeId.gantry_x,
            NodeId.gantry_y,
            NodeId.head_l,
            NodeId.head_r
        ]
        event = asyncio.Event()
        responses: Dict[NodeId, int] = dict()
        listener = _create_listener(nodes, event, responses)
        messenger.add_listener(listener)

        await messenger.send(node_id = NodeId.broadcast, message=EncoderPositionRequest())
        for node in nodes:
            await messenger.send(
                node_id=node,
                message=EncoderPositionRequest(),
            )
        await asyncio.wait_for(event.wait(), 1.0)
        print(responses)
        for n, r in responses.items():
            print(f"{n}: {r.value/1000}")
        messenger.remove_listener(listener)
    except asyncio.CancelledError:
        pass

async def get_encoder(args: argparse.Namespace) -> None:
    """Entry point for script."""
    async with build.can_messenger(build_settings(args)) as messenger:
        # build a GPIO handler, which will automatically release estop
        # gpio = OT3GPIO(__name__)
        # gpio.deactivate_estop()
        await _get_encoder_position(messenger)


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="CAN bus move.")
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(get_encoder(args))


if __name__ == "__main__":
    main()
