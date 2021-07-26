"""Test move to well commands."""
from decoy import Decoy

from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    RunControlHandler,
)

from opentrons.protocol_engine.commands.move_to_well import (
    MoveToWellData,
    MoveToWellResult,
    MoveToWellImplementation,
)


async def test_move_to_well_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    run_control: RunControlHandler,
) -> None:
    """A MoveToWell command should have an execution implementation."""
    subject = MoveToWellImplementation(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
    )

    data = MoveToWellData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    result = await subject.execute(data)

    assert result == MoveToWellResult()
    decoy.verify(
        await movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
        )
    )
