from __future__ import annotations
from typing import List, Union, Callable
from pydantic import BaseModel, validator
from g_code_parsing.errors import ConfigurationNotFoundError
from enum import Enum


class ValidDriverTypes(str, Enum):
    HTTP = "http"
    PROTOCOL = "protocol"


class HTTPTestData(BaseModel):
    name: str
    executable: Callable


class ProtocolTestData(BaseModel):
    name: str
    path: str


class GCodeTestFile(BaseModel):
    configs: List[Union[HTTPTestData, ProtocolTestData]]

    # Pydantic stuff

    @validator("configs")
    def names_must_be_unique(cls, configs):
        names = [item.name for item in configs]
        assert len(names) == len(set(names)), (
            "You have items with duplicate names " "in your schema"
        )
        return configs

    def get_by_name(self, name: str):
        for config in self.configs:
            if config.name == name:
                return config

        raise ConfigurationNotFoundError(name)

    @property
    def names(self) -> List[str]:
        return [config.name for config in self.configs]
