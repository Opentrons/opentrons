"""Utilities for updating the enable/disable state of an OT3 axis."""
from typing import Set

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EnableMotorRequest,
    DisableMotorRequest,
)
from opentrons_hardware.firmware_bindings.constants import NodeId


async def set_enable_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set enable motor each node."""
    for node in nodes:
        await can_messenger.send(
            node_id=node,
            message=EnableMotorRequest(),
        )


async def set_disable_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set disable motor each node."""
    for node in nodes:
        await can_messenger.send(
            node_id=node,
            message=DisableMotorRequest(),
        )
