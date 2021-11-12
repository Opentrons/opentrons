"""Test move relative commands."""
from decoy import Decoy

from opentrons.protocol_engine.types import MotorAxis

from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    RunControlHandler,
)

from opentrons.protocol_engine.commands.home import (
    HomeParams,
    HomeResult,
    HomeImplementation,
)


async def test_home_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    run_control: RunControlHandler,
) -> None:
    """A Home command should have an execution implementation."""
    subject = HomeImplementation(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
    )

    data = HomeParams(axes=[MotorAxis.X, MotorAxis.Y])

    result = await subject.execute(data)

    assert result == HomeResult()
    decoy.verify(await movement.home(axes=[MotorAxis.X, MotorAxis.Y]))


async def test_home_all_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    run_control: RunControlHandler,
) -> None:
    """A Home command should have an execution implementation."""
    subject = HomeImplementation(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
    )

    data = HomeParams()

    result = await subject.execute(data)

    assert result == HomeResult()
    decoy.verify(await movement.home(axes=None))
