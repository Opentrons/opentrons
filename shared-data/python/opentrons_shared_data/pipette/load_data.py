import json
import os

from typing import Dict, Any
from functools import lru_cache

from .. import load_shared_data, get_shared_data_root

from . import types
from .pipette_definition import PipetteConfigurations


LoadedConfiguration = Dict[types.PipetteChannelType, Dict[types.PipetteModelType, Any]]


def _build_configuration_dictionary(
    rel_path: str, version: types.PipetteVersionType
) -> LoadedConfiguration:
    _dict: LoadedConfiguration = {}
    for pipette_type in types.PipetteChannelType:
        pipette_type_path = get_shared_data_root() / rel_path / pipette_type.value
        _dict[pipette_type] = {}
        for dir_name in os.scandir(pipette_type_path):
            model_key = types.PipetteModelType.convert_from_model(dir_name.name)
            _dict[pipette_type][model_key] = json.loads(
                load_shared_data(
                    f"{pipette_type_path}/{dir_name.name}/{version.major}_{version.minor}.json"
                )
            )
    return _dict


@lru_cache(maxsize=None)
def _geometry(version: types.PipetteVersionType) -> LoadedConfiguration:
    return _build_configuration_dictionary("pipette/definitions/2/geometry", version)


@lru_cache(maxsize=None)
def _liquid(version: types.PipetteVersionType) -> LoadedConfiguration:
    return _build_configuration_dictionary("pipette/definitions/2/liquid", version)


@lru_cache(maxsize=None)
def _physical(version: types.PipetteVersionType) -> LoadedConfiguration:
    return _build_configuration_dictionary("pipette/definitions/2/general", version)


def load_definition(
    max_volume: types.PipetteModelType,
    channels: types.PipetteChannelType,
    version: types.PipetteVersionType,
) -> PipetteConfigurations:
    geometry_dict = _geometry(version)[channels][max_volume]
    physical_dict = _physical(version)[channels][max_volume]
    liquid_dict = _liquid(version)[channels][max_volume]

    return PipetteConfigurations.parse_obj(
        {**geometry_dict, **physical_dict, **liquid_dict}
    )
