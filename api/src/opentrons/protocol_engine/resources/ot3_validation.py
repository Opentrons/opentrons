"""Validation file for protocol engine commandsot."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, cast

from opentrons.protocol_engine.errors import HardwareNotSupportedError
from opentrons_shared_data.robot.dev_types import RobotTypeEnum

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API
    from opentrons.hardware_control import HardwareControlAPI, OT3HardwareControlAPI


def ensure_ot3_hardware(
    hardware_api: HardwareControlAPI, error_msg: Optional[str] = None
) -> OT3HardwareControlAPI:
    """Validate that the HardwareControlAPI is of OT-3 instance."""
    try:
        from opentrons.hardware_control.ot3api import OT3API
    except ImportError as exception:
        raise HardwareNotSupportedError(
            error_msg or "This command is supported by OT-3 only."
        ) from exception

    if hardware_api.get_robot_type() != RobotTypeEnum.FLEX:
        raise HardwareNotSupportedError(
            error_msg or "This command is supported by OT-3 only."
        )

    return cast(OT3HardwareControlAPI, hardware_api)
