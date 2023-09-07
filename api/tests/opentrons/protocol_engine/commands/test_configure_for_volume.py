"""Test load pipette commands."""
from decoy import Decoy

from opentrons.protocol_engine.execution import (
    LoadedConfigureForVolumeData,
    EquipmentHandler,
)

from opentrons.protocol_engine.commands.configure_for_volume import (
    ConfigureForVolumeParams,
    ConfigureForVolumeResult,
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

    decoy.when(
        await equipment.configure_for_volume(
            pipette_id="some id",
            volume=1,
        )
    ).then_return(
        LoadedConfigureForVolumeData(
            pipette_id="pipette-id", serial_number="some number", volume=1
        )
    )

    result = await subject.execute(data)

    assert result == ConfigureForVolumeResult(pipetteId="pipette-id")
