"""Test load pipette commands."""
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import MountType
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
        pipetteName="p50_single_flex",
        mount=MountType.LEFT,
        pipetteId="some id",
        volume=1,
    )

    decoy.when(
        await equipment.configure_for_volume(
            pipette_name="p50_single_flex",
            mount=MountType.LEFT,
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
