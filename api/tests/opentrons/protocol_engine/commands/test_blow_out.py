"""Test blow-out command."""
from decoy import Decoy
from typing import cast

from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.state import StateView, HardwarePipette
from opentrons.protocol_engine.commands import (
    BlowOutResult,
    BlowOutImplementation,
    BlowOutParams,
)
from opentrons.protocol_engine.execution import (
    MovementHandler,
)
from opentrons.types import Mount
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control import HardwareControlAPI


async def test_blow_out_implementation(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
) -> None:
    """Test BlowOut command execution."""
    subject = BlowOutImplementation(
        state_view=state_view, movement=movement, hardware_api=hardware_api
    )

    left_config = cast(PipetteDict, {"name": "p300_single", "pipette_id": "123"})
    right_config = cast(PipetteDict, {"name": "p300_multi", "pipette_id": "abc"})

    pipette_dict_by_mount = {Mount.LEFT: left_config, Mount.RIGHT: right_config}

    left_pipette = HardwarePipette(mount=Mount.LEFT, config=left_config)

    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    decoy.when(hardware_api.attached_instruments).then_return(pipette_dict_by_mount)
    decoy.when(
        state_view.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=pipette_dict_by_mount,
        )
    ).then_return(HardwarePipette(mount=Mount.LEFT, config=left_config))

    data = BlowOutParams(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="C6",
        wellLocation=location,
    )

    result = await subject.execute(data)

    assert result == BlowOutResult()

    decoy.verify(
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=location,
        ),
        await hardware_api.blow_out(mount=left_pipette.mount),
    )
