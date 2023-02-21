"""Test blow-out-in-place commands."""
from decoy import Decoy
from typing import cast

from opentrons.protocol_engine.state import StateView, HardwarePipette
from opentrons.protocol_engine.commands.blow_out_in_place import (
    BlowOutInPlaceParams,
    BlowOutInPlaceResult,
    BlowOutInPlaceImplementation,
)

from opentrons.protocol_engine.execution import (
    MovementHandler,
    PipettingHandler,
)
from opentrons.types import Mount
from opentrons.hardware_control.dev_types import PipetteDict
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

    left_config = cast(PipetteDict, {"name": "p300_single", "pipette_id": "123"})
    right_config = cast(PipetteDict, {"name": "p300_multi", "pipette_id": "abc"})

    pipette_dict_by_mount = {Mount.LEFT: left_config, Mount.RIGHT: right_config}

    left_pipette = HardwarePipette(mount=Mount.LEFT, config=left_config)

    decoy.when(hardware_api.attached_instruments).then_return(pipette_dict_by_mount)
    decoy.when(
        state_view.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=pipette_dict_by_mount,
        )
    ).then_return(HardwarePipette(mount=Mount.LEFT, config=left_config))

    data = BlowOutInPlaceParams(
        pipetteId="pipette-id",
        flowRate=1.234,
    )

    mock_flow_rate_context = decoy.mock(name="mock flow rate context")
    decoy.when(
        pipetting.set_flow_rate(
            pipette=HardwarePipette(mount=Mount.LEFT, config=left_config),
            blow_out_flow_rate=1.234,
        )
    ).then_return(mock_flow_rate_context)

    result = await subject.execute(data)

    assert result == BlowOutInPlaceResult()

    decoy.verify(
        mock_flow_rate_context.__enter__(),
        await hardware_api.blow_out(mount=left_pipette.mount),
        mock_flow_rate_context.__exit__(None, None, None),
    )
