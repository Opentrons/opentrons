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
        min_volume=1,
        max_volume=20.0,
        channels=1,
        flow_rates=FlowRates(
            default_aspirate={"2.0": 3.78, "2.6": 7.56},
            default_dispense={"2.0": 3.78, "2.6": 7.56},
            default_blow_out={"2.0": 3.78, "2.6": 7.56},
        ),
    )


def test_get_pipette_static_config() -> None:
    """It should return config data given a pipette model and serial."""
    result = subject.get_pipette_static_config("p1000_multi_v3.1", "abc-123")  # type: ignore[arg-type]

    assert result == LoadedStaticPipetteData(
        model="p1000_multi_v3.1",
        min_volume=1,
        max_volume=1000.0,
        channels=8,
        flow_rates=FlowRates(
            default_aspirate={"2.0": 159.04, "2.6": 159.04},
            default_dispense={"2.0": 159.04},
            default_blow_out={"2.0": 78.52},
        ),
    )
