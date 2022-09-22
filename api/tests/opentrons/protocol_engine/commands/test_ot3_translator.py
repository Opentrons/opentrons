"""Test file for ot3_translator."""
from decoy import Decoy

from opentrons.protocol_engine.commands.ot3_translator import (
    translate_mount_to_ot3_mount,
)

from opentrons.hardware_control.types import OT3Mount

from opentrons.types import MountType


def test_translate_mount_to_ot3_mount(decoy: Decoy) -> None:
    """Should translate a MountType to OT3Mount."""
    assert translate_mount_to_ot3_mount(MountType.LEFT) == OT3Mount.LEFT

    assert translate_mount_to_ot3_mount(MountType.RIGHT) == OT3Mount.RIGHT
