"""Test the subsystem models."""

from opentrons.hardware_control.types import SubSystem as HWSubSystem

from robot_server.subsystems.models import SubSystem


def test_subsystem() -> None:
    """It should roundtrip all subsystems."""
    for subsystem in HWSubSystem:
        assert SubSystem.from_hw(subsystem) is not None
        assert SubSystem.from_hw(subsystem).to_hw() == subsystem
