"""Test pipette data provider."""
from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.protocol_engine.types import FlowRates
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)

from opentrons.protocol_engine.resources import pipette_data_provider as subject


def test_get_virtual_pipette_static_config() -> None:
    """It should return config data given a pipette name."""
    result = subject.get_virtual_pipette_static_config(
        PipetteNameType.P20_SINGLE_GEN2.value
    )

    assert result == LoadedStaticPipetteData(
        model="p20_single_v2.0",
        display_name="P20 Single-Channel GEN2",
        min_volume=1,
        max_volume=20.0,
        channels=1,
        nozzle_offset_z=10.45,
        home_position=172.15,
        flow_rates=FlowRates(
            default_aspirate={"2.0": 3.78, "2.6": 7.56},
            default_dispense={"2.0": 3.78, "2.6": 7.56},
            default_blow_out={"2.0": 3.78, "2.6": 7.56},
        ),
        return_tip_scale=0.5,
        nominal_tip_overlap={
            "default": 8.25,
            "opentrons/eppendorf_96_tiprack_10ul_eptips/1": 8.4,
            "opentrons/geb_96_tiprack_10ul/1": 8.3,
            "opentrons/opentrons_96_filtertiprack_10ul/1": 8.25,
            "opentrons/opentrons_96_filtertiprack_20ul/1": 8.25,
            "opentrons/opentrons_96_tiprack_10ul/1": 8.25,
            "opentrons/opentrons_96_tiprack_20ul/1": 8.25,
        },
    )


def test_get_pipette_static_config() -> None:
    """It should return config data given a pipette model and serial."""
    result = subject.get_pipette_static_config("p1000_multi_v3.1", "abc-123")  # type: ignore[arg-type]

    assert result == LoadedStaticPipetteData(
        model="p1000_multi_v3.1",
        display_name="P1000 8-Channel GEN3",
        min_volume=1,
        max_volume=1000.0,
        channels=8,
        nozzle_offset_z=-259.15,
        home_position=230.15,
        flow_rates=FlowRates(
            default_aspirate={"2.0": 159.04, "2.6": 159.04},
            default_dispense={"2.0": 159.04},
            default_blow_out={"2.0": 78.52},
        ),
        return_tip_scale=0.83,
        nominal_tip_overlap={
            "default": 10.5,
            "opentrons/opentrons_ot3_96_tiprack_1000ul/1": 10.5,
            "opentrons/opentrons_ot3_96_tiprack_200ul/1": 10.5,
        },
    )
