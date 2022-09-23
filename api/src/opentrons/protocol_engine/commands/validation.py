"""Validation file for protocol engine commandsot."""
from __future__ import annotations
from typing import TYPE_CHECKING

from opentrons.hardware_control.protocols import HardwareControlAPI

from opentrons.protocol_engine.errors.exceptions import HardwareNotSupportedError

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


def ensure_ot3_hardware(hardware_api: HardwareControlAPI) -> OT3API:
    """Validate that the HardwareControlAPI is of OT-3 instance."""
    if not isinstance(hardware_api, OT3API):
        raise HardwareNotSupportedError("This command is supported by OT-3 only.")

    return hardware_api
