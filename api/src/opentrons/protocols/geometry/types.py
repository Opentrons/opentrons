from enum import Enum, auto
from typing import Type, TypeVar

Configuration = TypeVar("Configuration", bound="GenericConfiguration")


class GenericConfiguration(Enum):
    @classmethod
    def configuration_type(cls: Type[Configuration], config: str) -> "Configuration":
        for m in cls.__members__.values():
            if m.name == config.upper():
                return m
        raise AttributeError(f"{config} not available")


class ThermocyclerConfiguration(GenericConfiguration):
    FULL = auto()
    SEMI = auto()

    def __str__(self):
        return self.name
