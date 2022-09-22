"""Translations from opentrons.types to OT-3 types."""
from opentrons.hardware_control.types import OT3Mount

from opentrons.types import MountType


def translate_mount_to_ot3_mount(mount: MountType) -> OT3Mount:
    """Translate MountType to OT3Mount."""
    return OT3Mount[MountType(mount).name]
