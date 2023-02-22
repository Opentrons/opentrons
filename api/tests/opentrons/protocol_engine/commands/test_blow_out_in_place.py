"""Test blow-out-in-place commands."""
from decoy import Decoy

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.commands.blow_out_in_place import (
    BlowOutInPlaceParams,
    BlowOutInPlaceResult,
    BlowOutInPlaceImplementation,
)

from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
)
from opentrons.hardware_control import HardwareControlAPI


async def test_blow_out_in_place_implementation(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,
) -> None:
    """Test BlowOut command execution."""
    subject = BlowOutInPlaceImplementation(
        state_view=state_view,
        hardware_api=hardware_api,
        pipetting=pipetting,
    )

    data = BlowOutInPlaceParams(
        pipetteId="pipette-id",
        flowRate=1.234,
    )

    result = await subject.execute(data)

    assert result == BlowOutInPlaceResult()

    decoy.verify(
        await pipetting.blow_out_in_place(pipette_id="pipette-id", flow_rate=1.234)
    )
