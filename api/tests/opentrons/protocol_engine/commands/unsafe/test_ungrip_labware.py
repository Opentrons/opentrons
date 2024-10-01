"""Test update-position-estimator commands."""
from decoy import Decoy

from opentrons.protocol_engine.commands.unsafe.unsafe_ungrip_labware import (
    UnsafeUngripLabwareParams,
    UnsafeUngripLabwareResult,
    UnsafeUngripLabwareImplementation,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.execution import GantryMover
from opentrons.protocol_engine.types import MotorAxis
from opentrons.hardware_control import OT3HardwareControlAPI
from opentrons.hardware_control.types import Axis


async def test_engage_axes_implementation(
    decoy: Decoy, ot3_hardware_api: OT3HardwareControlAPI, gantry_mover: GantryMover
) -> None:
    """Test EngageAxes command execution."""
    subject = UnsafeUngripLabwareImplementation(hardware_api=ot3_hardware_api)

    result = await subject.execute(params=UnsafeUngripLabwareParams())

    assert result == SuccessData(public=UnsafeUngripLabwareResult(), private=None)

    decoy.verify(
        await ot3_hardware_api.ungrip(),
    )
