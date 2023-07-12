""" opentrons_shared_data.module: functions and types for module defs """
import json
from pathlib import Path
from typing import Union, cast, overload

from ..load import load_shared_data
from .dev_types import (
    SchemaVersions,
    ModuleSchema,
    SchemaV1,
    SchemaV3,
    ModuleDefinitionV1,
    ModuleDefinitionV3,
    ModuleModel,
)


# TODO (spp, 2022-05-12): Python has a built-in error called `ModuleNotFoundError` so,
#                         maybe rename this one?
class ModuleNotFoundError(KeyError):
    def __init__(self, version: str, model_or_loadname: str):
        super().__init__(model_or_loadname)
        self.requested_version = version
        self.requested_module = model_or_loadname

    def __str__(self) -> str:
        return (
            f"No such version {self.requested_version} module "
            f"{self.requested_module}"
        )

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}: {self.requested_module} "
            f"at version {self.requested_version}"
        )


def load_schema(version: SchemaVersions) -> ModuleSchema:
    path = Path("module") / "schemas" / f"{version}.json"
    return cast(ModuleSchema, json.loads(load_shared_data(path)))


@overload
def load_definition(version: SchemaV1, model_or_loadname: str) -> ModuleDefinitionV1:
    ...


@overload
def load_definition(
    version: SchemaV3,
    model_or_loadname: Union[str, ModuleModel],
) -> ModuleDefinitionV3:
    ...


def load_definition(
    version: SchemaVersions,
    model_or_loadname: Union[str, ModuleModel],
) -> Union[ModuleDefinitionV1, ModuleDefinitionV3]:
    if version == "1":
        path = Path("module") / "definitions" / "1.json"
        data = json.loads(load_shared_data(path))
        try:
            return cast(ModuleDefinitionV1, data[model_or_loadname])
        except KeyError:
            raise ModuleNotFoundError("1", model_or_loadname)
    else:
        path = Path(f"module/definitions/{version}/{model_or_loadname}.json")
        try:
            data = load_shared_data(path)
        except FileNotFoundError:
            raise ModuleNotFoundError(version, model_or_loadname)
        return cast(ModuleDefinitionV3, json.loads(data))
