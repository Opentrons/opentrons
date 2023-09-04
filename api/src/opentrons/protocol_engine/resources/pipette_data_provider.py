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


def get_pipette_static_config(
    pipette_model: pipette_definition.PipetteModelVersionType,
) -> LoadedStaticPipetteData:
    """Get the config for a pipette, given the pipette model from the HW API."""
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
