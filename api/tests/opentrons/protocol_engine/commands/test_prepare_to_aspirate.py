"""Test prepare to aspirate commands."""

from decoy import Decoy

from opentrons.protocol_engine.execution import (
    PipettingHandler,
)

from opentrons.protocol_engine.commands.prepare_to_aspirate import (
    PrepareToAspirateParams,
    PrepareToAspirateImplementation,
    PrepareToAspirateResult,
)


async def test_prepare_to_aspirate_implmenetation(
    decoy: Decoy, pipetting: PipettingHandler
) -> None:
    """A PrepareToAspirate command should have an executing implementation."""
    subject = PrepareToAspirateImplementation(pipetting=pipetting)

    data = PrepareToAspirateParams(pipetteId="some id")

    decoy.when(await pipetting.prepare_for_aspirate(pipette_id="some id")).then_return(
        None
    )

    result = await subject.execute(data)
    assert isinstance(result, PrepareToAspirateResult)
