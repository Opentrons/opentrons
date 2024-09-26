"""Test load pipette commands."""
from opentrons.protocol_engine.state.update_types import (
    LoadPipetteUpdate,
    PipetteConfigUpdate,
    StateUpdate,
)
import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution import (
    LoadedConfigureForVolumeData,
    EquipmentHandler,
)
from opentrons.protocol_engine.types import FlowRates
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.configure_for_volume import (
    ConfigureForVolumeParams,
    ConfigureForVolumeResult,
    ConfigureForVolumePrivateResult,
    ConfigureForVolumeImplementation,
)
from opentrons_shared_data.pipette.types import PipetteNameType
from ..pipette_fixtures import get_default_nozzle_map
from opentrons.types import Point


@pytest.mark.parametrize(
    "data",
    [
        ConfigureForVolumeParams(
            pipetteId="some id",
            volume=1,
        ),
        ConfigureForVolumeParams(
            pipetteId="some id",
            volume=1,
            tipOverlapNotAfterVersion="v3",
        ),
    ],
)
async def test_configure_for_volume_implementation(
    decoy: Decoy, equipment: EquipmentHandler, data: ConfigureForVolumeParams
) -> None:
    """A ConfigureForVolume command should have an execution implementation."""
    subject = ConfigureForVolumeImplementation(equipment=equipment)

    config = LoadedStaticPipetteData(
        model="some-model",
        display_name="Hello",
        min_volume=0,
        max_volume=251,
        channels=8,
        home_position=123.1,
        nozzle_offset_z=331.0,
        flow_rates=FlowRates(
            default_aspirate={}, default_dispense={}, default_blow_out={}
        ),
        tip_configuration_lookup_table={},
        nominal_tip_overlap={},
        nozzle_map=get_default_nozzle_map(PipetteNameType.P300_MULTI),
        back_left_corner_offset=Point(10, 20, 30),
        front_right_corner_offset=Point(40, 50, 60),
        pipette_lld_settings={},
    )

    decoy.when(
        await equipment.configure_for_volume(
            pipette_id="some id",
            volume=1,
            tip_overlap_version=data.tipOverlapNotAfterVersion,
        )
    ).then_return(
        LoadedConfigureForVolumeData(
            pipette_id="pipette-id",
            serial_number="some number",
            volume=1,
            static_config=config,
        )
    )

    result = await subject.execute(data)

    assert result == SuccessData(
        public=ConfigureForVolumeResult(),
        private=ConfigureForVolumePrivateResult(
            pipette_id="pipette-id", serial_number="some number", config=config
        ),
        state_update=StateUpdate(
            pipette_config=PipetteConfigUpdate(
                pipette_id="pipette-id", serial_number="some number", config=config
            )
        ),
    )
