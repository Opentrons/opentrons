import pytest
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


@pytest.mark.parametrize(
    argnames=["key_spot_check", "value_spot_check"],
    argvalues=[
        ["P1KSV10", "p1000_single_v1.0"],
        ["P1KHV33", "p1000_96_v3.3"],
        ["P20MV21", "p20_multi_v2.1"],
        ["P300MV10", "p300_multi_v1.0"],
        ["P3HMV14", "p300_multi_v1.4"],
    ],
)
def test_build_serial_number_lookup(key_spot_check: str, value_spot_check: str) -> None:
    lookup_table = load_data.load_serial_lookup_table()
    assert lookup_table[key_spot_check] == value_spot_check
