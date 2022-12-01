from opentrons_shared_data.pipette import load_data
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteTipType,
)


def test_load_pipette_definition() -> None:
    pipette_config = load_data.load_definition(
        PipetteModelType.p50,
        PipetteChannelType.SINGLE_CHANNEL,
        PipetteVersionType(major=1, minor=0),
    )

    assert pipette_config.channels.as_int == 1
    assert pipette_config.pipette_type.value == "p50"
    assert pipette_config.nozzle_offset == [-8.0, -22.0, -259.15]

    assert (
        pipette_config.supported_tips[PipetteTipType.t50].default_aspirate_flowrate
        == 8.0
    )
