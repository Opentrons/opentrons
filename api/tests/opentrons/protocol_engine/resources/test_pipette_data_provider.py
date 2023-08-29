"""Test pipette data provider."""
from typing import Dict
from opentrons_shared_data.pipette.dev_types import PipetteNameType, PipetteModel
from opentrons_shared_data.pipette import pipette_definition, types as pip_types

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_engine.types import FlowRates
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)

from opentrons.protocol_engine.resources import pipette_data_provider as subject


def test_get_virtual_pipette_static_config(
    pipette_liquid_properties_fixture: Dict[
        pip_types.LiquidClasses, pipette_definition.PipetteLiquidPropertiesDefinition
    ]
) -> None:
    """It should return config data given a pipette name."""
    result = subject.get_virtual_pipette_static_config(
        PipetteNameType.P20_SINGLE_GEN2.value
    )

    assert result == LoadedStaticPipetteData(
        model="p20_single_v2.0",
        display_name="P20 Single-Channel GEN2",
        channels=1,
        nozzle_offset_z=10.45,
        home_position=172.15,
        liquid_properties=pipette_liquid_properties_fixture,
    )


def test_get_pipette_static_config(
    pipette_liquid_properties_fixture: Dict[
        pip_types.LiquidClasses, pipette_definition.PipetteLiquidPropertiesDefinition
    ],
) -> None:
    """It should return config data given a PipetteDict."""
    pipette_dict: PipetteDict = {
        "name": "p300_single_gen2",
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
        "liquid_properties": pipette_liquid_properties_fixture,
    }

    result = subject.get_pipette_static_config(pipette_dict)

    assert result == LoadedStaticPipetteData(
        model="p300_single_v2.0",
        display_name="P300 Single-Channel GEN2",
        channels=1,
        liquid_properties=pipette_liquid_properties_fixture,
        # TODO(mc, 2023-02-28): these two values are not present in PipetteDict
        # https://opentrons.atlassian.net/browse/RCORE-655
        nozzle_offset_z=0,
        home_position=0,
    )
