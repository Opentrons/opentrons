import json
import os

from typing import Dict, Any, Union
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
from .model_constants import MOUNT_CONFIG_LOOKUP_TABLE


LoadedConfiguration = Dict[str, Union[str, Dict[str, Any]]]


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


@lru_cache(maxsize=None)
def load_serial_lookup_table() -> Dict[str, str]:
    """Load a serial abbreviation lookup table mapped to model name."""
    config_path = get_shared_data_root() / "pipette" / "definitions" / "2" / "liquid"
    _lookup_table = {}
    _channel_shorthand = {
        "eight_channel": "M",
        "single_channel": "S",
        "ninety_six_channel": "H",
    }
    _channel_model_str = {
        "single_channel": "single",
        "ninety_six_channel": "96",
        "eight_channel": "multi",
    }
    _model_shorthand = {"p1000": "p1k", "p300": "p3h"}
    for channel_dir in os.listdir(config_path):
        for model_dir in os.listdir(config_path / channel_dir):
            for version_file in os.listdir(config_path / channel_dir / model_dir):
                version_list = version_file.split(".json")[0].split("_")
                built_model = f"{model_dir}_{_channel_model_str[channel_dir]}_v{version_list[0]}.{version_list[1]}"

                model_shorthand = _model_shorthand.get(model_dir, model_dir)

                if (
                    model_dir == "p300"
                    and int(version_list[0]) == 1
                    and int(version_list[1]) == 0
                ):
                    # Well apparently, we decided to switch the shorthand of the p300 depending
                    # on whether it's a "V1" model or not...so...here is the lovely workaround.
                    model_shorthand = model_dir
                serial_shorthand = f"{model_shorthand.upper()}{_channel_shorthand[channel_dir]}V{version_list[0]}{version_list[1]}"
                _lookup_table[serial_shorthand] = built_model
    return _lookup_table


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

    generation = PipetteGenerationType(physical_dict["displayCategory"])
    mount_configs = MOUNT_CONFIG_LOOKUP_TABLE[generation.value]

    return PipetteConfigurations.parse_obj(
        {
            **geometry_dict,
            **physical_dict,
            **liquid_dict,
            "version": version,
            "mount_configurations": mount_configs,
        }
    )
