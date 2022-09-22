"""Validation file for protocol engine."""
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.protocols import HardwareControlAPI
from opentrons.hardware_control.types import OT3Mount

from opentrons.protocol_engine.errors.exceptions import HardwareNotSupported

from opentrons.types import MountType


def ensure_ot3_hardware(hardware_api: HardwareControlAPI) -> OT3API:
    """Validate that the HardwareControlAPI is of OT-3 instance."""
    if not isinstance(hardware_api, OT3API):
        raise HardwareNotSupported("This command is supported by OT3 Only.")

    return hardware_api


def translate_mount_to_ot3_mount(mount: str) -> OT3Mount:
    """Translate MountType to OT3Mount."""
    return OT3Mount[MountType(mount).name]
