"""Pyro related utilities for serialization of objects."""

import enum
import inspect
from typing import Any, Callable

from pydantic import BaseModel
from Pyro5 import api as pyro


def find_enums_in_packages(modules: list) -> list:  # type: ignore
    """Returns a list of enums in the given list of modules."""
    enums = []
    for module in modules:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, enum.Enum) and obj is not enum.Enum:
                enums.append(obj)
    return enums


def register_type_to_serpent(
    class_type: Any,
    dict_to_class: Callable[[str, Any], Any],
    class_to_dict: Callable[[Any], dict[Any, Any]],
) -> str:
    """Adapter function to call the serpent registries for individual types."""
    class_path = ".".join((class_type.__module__, class_type.__qualname__))
    pyro.register_dict_to_class(class_path, dict_to_class)  # type: ignore
    pyro.register_class_to_dict(class_type, class_to_dict)  # type: ignore
    return class_path


class PydanticPyroSerializer:
    """A pyro serializer for Pydantic models."""

    _class_name_to_model: dict[str, type[BaseModel]] = {}

    @classmethod
    def register_model(cls, model: type[BaseModel]) -> None:
        """Registers a pydantic model type to be sent and received via pyro proxies."""
        class_name = register_type_to_serpent(
            model, cls._pydantic_dict_to_class, cls._pydantic_class_to_dict
        )
        cls._class_name_to_model[class_name] = model

    @classmethod
    def _pydantic_class_to_dict(cls, model: BaseModel) -> dict[str, Any]:
        model_dict = model.model_dump(mode="json", by_alias=True)
        model_dict["__class__"] = ".".join((model.__module__, model.__class__.__name__))
        return model_dict

    @classmethod
    def _pydantic_dict_to_class(cls, class_name: str, d: dict[str, Any]) -> BaseModel:
        del d["__class__"]
        try:
            model = cls._class_name_to_model[class_name]
        except KeyError:
            raise TypeError(
                f"Could not convert {class_name} to an object, unregistered with pyro."
            )
        return model.model_validate(d)
