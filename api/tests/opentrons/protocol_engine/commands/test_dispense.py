"""Test dispense commands."""
from decoy import Decoy

from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset, DeckPoint
from opentrons.protocol_engine.execution import MovementHandler, PipettingHandler
from opentrons.types import Point

from opentrons.protocol_engine.commands.dispense import (
    DispenseParams,
    DispenseResult,
    DispenseImplementation,
)


async def test_dispense_implementation(
    decoy: Decoy,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> None:
    """It should move to the target location and then dispense."""
    subject = DispenseImplementation(movement=movement, pipetting=pipetting)

    well_location = WellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = DispenseParams(
        pipetteId="pipette-id-abc123",
        labwareId="labware-id-abc123",
        wellName="A3",
        wellLocation=well_location,
        volume=50,
        flowRate=1.23,
    )

    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id-abc123",
            labware_id="labware-id-abc123",
            well_name="A3",
            well_location=well_location,
        )
    ).then_return(Point(x=1, y=2, z=3))

    decoy.when(
        await pipetting.dispense_in_place(
            pipette_id="pipette-id-abc123", volume=50, flow_rate=1.23, push_out=None
        )
    ).then_return(42)

    result = await subject.execute(data)

    assert result == DispenseResult(volume=42, position=DeckPoint(x=1, y=2, z=3))
