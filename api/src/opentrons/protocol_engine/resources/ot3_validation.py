"""Validation file for protocol engine commandsot."""
from __future__ import annotations
from typing import Optional

from opentrons.protocol_engine.errors import HardwareNotSupportedError
from opentrons.hardware_control.protocols.types import FlexRobotType

from opentrons.hardware_control import HardwareControlAPI, OT3HardwareControlAPI


def ensure_ot3_hardware(
    hardware_api: HardwareControlAPI,
    error_msg: Optional[str] = None,
) -> OT3HardwareControlAPI:
    """Validate that the HardwareControlAPI is of OT-3 instance."""
    if hardware_api.get_robot_type() == FlexRobotType:
        return hardware_api  # type: ignore

    raise HardwareNotSupportedError(
        error_msg or "This command is supported by OT-3 only."
    )
