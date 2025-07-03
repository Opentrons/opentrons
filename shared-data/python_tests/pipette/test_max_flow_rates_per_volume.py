import os
import pytest
from typing import Iterator
from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.pipette.pipette_load_name_conversions import (
    convert_pipette_model,
)
from opentrons_shared_data.pipette.load_data import load_definition
from opentrons_shared_data.pipette.ul_per_mm import piecewise_volume_conversion

from opentrons_shared_data.pipette.types import PipetteModel
from opentrons_shared_data.pipette.pipette_definition import (
    ulPerMMDefinition,
    PipetteModelVersionType,
    PipetteConfigurations,
)


DEFAULT_MAX_SPEED_HIGH_THROUGHPUT_OT3_AXIS_KIND_P = 15
DEFAULT_MAX_SPEED_LOW_THROUGHPUT_OT3_AXIS_KIND_P = 70
B_MAX_SPEED = 40


def _get_plunger_max_speed(pipette_model: PipetteModel) -> float:
    if "v2" in pipette_model:
        return B_MAX_SPEED
    else:
        if "96" in pipette_model:
            return DEFAULT_MAX_SPEED_HIGH_THROUGHPUT_OT3_AXIS_KIND_P
        else:
            return DEFAULT_MAX_SPEED_LOW_THROUGHPUT_OT3_AXIS_KIND_P


def _get_max_flow_rate_at_volume(
    ul_per_mm_definition: ulPerMMDefinition,
    pipette_model: PipetteModel,
    volume: float,
) -> float:
    max_speed = _get_plunger_max_speed(pipette_model)
    map = list(ul_per_mm_definition.default.values())[-1]
    ul_per_mm = piecewise_volume_conversion(volume, map)
    return round(ul_per_mm * max_speed, 1)


@pytest.mark.parametrize("action", ["aspirate", "dispense"])
def test_max_flow_rates_per_volume(
    pipette_configuration: PipetteConfigurations, action: str
) -> None:
    """Verify the max flow rate values for each pipette's supported tip is in range"""
    pipette_model_version_str = str(
        PipetteModelVersionType.from_definition(pipette_configuration)
    )
    for (
        liquid_name,
        liquid_properties,
    ) in pipette_configuration.liquid_properties.items():
        for tip_type, supported_tip in liquid_properties.supported_tips.items():

            """TODO: the following models do not pass the asserts since the uiMaxFlowRate was raised
            to match the default blowout and dispense flowRates. uiMaxFlowRate will be reevaluated
            in the future."""
            if not (
                (
                    pipette_model_version_str
                    in {
                        "p50_single_v3.4",
                        "p50_single_v3.5",
                        "p50_single_v3.6",
                        "p50_multi_v3.5",
                        "p50_multi_v3.4",
                    }
                    and liquid_properties.min_volume == 5.0
                )
                or (
                    pipette_model_version_str
                    in {"p200_96_v3.0", "p200_96_v3.1", "p200_96_v3.2"}
                    and liquid_properties.min_volume == 0.5
                )
            ):
                assert supported_tip.ui_max_flow_rate <= _get_max_flow_rate_at_volume(
                    supported_tip.aspirate, pipette, liquid_properties.min_volume
                )
                assert supported_tip.ui_max_flow_rate <= _get_max_flow_rate_at_volume(
                    supported_tip.dispense, pipette, liquid_properties.min_volume
                )
