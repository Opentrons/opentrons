"""Test retractAxis command."""
from decoy import Decoy

from opentrons.protocol_engine.types import MotorAxis
from opentrons.protocol_engine.execution import MovementHandler

from opentrons.protocol_engine.commands.retract_axis import (
    RetractAxisParams,
    RetractAxisResult,
    RetractAxisImplementation,
)


async def test_retract_axis_implementation(
    decoy: Decoy,
    movement: MovementHandler,
) -> None:
    """A retractAxis command should have an execution implementation."""
    subject = RetractAxisImplementation(movement=movement)

    data = RetractAxisParams(axis=MotorAxis.Y)
    result = await subject.execute(data)

    assert result == RetractAxisResult()
    decoy.verify(await movement.retract_axis(axis=MotorAxis.Y))
