"""Pipette config data providers."""
from dataclasses import dataclass
from typing import Dict

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    load_data as load_pipette_data,
    types as pip_types,
    pipette_definition,
)

from opentrons.hardware_control.dev_types import PipetteDict

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
    tip_configuration_lookup_table: Dict[
        float, pipette_definition.SupportedTipsDefinition
    ]
    nominal_tip_overlap: Dict[str, float]


def get_virtual_pipette_static_config(
    pipette_name: PipetteName,
) -> LoadedStaticPipetteData:
    """Get the config for a virtual pipette, given only the pipette name."""
    pipette_model = pipette_load_name.convert_pipette_name(pipette_name)
    config = load_pipette_data.load_definition(
        pipette_model.pipette_type,
        pipette_model.pipette_channels,
        pipette_model.pipette_version,
    )

    tip_configuration = config.supported_tips[
        pip_types.PipetteTipType(config.max_volume)
    ]
    return LoadedStaticPipetteData(
        model=str(pipette_model),
        display_name=config.display_name,
        min_volume=config.min_volume,
        max_volume=config.max_volume,
        channels=config.channels,
        home_position=config.mount_configurations.homePosition,
        nozzle_offset_z=config.nozzle_offset[2],
        tip_configuration_lookup_table={
            k.value: v for k, v in config.supported_tips.items()
        },
        flow_rates=FlowRates(
            default_blow_out=tip_configuration.default_blowout_flowrate.values_by_api_level,
            default_aspirate=tip_configuration.default_aspirate_flowrate.values_by_api_level,
            default_dispense=tip_configuration.default_dispense_flowrate.values_by_api_level,
        ),
        nominal_tip_overlap=config.tip_overlap_dictionary,
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
        tip_configuration_lookup_table={
            k.value: v for k, v in pipette_dict["supported_tips"].items()
        },
        nominal_tip_overlap=pipette_dict["tip_overlap"],
        # TODO(mc, 2023-02-28): these two values are not present in PipetteDict
        # https://opentrons.atlassian.net/browse/RCORE-655
        home_position=0,
        nozzle_offset_z=0,
    )
