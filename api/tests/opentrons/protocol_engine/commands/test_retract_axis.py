"""Test retractAxis command."""

from decoy import Decoy

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.retract_axis import (
    RetractAxisImplementation,
    RetractAxisParams,
    RetractAxisResult,
)
from opentrons.protocol_engine.execution import MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.types import MotorAxis


async def test_retract_axis_implementation(
    decoy: Decoy,
    movement: MovementHandler,
) -> None:
    """A retractAxis command should have an execution implementation."""
    subject = RetractAxisImplementation(movement=movement)

    data = RetractAxisParams(axis=MotorAxis.Y)
    result = await subject.execute(data)

    assert result == SuccessData(
        public=RetractAxisResult(),
        state_update=update_types.StateUpdate(pipette_location=update_types.CLEAR),
    )
    decoy.verify(await movement.retract_axis(axis=MotorAxis.Y))
