"""Utilities for updating the enable/disable state of an OT3 axis."""
from typing import Set
import logging
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EnableMotorRequest,
    DisableMotorRequest,
    GearEnableMotorRequest,
    GearDisableMotorRequest,
)
from opentrons_hardware.firmware_bindings.constants import NodeId, ErrorCode

log = logging.getLogger(__name__)


async def set_enable_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set enable motor each node."""
    for node in nodes:
        error = await can_messenger.ensure_send(
            node_id=node,
            message=EnableMotorRequest(),
            expected_nodes=[node],
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error {str(error)} trying to enable {str(node)} ")


async def set_disable_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set disable motor each node."""
    for node in nodes:
        error = await can_messenger.ensure_send(
            node_id=node,
            message=DisableMotorRequest(),
            expected_nodes=[node],
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error {str(error)} trying to disable {str(node)} ")


async def set_enable_tip_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set enable motor each node."""
    for node in nodes:
        error = await can_messenger.ensure_send(
            node_id=node,
            message=GearEnableMotorRequest(),
            expected_nodes=[node],
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error {str(error)} trying to enable {str(node)} ")


async def set_disable_tip_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set disable motor each node."""
    for node in nodes:
        error = await can_messenger.ensure_send(
            node_id=node,
            message=GearDisableMotorRequest(),
            expected_nodes=[node],
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error {str(error)} trying to disable {str(node)} ")
