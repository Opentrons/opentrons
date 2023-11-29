"""Validation file for protocol engine commandsot."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING

from opentrons.protocol_engine.errors import HardwareNotSupportedError
from opentrons_shared_data.robot.dev_types import RobotTypeEnum

if TYPE_CHECKING:
    from opentrons.hardware_control import HardwareControlAPI, OT3HardwareControlAPI


def ensure_ot3_hardware(
    hardware_api: HardwareControlAPI,
    error_msg: Optional[str] = None,
) -> OT3HardwareControlAPI:
    """Validate that the HardwareControlAPI is of OT-3 instance."""
    if hardware_api.get_robot_type() != RobotTypeEnum.FLEX:
        raise HardwareNotSupportedError(
            error_msg or "This command is supported by OT-3 only."
        )

    return hardware_api  # type: ignore
