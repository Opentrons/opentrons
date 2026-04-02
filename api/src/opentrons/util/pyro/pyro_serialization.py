"""Pyro related utilities for serialization of objects."""

import enum
import inspect
from contextlib import contextmanager
from types import ModuleType
from typing import Any, Callable, Iterator, Dict
from typing_extensions import TypedDict, is_typeddict

import serpent
from pydantic import BaseModel
from Pyro5 import api as pyro

class UnhashableDictWrapper(BaseModel):
    """This is a specialty model created to safely wrap dictionaries with mutable elements provided by Opentrons APIs.
    
    When registering types, be sure to utilize `register_unhashable_dicts` to ensure proper serialization between processes."""

    dictionary: Dict
    key_type: str
    value_type: str


def find_enums_in_packages(modules: list[ModuleType]) -> list[type[enum.Enum]]:
    """Returns a list of enums in the given list of modules."""
    enums = []
    for module in modules:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, enum.Enum) and obj is not enum.Enum:
                enums.append(obj)
    return enums

def find_pydantic_classes_in_packages(modules: list[ModuleType]) -> list[type[BaseModel]]:
    """Returns a list of pydantic classes in the given list of modules."""
    pydantic_classes = []
    for module in modules:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, BaseModel) and obj is not BaseModel:
                pydantic_classes.append(obj)
    return pydantic_classes

def find_typed_dict_classes_in_packages(modules: list[ModuleType]) -> list[type[TypedDict]]:
    """Returns a list of typed dict classes in the given list of modules."""
    dict_classes = []
    for module in modules:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if is_typeddict(obj) and obj is not TypedDict:
                dict_classes.append(obj)
    return dict_classes

def _serpent_enum_serializer(
    obj: Any, serializer: Any, stream: Any, level: Any
) -> None:
    """Serpent serializer for generic Enum values."""
    serializer._serialize(obj.value, stream, level)


@contextmanager
def serpent_enum_registration() -> Iterator[None]:
    """Context manager for registering enums correctly with pyro/serpent.

    Because Serpent matches by first isinstance() in registry order, we need to unregister enums first
    so that types like "Mount" don't automatically become strings/ints, then register the enums after.
    """
    serpent.unregister_class(enum.Enum)  # type: ignore[no-untyped-call]
    try:
        yield
    finally:
        serpent.register_class(enum.Enum, _serpent_enum_serializer)  # type: ignore[no-untyped-call]


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


class OpentronsPyroSerializer:
    """A pyro serializer for custom Opentrons classes."""

    _pydantic_class_name_to_model: dict[str, type[BaseModel]] = {}
    _enum_class_name_to_model: dict[str, type[enum.Enum]] = {}
    _typed_dict_class_name_to_model: dict[str, type[TypedDict]] = {}

    @classmethod
    def register_enum(cls, enum_type: type[enum.Enum]) -> None:
        """Registers an enumerated type to be sent and received via pyro proxies."""
        class_name = register_type_to_serpent(
            enum_type,
            cls._generic_enum_dict_to_class,
            cls._generic_enum_class_to_dict,
        )
        cls._enum_class_name_to_model[class_name] = enum_type

    @classmethod
    def _generic_enum_class_to_dict(cls, enum_obj: enum.Enum) -> dict[str, str]:
        return {
            "__class__": ".".join((enum_obj.__module__, enum_obj.__class__.__name__)),
            "value": enum_obj.value,
        }

    @classmethod
    def _generic_enum_dict_to_class(
        cls, class_name: str, d: dict[str, str]
    ) -> enum.Enum:
        try:
            enum_type = cls._enum_class_name_to_model[class_name]
        except KeyError:
            raise RuntimeError(
                f"Unsupported module processed in Pyro request: {class_name}"
            )
        return enum_type(d["value"])

    @classmethod
    def register_pydantic_model(cls, model: type[BaseModel]) -> None:
        """Registers a pydantic model type to be sent and received via pyro proxies."""
        class_name = register_type_to_serpent(
            model, cls._pydantic_dict_to_class, cls._pydantic_class_to_dict
        )
        cls._pydantic_class_name_to_model[class_name] = model

    @classmethod
    def _pydantic_class_to_dict(cls, model: BaseModel) -> dict[str, Any]:
        model_dict = model.model_dump(mode="json", by_alias=True)
        model_dict["__class__"] = ".".join((model.__module__, model.__class__.__name__))
        return model_dict

    @classmethod
    def _pydantic_dict_to_class(cls, class_name: str, d: dict[str, Any]) -> BaseModel:
        del d["__class__"]
        try:
            model = cls._pydantic_class_name_to_model[class_name]
        except KeyError:
            raise TypeError(
                f"Could not convert {class_name} to an object, unregistered with pyro."
            )
        return model.model_validate(d)
    
    @classmethod
    def register_typed_dict(cls, typed_dict: TypedDict) -> None:
        """Registered a TypedDict type to be sent and received via pyro proxies."""
        # class_name = register_type_to_serpent(
        #     typed_dict, cls._typed_dict_dict_to_class, cls._typed_dict_class_to_dict
        # )
        class_name = ".".join((typed_dict.__module__, typed_dict.__qualname__))
        cls._typed_dict_class_name_to_model[class_name] = typed_dict

    # @classmethod
    # def _typed_dict_class_to_dict(cls, typed_dict: TypedDict) -> dict[str, Any]:
    #     print("IN HERE FOR DICT CLASS")
    #     typed_dict["__class__"] = ".".join((typed_dict.__module__, typed_dict.__class__.__name__))
    #     print(f"typed dict class: {typed_dict["__class__"]}")
    #     return typed_dict
    
    # @classmethod
    # def _typed_dict_dict_to_class(cls, class_name: str, d: dict[str, Any]) -> TypedDict:
    #     del d["__class__"]
    #     print("IN HERE")
    #     try:
    #         model = cls._typed_dict_class_name_to_model[class_name]
    #     except KeyError:
    #         raise TypeError(
    #             f"Could not convert {class_name} to an object, unregistered with pyro."
    #         )
    #     print("CONTINUING HERE")
    #     return model(d)
    
    @classmethod
    def register_unhashable_dicts(cls) -> None:
        """Registers the specialty handler for unhashable dicts using UnhashableDictWrapper."""
        class_name = register_type_to_serpent(
            UnhashableDictWrapper, cls._unhashable_dict_wrapper_dict_to_class, cls._pydantic_class_to_dict
        )
        cls._pydantic_class_name_to_model[class_name] = UnhashableDictWrapper

    @classmethod
    def _unhashable_dict_wrapper_dict_to_class(cls, classname: str, d: dict[str, Any]) -> Dict:
        del d["__class__"]
        try:
            key_model = cls._pydantic_class_name_to_model[d["key_type"]]
        except KeyError:
            try:
                key_model = cls._enum_class_name_to_model[d["key_type"]]
            except KeyError:
                raise TypeError(
                    f"Could not convert Dictionary Key {d["key_type"]} to an object, unregistered with pyro."
                )
        try:
            value_model = cls._pydantic_class_name_to_model[d["value_type"]]
        except KeyError:
            try:
                value_model = cls._enum_class_name_to_model[d["value_type"]]
            except KeyError:
                try:
                    value_model = cls._typed_dict_class_name_to_model[d["value_type"]]
                    print("found a dictionary")
                except KeyError:
                    raise TypeError(
                        f"Could not convert Dictionary Value {d["value_type"]} to an object, unregistered with pyro."
                    )
        unwrapped_dictionary = {}
        # Unwrap the dictionary and format all keys and values to respective expected types
        print("getting this far")
        for key in d["dictionary"]:
            if issubclass(key_model, enum.Enum):
                try:
                    converted_key = int(key)
                except ValueError:
                    converted_key = key
                
                # Handle values stored with `typing.Optional` results
                if d["dictionary"][key] is None:
                    unwrapped_dictionary[key_model(converted_key)] = d["dictionary"][key]
                # Handle the remainder of formatting cases
                elif issubclass(value_model, enum.Enum):
                    try:
                        unwrapped_dictionary[key_model(converted_key)] = value_model(int(d["dictionary"][key]))
                    except ValueError:
                        unwrapped_dictionary[key_model(converted_key)] = value_model(d["dictionary"][key])
                elif issubclass(value_model, BaseModel):
                    unwrapped_dictionary[key_model(converted_key)] = value_model.model_validate(d["dictionary"][key])
                else:
                    unwrapped_dictionary[key_model(converted_key)] = value_model(d["dictionary"][key])
            else:
                # Handles values stored with `typing.Optional` results
                if d["dictionary"][key] is None:
                    unwrapped_dictionary[key_model.model_validate(key)] = d["dictionary"][key]
                # Handle the remainder of formatting cases
                elif issubclass(value_model, enum.Enum):
                    try:
                        unwrapped_dictionary[key_model.model_validate(key)] = value_model(int(d["dictionary"][key]))
                    except ValueError:
                        unwrapped_dictionary[key_model.model_validate(key)] = value_model(d["dictionary"][key])
                
                elif issubclass(value_model, BaseModel):
                    unwrapped_dictionary[key_model.model_validate(key)] = value_model.model_validate(d["dictionary"][key])
                else:
                    unwrapped_dictionary[key_model.model_validate(key)] = value_model(d["dictionary"][key])
        return unwrapped_dictionary