from __future__ import annotations

import json
from typing import List
from pydantic import BaseModel, validator
from g_code_parsing.errors import ConfigurationNotFoundError
from enum import Enum


class ValidDriverTypes(str, Enum):
    HTTP = "http"
    PROTOCOL = "protocol"


class GCodeTestData(BaseModel):
    name: str
    path: str
    driver: ValidDriverTypes


class GCodeTestFile(BaseModel):
    configs: List[GCodeTestData]

    # Pydantic stuff

    @validator("configs")
    def names_must_be_unique(cls, configs):
        names = [item.name for item in configs]
        assert len(names) == len(set(names)), (
            "You have items with duplicate names " "in your schema"
        )
        return configs

    @validator("configs")
    def paths_must_be_unique(cls, configs):
        path = [item.path for item in configs]
        assert len(path) == len(set(path)), (
            "You have items with duplicate paths in " "your schema"
        )
        return configs

    # Public Methods

    @classmethod
    def from_config_file(cls, file_path: str) -> GCodeTestFile:
        json_file = open(file_path, "r")
        return GCodeTestFile(configs=json.load(json_file))

    def get_by_name(self, name: str):
        for config in self.configs:
            if config.name == name:
                return config

        raise ConfigurationNotFoundError(name)

    @property
    def names(self) -> List[str]:
        return [config.name for config in self.configs]

    @property
    def paths(self) -> List[str]:
        return [config.path for config in self.configs]
