"""Pipette config data providers."""
from dataclasses import dataclass
from typing import Dict

from opentrons_shared_data.pipette import dummy_model_for_name
from opentrons_shared_data.pipette.dev_types import PipetteName

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.config.pipette_config import load as load_pipette_config

from ..types import FlowRates


@dataclass(frozen=True)
class LoadedStaticPipetteData:
    """Static pipette config data for load pipette."""

    model: str
    display_name: str
    min_volume: float
    max_volume: float
    channels: int
    home_position: float
    nozzle_offset_z: float
    flow_rates: FlowRates
    return_tip_scale: float
    nominal_tip_overlap: Dict[str, float]


def get_virtual_pipette_static_config(
    pipette_name: PipetteName,
) -> LoadedStaticPipetteData:
    """Get the config for a virtual pipette, given only the pipette name."""
    pipette_model = dummy_model_for_name(pipette_name)
    config = load_pipette_config(pipette_model)

    return LoadedStaticPipetteData(
        model=config.model,
        display_name=config.display_name,
        min_volume=config.min_volume,
        max_volume=config.max_volume,
        channels=config.channels,
        home_position=config.home_position,
        nozzle_offset_z=config.nozzle_offset[2],
        flow_rates=FlowRates(
            default_blow_out=config.default_blow_out_flow_rates,
            default_aspirate=config.default_aspirate_flow_rates,
            default_dispense=config.default_dispense_flow_rates,
        ),
        return_tip_scale=config.return_tip_height,
        nominal_tip_overlap=config.tip_overlap,
    )


def get_pipette_static_config(pipette_dict: PipetteDict) -> LoadedStaticPipetteData:
    """Get the config for a pipette, given the state/config object from the HW API."""
    return LoadedStaticPipetteData(
        model=pipette_dict["model"],
        display_name=pipette_dict["display_name"],
        min_volume=pipette_dict["min_volume"],
        max_volume=pipette_dict["max_volume"],
        channels=pipette_dict["channels"],
        flow_rates=FlowRates(
            default_blow_out=pipette_dict["default_blow_out_flow_rates"],
            default_aspirate=pipette_dict["default_aspirate_flow_rates"],
            default_dispense=pipette_dict["default_dispense_flow_rates"],
        ),
        return_tip_scale=pipette_dict["return_tip_height"],
        nominal_tip_overlap=pipette_dict["tip_overlap"],
        # TODO(mc, 2023-02-28): these two values are not present in PipetteDict
        # https://opentrons.atlassian.net/browse/RCORE-655
        home_position=0,
        nozzle_offset_z=0,
    )
