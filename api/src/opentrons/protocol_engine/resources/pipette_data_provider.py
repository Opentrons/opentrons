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
    channels: int
    home_position: float
    nozzle_offset_z: float
    liquid_properties: Dict[
        pip_types.LiquidClasses, pipette_definition.PipetteLiquidPropertiesDefinition
    ]


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

    return LoadedStaticPipetteData(
        model=str(pipette_model),
        display_name=config.display_name,
        channels=config.channels,
        home_position=config.mount_configurations.homePosition,
        nozzle_offset_z=config.nozzle_offset[2],
        liquid_properties=config.liquid_properties,
    )


def get_pipette_static_config(pipette_dict: PipetteDict) -> LoadedStaticPipetteData:
    """Get the config for a pipette, given the state/config object from the HW API."""
    return LoadedStaticPipetteData(
        model=pipette_dict["model"],
        display_name=pipette_dict["display_name"],
        channels=pipette_dict["channels"],
        # TODO(mc, 2023-02-28): these two values are not present in PipetteDict
        # https://opentrons.atlassian.net/browse/RCORE-655
        home_position=0,
        nozzle_offset_z=0,
        liquid_properties=pipette_dict["liquid_properties"],
    )
