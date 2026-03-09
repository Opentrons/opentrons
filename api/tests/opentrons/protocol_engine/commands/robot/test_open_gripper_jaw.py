"""Test robot.open-gripper-jaw commands."""

from decoy import Decoy

from opentrons.hardware_control import OT3HardwareControlAPI
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.robot.open_gripper_jaw import (
    OpenGripperJawImplementation,
    OpenGripperJawParams,
    OpenGripperJawResult,
)
from opentrons.protocol_engine.state.state import StateView


async def test_open_gripper_jaw_implementation(
    decoy: Decoy,
    state_view: StateView,
    ot3_hardware_api: OT3HardwareControlAPI,
) -> None:
    """Test the `robot.openGripperJaw` implementation."""
    subject = OpenGripperJawImplementation(
        hardware_api=ot3_hardware_api, state_view=state_view
    )
    decoy.when(state_view.config.use_virtual_gripper).then_return(False)

    params = OpenGripperJawParams()

    result = await subject.execute(params=params)

    assert result == SuccessData(public=OpenGripperJawResult())
    decoy.verify(await ot3_hardware_api.home_gripper_jaw())


async def test_open_gripper_jaw_analysis(
    decoy: Decoy,
    state_view: StateView,
    ot3_hardware_api: OT3HardwareControlAPI,
) -> None:
    """Test the `robot.openGripperJaw` implementation doesn't call the hardware controller in analysis."""
    subject = OpenGripperJawImplementation(
        hardware_api=ot3_hardware_api, state_view=state_view
    )
    decoy.when(state_view.config.use_virtual_gripper).then_return(True)

    params = OpenGripperJawParams()

    result = await subject.execute(params=params)

    assert result == SuccessData(public=OpenGripperJawResult())
    decoy.verify(await ot3_hardware_api.home_gripper_jaw(), times=0)
