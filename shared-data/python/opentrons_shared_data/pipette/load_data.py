import json

from typing import Dict, Any
from typing_extensions import Literal
from functools import lru_cache

from .. import load_shared_data, get_shared_data_root

from .pipette_definition import (
    PipetteConfigurations,
    PipetteChannelType,
    PipetteVersionType,
    PipetteModelType,
    PipetteGenerationType,
    PipetteModelMajorVersion,
    PipetteModelMinorVersion,
)
from .model_constants import QUIRKS_LOOKUP_TABLE, MOUNT_CONFIG_LOOKUP_TABLE


LoadedConfiguration = Dict[PipetteChannelType, Dict[PipetteModelType, Any]]


def _get_configuration_dictionary(
    config_type: Literal["general", "geometry", "liquid"],
    channels: PipetteChannelType,
    max_volume: PipetteModelType,
    version: PipetteVersionType,
) -> LoadedConfiguration:
    config_path = (
        get_shared_data_root()
        / "pipette"
        / "definitions"
        / "2"
        / config_type
        / channels.name.lower()
        / max_volume.value
        / f"{version.major}_{version.minor}.json"
    )
    return json.loads(load_shared_data(config_path))


@lru_cache(maxsize=None)
def _geometry(
    channels: PipetteChannelType,
    max_volume: PipetteModelType,
    version: PipetteVersionType,
) -> LoadedConfiguration:
    return _get_configuration_dictionary("geometry", channels, max_volume, version)


@lru_cache(maxsize=None)
def _liquid(
    channels: PipetteChannelType,
    max_volume: PipetteModelType,
    version: PipetteVersionType,
) -> LoadedConfiguration:
    return _get_configuration_dictionary("liquid", channels, max_volume, version)


@lru_cache(maxsize=None)
def _physical(
    channels: PipetteChannelType,
    max_volume: PipetteModelType,
    version: PipetteVersionType,
) -> LoadedConfiguration:
    return _get_configuration_dictionary("general", channels, max_volume, version)


def load_definition(
    max_volume: PipetteModelType,
    channels: PipetteChannelType,
    version: PipetteVersionType,
) -> PipetteConfigurations:
    if (
        version.major not in PipetteModelMajorVersion
        or version.minor not in PipetteModelMinorVersion
    ):
        raise KeyError("Pipette version not found.")

    geometry_dict = _geometry(channels, max_volume, version)
    physical_dict = _physical(channels, max_volume, version)
    liquid_dict = _liquid(channels, max_volume, version)

    generation = version.to_generation()
    mount_configs = MOUNT_CONFIG_LOOKUP_TABLE[generation.value]
    model_channel = f"{max_volume.value}_{channels}"

    if generation != PipetteGenerationType.FLEX:
        quirks_dict = QUIRKS_LOOKUP_TABLE[model_channel][generation.value]
        quirks = quirks_dict.get(f"{version}", quirks_dict["default"])
    else:
        quirks = []
    return PipetteConfigurations.parse_obj(
        {**geometry_dict, **physical_dict, **liquid_dict, "version": version, "mount_configurations": mount_configs, "quirks": quirks}
    )
