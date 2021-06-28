"""Test load pipette commands."""
from decoy import Decoy

from opentrons.types import MountType
from opentrons.protocol_engine.types import PipetteName

from opentrons.protocol_engine.execution import (
    LoadedPipette,
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
)
from opentrons.protocol_engine.commands.load_pipette import (
    LoadPipetteData,
    LoadPipetteResult,
    LoadPipetteImplementation,
)


async def test_load_pipette_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> None:
    """A LoadPipette command should have an execution implementation."""
    subject = LoadPipetteImplementation(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
    )

    data = LoadPipetteData(
        pipetteName=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
        pipetteId="some id",
    )

    decoy.when(
        await equipment.load_pipette(
            pipette_name=PipetteName.P300_SINGLE,
            mount=MountType.LEFT,
            pipette_id="some id",
        )
    ).then_return(LoadedPipette(pipette_id="pipette-id"))

    result = await subject.execute(data)

    assert result == LoadPipetteResult(pipetteId="pipette-id")
