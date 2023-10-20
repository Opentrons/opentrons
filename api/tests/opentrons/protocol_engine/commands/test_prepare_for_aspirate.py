"""Test prepare for aspirate commands."""

from decoy import Decoy

from opentrons.protocol_engine.execution import (
    PipettingHandler,
)

from opentrons.protocol_engine.commands.prepare_for_aspirate import (
    PrepareForAspirateParams,
    PrepareForAspirateImplementation,
    PrepareForAspirateResult,
)


async def test_prepare_for_aspirate_implmenetation(
    decoy: Decoy, pipetting: PipettingHandler
) -> None:
    """A PrepareForAspirate command should have an executing implementation."""
    subject = PrepareForAspirateImplementation(pipetting=pipetting)

    data = PrepareForAspirateParams(pipetteId="some id")

    decoy.when(await pipetting.prepare_for_aspirate(pipette_id="some id")).then_return(
        None
    )

    result = await subject.execute(data)
    assert isinstance(result, PrepareForAspirateResult)
