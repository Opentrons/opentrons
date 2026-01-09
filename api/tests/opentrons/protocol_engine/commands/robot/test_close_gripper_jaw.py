"""Test robot.open-gripper-jaw commands."""

from decoy import Decoy

from opentrons.hardware_control import OT3HardwareControlAPI
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.robot.close_gripper_jaw import (
    CloseGripperJawImplementation,
    CloseGripperJawParams,
    CloseGripperJawResult,
)
from opentrons.protocol_engine.state.state import StateView


async def test_close_gripper_jaw_implementation(
    decoy: Decoy,
    state_view: StateView,
    ot3_hardware_api: OT3HardwareControlAPI,
) -> None:
    """Test the `robot.closeGripperJaw` implementation."""
    subject = CloseGripperJawImplementation(
        hardware_api=ot3_hardware_api, state_view=state_view
    )
    decoy.when(state_view.config.use_virtual_gripper).then_return(False)

    params = CloseGripperJawParams(force=10)

    result = await subject.execute(params=params)

    assert result == SuccessData(public=CloseGripperJawResult())
    decoy.verify(await ot3_hardware_api.grip(force_newtons=10))


async def test_close_gripper_jaw_analysis(
    decoy: Decoy,
    state_view: StateView,
    ot3_hardware_api: OT3HardwareControlAPI,
) -> None:
    """Test that closeGripperJaw doesn't call the hardware controller in analysis."""
    subject = CloseGripperJawImplementation(
        hardware_api=ot3_hardware_api, state_view=state_view
    )
    decoy.when(state_view.config.use_virtual_gripper).then_return(True)

    params = CloseGripperJawParams(force=10)

    result = await subject.execute(params=params)

    assert result == SuccessData(public=CloseGripperJawResult())
    decoy.verify(await ot3_hardware_api.grip(force_newtons=10), times=0)
