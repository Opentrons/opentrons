"""Pyro related utilities for serialization of objects."""

import builtins
import enum
import inspect
import pickle
from contextlib import contextmanager
from dataclasses import is_dataclass
from types import ModuleType
from typing import Any, Callable, Iterator

import numpy
import serpent
from pydantic import BaseModel
from Pyro5 import api as pyro
from typing_extensions import TypedDict, is_typeddict

from opentrons_shared_data.errors.exceptions import EnumeratedError

PYRO_PROXY = "PYRO_PROXY"


class TypedDictWrapper(BaseModel):
    """This is a specialty model create to safely wrap TypedDicts like PipetteDict.

    Each typed dict requires custom handling in their native serializer.
    """

    dictionary: dict[Any, Any]
    typed_dict_name: str


class NonBuiltinKeyDictWrapper(BaseModel):
    """This is a specialty model created to safely wrap dictionaries with non builtin keys provided by Opentrons APIs.

    When registering types, be sure to utilize `register_dicts_with_non_builtin_keys` to ensure proper serialization
    between processes.
    """

    dictionary: dict[Any, Any]
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


def find_basic_errors_in_packages(modules: list[ModuleType]) -> list[type[Exception]]:
    """Return non-enumerated errors defined in the given modules."""
    exceptions = []
    for module in modules:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, Exception) and obj is not Exception:
                exceptions.append(obj)
    return exceptions


def find_pydantic_classes_in_packages(
    modules: list[ModuleType],
) -> list[type[BaseModel]]:
    """Returns a list of pydantic classes in the given list of modules."""
    pydantic_classes = []
    for module in modules:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, BaseModel) and obj is not BaseModel:
                pydantic_classes.append(obj)
    return pydantic_classes


def find_opentrons_classes_in_packages(modules: list[ModuleType]) -> list[type]:
    """Returns a list of dataclasses and NamedTuples that contain `to_pyro_dict` and `from_pyro_dict` staticmethods in the given list of moduels."""
    dataclasses = []
    for module in modules:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if (
                (is_dataclass(obj) or _is_namedtuple_instance(obj))
                and hasattr(obj, "to_pyro_dict")
                and hasattr(obj, "from_pyro_dict")
            ):
                dataclasses.append(obj)
    return dataclasses


def find_typed_dict_classes_in_packages(
    modules: list[ModuleType],
) -> list[type[TypedDict]]:  # type: ignore
    """Returns a list of typed dict classes in the given list of modules."""
    dict_classes = []
    for module in modules:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if is_typeddict(obj):
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


def enumerated_error_class_to_dict(obj: EnumeratedError) -> dict[str, Any]:
    """Serializes enumerated errors to a bytes dictionary."""
    return {
        "__class__": "opentrons_shared_data.errors.exceptions.EnumeratedError",
        "bytes": pickle.dumps(obj),
    }


def enumerated_error_dict_to_class(
    class_name: str, d: dict[str, Any]
) -> EnumeratedError:
    """Deserializes errors via pickle."""
    error = pickle.loads(d["bytes"])
    if not isinstance(error, EnumeratedError):
        raise ValueError(
            f"Class '{class_name}' labeled as enumerated error is a {type(error)}"
        )
    return error


def register_enumerated_errors() -> None:
    """Registers serializer and deserializer for enumerated errors."""
    register_type_to_serpent(
        class_type=EnumeratedError,
        dict_to_class=enumerated_error_dict_to_class,
        class_to_dict=enumerated_error_class_to_dict,
    )


def _is_namedtuple_instance(cls: Any) -> bool:
    """Validate if an object is a NamedTuple instance."""
    try:
        return issubclass(cls, tuple) and hasattr(cls, "_fields")
    except TypeError:
        return False


class OpentronsPyroSerializer:
    """A pyro serializer for custom Opentrons classes."""

    _pydantic_class_name_to_model: dict[str, type[BaseModel]] = {}
    _enum_class_name_to_type: dict[str, type[enum.Enum]] = {}
    _typed_dict_class_name_to_type: dict[str, type[TypedDict]] = {}  # type: ignore
    _generic_error_class_name_to_error: dict[str, type[BaseException]] = {}
    _dataclass_class_name_to_type: dict[str, type] = {}

    @classmethod
    def register_enum(cls, enum_type: type[enum.Enum]) -> None:
        """Registers an enumerated type to be sent and received via pyro proxies."""
        class_name = register_type_to_serpent(
            enum_type,
            cls._generic_enum_dict_to_class,
            cls._generic_enum_class_to_dict,
        )
        cls._enum_class_name_to_type[class_name] = enum_type

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
            enum_type = cls._enum_class_name_to_type[class_name]
        except KeyError:
            raise RuntimeError(
                f"Unsupported enum processed in Pyro request: {class_name}"
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
        # Handle dictionaries of proxies
        if (
            isinstance(model, NonBuiltinKeyDictWrapper)
            and model.value_type == PYRO_PROXY
        ):
            # A dictionary of proxies requires specialized serializaiton
            model_dict = model.model_dump(mode="python", by_alias=True)
            model_dict["dictionary"] = {
                key if type(key).__module__ == "builtins" else key.value: value
                for key, value in model_dict["dictionary"].items()
            }
            model_dict["__class__"] = ".".join(
                (model.__module__, model.__class__.__name__)
            )

        # Handle standard pydantic models
        else:
            model_dict = model.model_dump(mode="json", by_alias=True)
            model_dict["__class__"] = ".".join(
                (model.__module__, model.__class__.__name__)
            )
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
    def register_class(cls, class_type: type) -> None:
        """Registers a dataclass or NamedTuple type to be sent and received via pyro proxies."""
        if is_dataclass(class_type) or _is_namedtuple_instance(class_type):
            if hasattr(class_type, "to_pyro_dict") and hasattr(
                class_type, "from_pyro_dict"
            ):
                class_name = register_type_to_serpent(
                    class_type=class_type,
                    dict_to_class=class_type.from_pyro_dict,
                    class_to_dict=class_type.to_pyro_dict,
                )
                cls._dataclass_class_name_to_type[class_name] = class_type
            else:
                raise TypeError(
                    f"Class {class_type} does not satisfy `to_pyro_dict` and `from_pyro_dict` attribute requirements."
                )
        else:
            raise TypeError(
                f"Type {class_type} is not a dataclass or NamedTuple and could not be registered."
            )

    @classmethod
    def register_basic_error(cls, error_type: type[BaseException]) -> None:
        """Registers a non-enumerated error for Pyro via pickle (args + instance state)."""
        class_name = register_type_to_serpent(
            error_type,
            cls._generic_error_dict_to_class,
            cls._generic_error_class_to_dict,
        )
        cls._generic_error_class_name_to_error[class_name] = error_type

    @classmethod
    def _generic_error_class_to_dict(cls, obj: BaseException) -> dict[str, Any]:
        return {
            "__class__": ".".join((obj.__module__, obj.__class__.__name__)),
            "bytes": obj.args
        }

    @classmethod
    def _generic_error_dict_to_class(
        cls, class_name: str, d: dict[str, Any]
    ) -> BaseException:
        try:
            error_type = cls._generic_error_class_name_to_error[class_name]
        except KeyError:
            raise TypeError(
                f"Could not convert {class_name} to an error, unregistered with pyro."
            )
        payload = pickle.loads(d["bytes"])
        error = error_type.__new__(error_type)
        error.__dict__.update(payload["dict"])
        BaseException.__init__(error, *payload["args"])
        return error

    @classmethod
    def register_typed_dict(cls, typed_dict: type) -> None:
        """Registered a TypedDict type to the OpentronsPyroSerializer for tracking and deserialization purposes only."""
        class_name = ".".join((typed_dict.__module__, typed_dict.__qualname__))
        cls._typed_dict_class_name_to_type[class_name] = typed_dict

    @classmethod
    def register_opentrons_typed_dicts(
        cls, dict_to_class: Callable[[str, Any], Any]
    ) -> None:
        """Registers the specialty handler for typed dicts using TypeDictWrapper."""
        class_name = register_type_to_serpent(
            TypedDictWrapper,
            dict_to_class,
            cls._pydantic_class_to_dict,
        )
        cls._pydantic_class_name_to_model[class_name] = TypedDictWrapper

    @classmethod
    def register_dicts_with_non_builtin_keys(cls) -> None:
        """Registers the specialty handler for dicts with non builtin keys using NonBuiltinKeyDictWrapper."""
        class_name = register_type_to_serpent(
            NonBuiltinKeyDictWrapper,
            cls._non_builtin_key_dict_wrapper_dict_to_class,
            cls._pydantic_class_to_dict,
        )
        cls._pydantic_class_name_to_model[class_name] = NonBuiltinKeyDictWrapper

    @classmethod
    def _non_builtin_key_dict_wrapper_dict_to_class(  # noqa: C901
        cls, classname: str, d: dict[str, Any]
    ) -> dict[Any, Any]:
        registries: list[dict[str, Any]] = [
            cls._pydantic_class_name_to_model,
            cls._enum_class_name_to_type,
            cls._typed_dict_class_name_to_type,
            cls._dataclass_class_name_to_type,
            # Sometimes the hardware API sends floats in the form of numpy float 64s. If they happen
            # to be in a non-builtin dict wrapper, they won't get handled by the normal pyro serialization
            # so we need to handle it here by adding it to the list of registries.
            {"numpy.float64": numpy.float64},
        ]
        # Identify the types for the key and values, if available. Check for builtin types first.
        key_type = (
            None
            if "builtins" not in d["key_type"]
            else getattr(builtins, d["key_type"].removeprefix("builtins."))
        )
        value_type = (
            None
            if "builtins" not in d["value_type"]
            else getattr(builtins, d["value_type"].removeprefix("builtins."))
        )
        for registry in registries:
            if d["key_type"] in registry:
                key_type = registry[d["key_type"]]
            if d["value_type"] in PYRO_PROXY:
                # Specialized overload for dictionaries of proxies
                value_type = pyro.Proxy
            elif d["value_type"] in registry:
                value_type = registry[d["value_type"]]

        if key_type is None or value_type is None:
            raise TypeError(
                f"Could not convert Dictionary item `{d['key_type'] if key_type is None else d['value_type']}` to an object, unregistered with pyro."
            )
        unwrapped_dictionary = {}
        # Unwrap the dictionary and format all keys and values to respective types
        for key in d["dictionary"]:
            # Handle Key unwrapping
            if issubclass(key_type, enum.Enum):
                try:
                    unwrapped_key = key_type(int(key))
                except ValueError:
                    unwrapped_key = key_type(key)
            elif issubclass(key_type, BaseModel):
                unwrapped_key = key_type.model_validate(key)
            else:
                unwrapped_key = key_type(key)

            # Handle Value unwrapping
            if d["dictionary"][key] is None:
                # Catching values that may have been `typing.Optional`
                unwrapped_value = d["dictionary"][key]
            elif issubclass(value_type, pyro.Proxy):
                pyro_uri = d["dictionary"][key]["state"][0]
                unwrapped_value = value_type(pyro_uri)
            elif issubclass(value_type, enum.Enum):
                try:
                    unwrapped_value = value_type(int(d["dictionary"][key]))
                except ValueError:
                    unwrapped_value = value_type(d["dictionary"][key])
            elif issubclass(value_type, BaseModel):
                unwrapped_value = value_type.model_validate(d["dictionary"][key])
            else:
                unwrapped_value = value_type(d["dictionary"][key])

            unwrapped_dictionary[unwrapped_key] = unwrapped_value

        return unwrapped_dictionary
