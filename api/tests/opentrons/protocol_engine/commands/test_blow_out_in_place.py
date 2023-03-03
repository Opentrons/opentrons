"""Test blow-out-in-place commands."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.commands.blow_out_in_place import (
    BlowOutInPlaceParams,
    BlowOutInPlaceResult,
    BlowOutInPlaceImplementation,
)
from opentrons.protocol_engine.errors import TipNotAttachedError

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

async def test_blow_out_raises_no_tip_attached(
        decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
    pipetting: PipettingHandler,) -> None:
    """Should raise an error that there is no tip attached"""
    subject = BlowOutInPlaceImplementation(
        state_view=state_view,
        movement=movement,
        hardware_api=hardware_api,
        pipetting=pipetting,
    )

    data = BlowOutInPlaceParams(
        pipetteId="pipette-id",
        flowRate=1.234,
    )

    decoy.when(await pipetting.blow_out_in_place(pipette_id="pipette-id", flow_rate=1.234)).then_raise(TipNotAttachedError())

    with pytest.raises(TipNotAttachedError):
        await subject.execute(data)