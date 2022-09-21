"""Validation file for protocol engine."""
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.protocols import HardwareControlAPI

from ..protocol_engine.errors.exceptions import HardwareNotSupported


def ensure_ot3_hardware(hardware_api: HardwareControlAPI) -> None:
    """Validate that the HardwareControlAPI is of OT-3 instance."""
    if not isinstance(hardware_api, OT3API):
        raise HardwareNotSupported("This command is supported by OT3 Only.")
