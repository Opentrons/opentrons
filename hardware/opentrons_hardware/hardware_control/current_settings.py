"""Utilities for updating the current settings on the OT3."""
import asyncio
from lib2to3.pytree import Node
from typing import Dict, Tuple

from opentrons_ot3_firmware import ArbitrationId
from opentrons_ot3_firmware.constants import NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_ot3_firmware.messages import payloads, MessageDefinition
from opentrons_ot3_firmware.messages.message_definitions import (
    WriteMotorCurrentRequest
)
from opentrons_ot3_firmware.utils import UInt32Field


async def set_currents(
        can_messenger: CanMessenger, current_settings: Dict[NodeId, Tuple[float]],
) -> None:
    for node, currents in current_settings.items():
        await can_messenger.send(
            node_id=node,
            message=WriteMotorCurrentRequest(
                payload=payloads.MotorCurrentPayload(
                    hold_current=UInt32Field(int(currents[0] * (2**16))),
                    run_current=UInt32Field(int(currents[1] * (2**16))),
                )
            )
        )


async def set_run_current(
        can_messenger: CanMessenger, current_settings: Dict[NodeId, float]
) -> None:
    for node, current in current_settings.items():
        await can_messenger.send(
            node_id=node,
            message=WriteMotorCurrentRequest(
                payload=payloads.MotorCurrentPayload(
                    hold_current=UInt32Field(0),
                    run_current=UInt32Field(int(current * (2**16))),
                )
            )
        )


async def set_hold_current(
        can_messenger: CanMessenger, current_settings: Dict[NodeId, float]
) -> None:
    for node, current in current_settings.items():
        await can_messenger.send(
            node_id=node,
            message=WriteMotorCurrentRequest(
                payload=payloads.MotorCurrentPayload(
                    hold_current=UInt32Field(int(current * (2**16))),
                    run_current=UInt32Field(0),
                )
            )
        )
