from opentrons_shared_data.pipette import load_data
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteTipType,
)


def test_load_pipette_definition() -> None:
    pipette_config_one = load_data.load_definition(
        PipetteModelType.p50,
        PipetteChannelType.SINGLE_CHANNEL,
        PipetteVersionType(major=3, minor=3),
    )

    assert pipette_config_one.channels.as_int == 1
    assert pipette_config_one.pipette_type.value == "p50"
    assert pipette_config_one.nozzle_offset == [-8.0, -22.0, -259.15]

    assert (
        pipette_config_one.supported_tips[PipetteTipType.t50].default_aspirate_flowrate
        == 8.0
    )

    pipette_config_two = load_data.load_definition(
        PipetteModelType.p50,
        PipetteChannelType.SINGLE_CHANNEL,
        PipetteVersionType(major=1, minor=0),
    )

    assert pipette_config_two.channels.as_int == 1
    assert pipette_config_two.pipette_type.value == "p50"
    assert pipette_config_two.nozzle_offset == [0.0, 0.0, 25.0]
    assert (
        pipette_config_two.supported_tips[PipetteTipType.t200].default_aspirate_flowrate
        == 25.0
    )
