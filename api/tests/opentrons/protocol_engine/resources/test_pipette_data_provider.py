"""Test pipette data provider."""
from typing import Dict
from opentrons_shared_data.pipette.dev_types import PipetteNameType, PipetteModel
from opentrons_shared_data.pipette import (
    pipette_definition,
    types as pip_types,
    pipette_load_name_conversions,
)

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
        channels=1,
        nozzle_offset_z=10.45,
        home_position=172.15,
        liquid_properties=result.liquid_properties,
    )


def test_get_pipette_static_config() -> None:
    """It should return config data given a PipetteDict."""
    model_version = pipette_load_name_conversions.convert_pipette_model(
        PipetteModel("p300_single_v2.0")
    )
    result = subject.get_pipette_static_config(model_version)

    assert result == LoadedStaticPipetteData(
        model="p300_single_v2.0",
        display_name="P300 Single-Channel GEN2",
        channels=1,
        liquid_properties=result.liquid_properties,
        nozzle_offset_z=29.45,
        home_position=172.15,
    )
