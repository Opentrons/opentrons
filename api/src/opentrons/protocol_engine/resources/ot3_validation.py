"""Validation file for protocol engine commandsot."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional

from opentrons.protocol_engine.errors.exceptions import HardwareNotSupportedError

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API
    from opentrons.hardware_control.protocols import HardwareControlAPI


def ensure_ot3_hardware(
    hardware_api: HardwareControlAPI, error_msg: Optional[str] = None
) -> OT3API:
    """Validate that the HardwareControlAPI is of OT-3 instance."""
    try:
        from opentrons.hardware_control.ot3api import OT3API
    except ImportError:
        raise HardwareNotSupportedError(
            error_msg or "This command is supported by OT-3 only."
        )

    if not isinstance(hardware_api, OT3API):
        raise HardwareNotSupportedError(
            error_msg or "This command is supported by OT-3 only."
        )

    return hardware_api
