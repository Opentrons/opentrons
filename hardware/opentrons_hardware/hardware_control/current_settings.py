"""Utilities for updating the current settings on the OT3."""
import asyncio
import logging
from typing import Set, Optional, Dict

from anyio import current_effective_deadline
from numpy import uint32
from opentrons_ot3_firmware import ArbitrationId
from opentrons_ot3_firmware.constants import NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_ot3_firmware.messages import payloads, MessageDefinition
from opentrons_ot3_firmware.messages.message_definitions import (
    WriteMotorCurrentRequest
)
from opentrons_ot3_firmware.utils import UInt16Field, UInt32Field, Int32Field



async def set_current(can_messenger: CanMessenger, current_settings: Dict[NodeId, float]):
    for node, current in current_settings.items():
        await can_messenger.send(
            node_id=node,
            message=WriteMotorCurrentRequest(
                payload=payloads.MotorCurrentPayload(
                    active_current=UInt32Field(0),
                    idle_current=UInt16Field(0),
                )
            )
        )

