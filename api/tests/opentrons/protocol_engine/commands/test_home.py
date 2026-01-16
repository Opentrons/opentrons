"""Test home commands."""

from decoy import Decoy

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.home import (
    HomeImplementation,
    HomeParams,
    HomeResult,
)
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.types import MotorAxis
from opentrons.types import MountType


async def test_home_implementation(decoy: Decoy, movement: MovementHandler) -> None:
    """A Home command should have an execution implementation."""
    subject = HomeImplementation(movement=movement)

    data = HomeParams(axes=[MotorAxis.X, MotorAxis.Y])

    result = await subject.execute(data)

    assert result == SuccessData(
        public=HomeResult(),
        state_update=update_types.StateUpdate(pipette_location=update_types.CLEAR),
    )
    decoy.verify(await movement.home(axes=[MotorAxis.X, MotorAxis.Y]))


async def test_home_all_implementation(decoy: Decoy, movement: MovementHandler) -> None:
    """It should pass axes=None along to the movement handler."""
    subject = HomeImplementation(movement=movement)

    data = HomeParams()

    result = await subject.execute(data)

    assert result == SuccessData(
        public=HomeResult(),
        state_update=update_types.StateUpdate(pipette_location=update_types.CLEAR),
    )
    decoy.verify(await movement.home(axes=None))


async def test_home_with_invalid_position(
    decoy: Decoy, movement: MovementHandler
) -> None:
    """Test handling when the homing is conditional (only move if position invalid)."""
    subject = HomeImplementation(movement=movement)

    decoy.when(
        await movement.check_for_valid_position(mount=MountType.LEFT)
    ).then_return(False)

    data = HomeParams(
        axes=[MotorAxis.X, MotorAxis.Y], skipIfMountPositionOk=MountType.LEFT
    )

    result = await subject.execute(data)
    assert result == SuccessData(
        public=HomeResult(),
        state_update=update_types.StateUpdate(pipette_location=update_types.CLEAR),
    )

    decoy.verify(await movement.home(axes=[MotorAxis.X, MotorAxis.Y]), times=1)
    decoy.reset()

    decoy.when(
        await movement.check_for_valid_position(mount=MountType.LEFT)
    ).then_return(True)
    result = await subject.execute(data)
    assert result == SuccessData(
        public=HomeResult(),
        state_update=update_types.StateUpdate(pipette_location=update_types.CLEAR),
    )

    decoy.verify(await movement.home(axes=[MotorAxis.X, MotorAxis.Y]), times=0)
