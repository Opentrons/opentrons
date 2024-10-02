"""Test update-position-estimator commands."""
from decoy import Decoy

from opentrons.protocol_engine.commands.unsafe.unsafe_ungrip_labware import (
    UnsafeUngripLabwareParams,
    UnsafeUngripLabwareResult,
    UnsafeUngripLabwareImplementation,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.errors.exceptions import GripperNotAttachedError
from opentrons.hardware_control import OT3HardwareControlAPI
import pytest


async def test_ungrip_labware_implementation(
    decoy: Decoy, ot3_hardware_api: OT3HardwareControlAPI
) -> None:
    """Test UngripLabware command execution."""
    subject = UnsafeUngripLabwareImplementation(hardware_api=ot3_hardware_api)

    decoy.when(ot3_hardware_api.has_gripper()).then_return(True)

    result = await subject.execute(params=UnsafeUngripLabwareParams())

    assert result == SuccessData(public=UnsafeUngripLabwareResult(), private=None)

    decoy.verify(
        await ot3_hardware_api.ungrip(),
    )


async def test_ungrip_labware_implementation_raises_no_gripper_attached(
    decoy: Decoy, ot3_hardware_api: OT3HardwareControlAPI
) -> None:
    """Test UngripLabware command execution."""
    subject = UnsafeUngripLabwareImplementation(hardware_api=ot3_hardware_api)

    decoy.when(ot3_hardware_api.has_gripper()).then_return(False)
    with pytest.raises(GripperNotAttachedError):
        await subject.execute(params=UnsafeUngripLabwareParams())
