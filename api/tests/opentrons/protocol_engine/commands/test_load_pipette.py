"""Test load pipette commands."""
from decoy import Decoy

from opentrons.types import MountType
from opentrons.protocol_engine.types import PipetteName
from opentrons.protocol_engine.execution import CommandHandlers, LoadedPipette
from opentrons.protocol_engine.commands.load_pipette import (
    LoadPipetteData,
    LoadPipetteResult,
    LoadPipetteImplementation,
)


async def test_load_pipette_implementation(
    decoy: Decoy,
    command_handlers: CommandHandlers,
) -> None:
    """A LoadPipetteRequest should have an execution implementation."""
    data = LoadPipetteData(
        pipetteName=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
        pipetteId="some id",
    )

    decoy.when(
        await command_handlers.equipment.load_pipette(
            pipette_name=PipetteName.P300_SINGLE,
            mount=MountType.LEFT,
            pipette_id="some id",
        )
    ).then_return(LoadedPipette(pipette_id="pipette-id"))

    subject = LoadPipetteImplementation(data)
    result = await subject.execute(command_handlers)

    assert result == LoadPipetteResult(pipetteId="pipette-id")
