"""Test load pipette commands."""
from decoy import Decoy

from opentrons.protocol_engine.execution import (
    LoadedConfigureForVolumeData,
    EquipmentHandler,
)
from opentrons.protocol_engine.types import FlowRates
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)

from opentrons.protocol_engine.commands.configure_for_volume import (
    ConfigureForVolumeParams,
    ConfigureForVolumeResult,
    ConfigureForVolumePrivateResult,
    ConfigureForVolumeImplementation,
)


async def test_configure_for_volume_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
) -> None:
    """A ConfigureForVolume command should have an execution implementation."""
    subject = ConfigureForVolumeImplementation(equipment=equipment)

    data = ConfigureForVolumeParams(
        pipetteId="some id",
        volume=1,
    )

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
    )

    decoy.when(
        await equipment.configure_for_volume(
            pipette_id="some id",
            volume=1,
        )
    ).then_return(
        LoadedConfigureForVolumeData(
            pipette_id="pipette-id",
            serial_number="some number",
            volume=1,
            static_config=config,
        )
    )

    result, private_result = await subject.execute(data)

    assert result == ConfigureForVolumeResult()
    assert private_result == ConfigureForVolumePrivateResult(
        pipette_id="pipette-id", serial_number="some number", config=config
    )
