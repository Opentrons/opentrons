"""Test load pipette commands."""
from decoy import Decoy

from opentrons.types import MountType
from opentrons.protocol_engine.types import PipetteName
from opentrons.protocol_engine.execution import LoadedPipetteData, EquipmentHandler

from opentrons.protocol_engine.commands.load_pipette import (
    LoadPipetteParams,
    LoadPipetteResult,
    LoadPipetteImplementation,
)


async def test_load_pipette_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
) -> None:
    """A LoadPipette command should have an execution implementation."""
    subject = LoadPipetteImplementation(equipment=equipment)

    data = LoadPipetteParams(
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
    ).then_return(LoadedPipetteData(pipette_id="pipette-id"))

    result = await subject.execute(data)

    assert result == LoadPipetteResult(pipetteId="pipette-id")
