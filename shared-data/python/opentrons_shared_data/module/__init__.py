""" opentrons_shared_data.module: functions and types for module defs """

import json
from pathlib import Path
from typing import overload, TYPE_CHECKING

from ..load import load_shared_data

if TYPE_CHECKING:
    from .dev_types import (
        SchemaVersions, ModuleSchema, SchemaV1, SchemaV2,
        ModuleDefinitionV1, ModuleDefinitionV2, ModuleModel
    )


class ModuleNotFoundError(KeyError):
    def __init__(self, version: str, model_or_loadname: str):
        super().__init__(model_or_loadname)
        self.requested_version = version
        self.requested_module = model_or_loadname

    def __str__(self) -> str:
        return f'No such version {self.requested_version} module '\
            f'{self.requested_module}'

    def __repr__(self) -> str:
        return f'{self.__class__.__name__}: {self.requested_module} '\
            f'at version {self.requested_version}'


def load_schema(version: 'SchemaVersions') -> 'ModuleSchema':
    path = Path('module') / 'schemas' / f'{version}.json'
    return json.loads(load_shared_data(path))


@overload
def load_definition(
        version: 'SchemaV1', model_or_loadname: str) -> 'ModuleDefinitionV1':
    ...


@overload
def load_definition(
        version: 'SchemaV2',
        model_or_loadname: 'ModuleModel') -> 'ModuleDefinitionV2':
    ...


def load_definition(version, model_or_definition):
    if version == '1':
        path = Path('module') / 'definitions' / '1.json'
        data = json.loads(load_shared_data(path))
        try:
            return data[model_or_definition]
        except KeyError:
            raise ModuleNotFoundError('1', model_or_definition)
    else:
        path = Path(f'module/definitions/2/{model_or_definition}.json')
        try:
            data = load_shared_data(path)
        except FileNotFoundError:
            raise ModuleNotFoundError('2', model_or_definition)
        return json.loads(data)
