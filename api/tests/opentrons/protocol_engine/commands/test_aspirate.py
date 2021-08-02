"""Test aspirate commands."""
from decoy import Decoy

from opentrons.protocol_engine import WellLocation, WellOrigin
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    RunControlHandler,
)

from opentrons.protocol_engine.commands.aspirate import (
    AspirateData,
    AspirateResult,
    AspirateImplementation,
)


async def test_aspirate_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    run_control: RunControlHandler,
) -> None:
    """An Aspirate should have an execution implementation."""
    subject = AspirateImplementation(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
    )

    location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

    data = AspirateData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
        volume=50,
    )

    decoy.when(
        await pipetting.aspirate(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=location,
            volume=50,
        )
    ).then_return(42)

    result = await subject.execute(data)

    assert result == AspirateResult(volume=42)
