import json
import os

from typing import Literal, Dict, Any
from functools import lru_cache

from .. import load_shared_data, get_shared_data_root

from .types import PipetteChannelType, PipetteConfigurationSpec, PipetteGeometry, PipetteLiquidProperties, PipetteModelType, PipettePhysicalProperties


LoadedConfiguration: Dict[PipetteChannelType, Dict[PipetteModelType, Any]]


def _build_configuration_dictionary(rel_path) -> LoadedConfiguration:
    _dict = {}
    for pipette_type in PipetteChannelType:
        _dict[pipette_type] = {}
        pipette_type_path = rel_path / pipette_type.value
        for dir_name in os.scandir(get_shared_data_root() / pipette_type_path):
            _dict[dir_name] = json.loads(load_shared_data(f"{pipette_type_path}/{dir_name}/{model.value}.json"))
    return _dict

@lru_cache(maxsize=None)
def _geometry() -> LoadedConfiguration:
    return _build_configuration_dictionary("pipette/definitions/2/geometry")


@lru_cache(maxsize=None)
def _liquid(model ) -> LoadedConfiguration:
    return _build_configuration_dictionary("pipette/definitions/2/liquid")

@lru_cache(maxsize=None)
def _physical() -> LoadedConfiguration:
    return _build_configuration_dictionary("pipette/definitions/2/general")


def load_definition(
    version: PipetteModelVersion,
    model: PipetteModel) -> PipetteConfigurationSpec:
    return PipetteConfigurationSpec(
        liquid=PipetteLiquidProperties.build(_liquid()[model][version]),
        physical=PipettePhysicalProperties.build(_physical()[model][version]),
        geometry=PipetteGeometry.build(_geometry()[model][version]))
