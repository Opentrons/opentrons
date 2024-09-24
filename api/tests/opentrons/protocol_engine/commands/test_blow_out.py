"""Test blow-out command."""
from decoy import Decoy

from opentrons.types import Point
from opentrons.protocol_engine import (
    LiquidHandlingWellLocation,
    WellOrigin,
    WellOffset,
    DeckPoint,
)
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.commands import (
    BlowOutResult,
    BlowOutImplementation,
    BlowOutParams,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
)
from opentrons.hardware_control import HardwareControlAPI


async def test_blow_out_implementation(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> None:
    """Test BlowOut command execution."""
    subject = BlowOutImplementation(
        state_view=state_view,
        movement=movement,
        hardware_api=hardware_api,
        pipetting=pipetting,
    )

    location = LiquidHandlingWellLocation(
        origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
    )

    data = BlowOutParams(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="C6",
        wellLocation=location,
        flowRate=1.234,
    )

    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=location,
        )
    ).then_return(Point(x=1, y=2, z=3))

    result = await subject.execute(data)

    assert result == SuccessData(
        public=BlowOutResult(position=DeckPoint(x=1, y=2, z=3)),
        private=None,
        state_update=update_types.StateUpdate(
            pipette_location=update_types.PipetteLocationUpdate(
                pipette_id="pipette-id",
                new_location=update_types.Well(
                    labware_id="labware-id",
                    well_name="C6",
                ),
                new_deck_point=DeckPoint(x=1, y=2, z=3),
            )
        ),
    )

    decoy.verify(
        await pipetting.blow_out_in_place(pipette_id="pipette-id", flow_rate=1.234),
        times=1,
    )
