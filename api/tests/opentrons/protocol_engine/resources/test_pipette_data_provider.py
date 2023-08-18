"""Test pipette data provider."""
from opentrons_shared_data.pipette.dev_types import PipetteNameType, PipetteModel
from opentrons_shared_data.pipette import pipette_definition, types as pip_types

from opentrons.hardware_control.dev_types import PipetteDict
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
        tip_configuration_lookup_table=result.tip_configuration_lookup_table,
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


def test_get_pipette_static_config(
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
) -> None:
    """It should return config data given a PipetteDict."""
    pipette_dict: PipetteDict = {
        "name": "p300_single_gen2",
        "min_volume": 20,
        "max_volume": 300,
        "channels": 1,
        "aspirate_flow_rate": 46.43,
        "dispense_flow_rate": 46.43,
        "pipette_id": "P3HSV202020060308",
        "current_volume": 0.0,
        "display_name": "P300 Single-Channel GEN2",
        "tip_length": 0.0,
        "model": PipetteModel("p300_single_v2.0"),
        "blow_out_flow_rate": 46.43,
        "working_volume": 300,
        "tip_overlap": {
            "default": 8.2,
            "opentrons/opentrons_96_tiprack_300ul/1": 8.2,
            "opentrons/opentrons_96_filtertiprack_200ul/1": 8.2,
        },
        "available_volume": 300.0,
        "return_tip_height": 0.5,
        "default_aspirate_flow_rates": {"2.0": 46.43, "2.1": 92.86},
        "default_blow_out_flow_rates": {"2.0": 46.43, "2.2": 92.86},
        "default_dispense_flow_rates": {"2.0": 46.43, "2.3": 92.86},
        "back_compat_names": ["p300_single"],
        "has_tip": False,
        "aspirate_speed": 5.021202,
        "dispense_speed": 5.021202,
        "blow_out_speed": 5.021202,
        "ready_to_aspirate": False,
        "default_blow_out_speeds": {"2.0": 5.021202, "2.6": 10.042404},
        "default_dispense_speeds": {"2.0": 5.021202, "2.6": 10.042404},
        "default_aspirate_speeds": {"2.0": 5.021202, "2.6": 10.042404},
        "default_blow_out_volume": 10,
        "supported_tips": {pip_types.PipetteTipType.t300: supported_tip_fixture},
    }

    result = subject.get_pipette_static_config(pipette_dict)

    assert result == LoadedStaticPipetteData(
        model="p300_single_v2.0",
        display_name="P300 Single-Channel GEN2",
        min_volume=20,
        max_volume=300,
        channels=1,
        flow_rates=FlowRates(
            default_aspirate={"2.0": 46.43, "2.1": 92.86},
            default_dispense={"2.0": 46.43, "2.3": 92.86},
            default_blow_out={"2.0": 46.43, "2.2": 92.86},
        ),
        tip_configuration_lookup_table={300: supported_tip_fixture},
        nominal_tip_overlap={
            "default": 8.2,
            "opentrons/opentrons_96_tiprack_300ul/1": 8.2,
            "opentrons/opentrons_96_filtertiprack_200ul/1": 8.2,
        },
        # TODO(mc, 2023-02-28): these two values are not present in PipetteDict
        # https://opentrons.atlassian.net/browse/RCORE-655
        nozzle_offset_z=0,
        home_position=0,
    )
