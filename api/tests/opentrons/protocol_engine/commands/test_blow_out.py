"""Test blow-out command."""
from decoy import Decoy

from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.commands import (
    BlowOutResult,
    BlowOutImplementation,
    BlowOutParams,
)
from opentrons.protocol_engine.execution import (
    MovementHandler,
)

from opentrons.hardware_control import HardwareControlAPI


async def test_blow_out_implementation(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
) -> None:
    """A PickUpTipCreate should have an execution implementation."""
    subject = BlowOutImplementation(
        state_view=state_view, hardware_api=hardware_api, movement=movement
    )

    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    data = BlowOutParams(
        pipetteId="abc", labwareId="123", wellName="A3", wellLocation=location
    )

    result = await subject.execute(data)

    assert result == BlowOutResult()

    # decoy.verify(
    #     await state_view.pipettes.get_hardware_pipette(pipette_id="pipette-id"),
    #     await movement.move_to_well(
    #         pipette_id="pipette-id",
    #         labware_id="labware-id",
    #         well_name="C6",
    #         well_location=location,
    #     ),
    #     await hardware_api.blow_out(mount=Mount.RIGHT),
    # )
