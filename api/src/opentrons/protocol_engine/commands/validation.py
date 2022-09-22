"""Validation file for protocol engine commandsot."""
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.protocols import HardwareControlAPI

from opentrons.protocol_engine.errors.exceptions import HardwareNotSupportedError


def ensure_ot3_hardware(hardware_api: HardwareControlAPI) -> OT3API:
    """Validate that the HardwareControlAPI is of OT-3 instance."""
    if not isinstance(hardware_api, OT3API):
        raise HardwareNotSupportedError("This command is supported by OT-3 only.")

    return hardware_api
