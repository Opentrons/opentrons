"""Test for the Pyro Serialization."""

import enum
from dataclasses import is_dataclass
from typing import Any, Dict

import pytest
from pydantic import BaseModel

from opentrons_shared_data.errors.exceptions import (
    EnumeratedError,
    PythonException,
    RobotInUseError,
    VacuumModulePressureNotReachedError,
    VacuumModuleUnknownError,
    VacuumModuleWasteFullError,
)

from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    HARDWARE_ERROR_PACKAGES,
)
from opentrons.hardware_control.types import (
    Axis,
    CriticalPoint,
    EstopOverallStatus,
    EstopPhysicalStatus,
    EstopState,
)
from opentrons.protocol_engine.types.module import ModuleModel
from opentrons.types import DeckSlotName
from opentrons.util.pyro.pyro_serialization import (
    NonBuiltinKeyDictWrapper,
    OpentronsPyroSerializer,
    enumerated_error_class_to_dict,
    enumerated_error_dict_to_class,
    find_basic_errors_in_packages,
)


class NestedTest(BaseModel):
    """A basic pydantic model that is nested in another model."""

    foo: str


class BasicTestModel(BaseModel):
    """A basic pydantic model for serialization tests. Contains a basic type, nested model, and an enum."""

    bar: int
    xyzzy: NestedTest
    critical: CriticalPoint


@pytest.mark.parametrize(
    "enum_class, enum_instance, class_name",
    [
        # A basic enum.Enum
        (
            DeckSlotName,
            DeckSlotName.SLOT_A1,
            "opentrons.types.DeckSlotName",
        ),
        # An enum that uses enum.auto()
        (
            CriticalPoint,
            CriticalPoint.TIP,
            "opentrons.hardware_control.types.CriticalPoint",
        ),
        # An enum that inherits from StrEnum
        (
            ModuleModel,
            ModuleModel.THERMOCYCLER_MODULE_V2,
            "opentrons.protocol_engine.types.module.ModuleModel",
        ),
    ],
)
def test_enum_serialization_str_enum(
    enum_class: type[enum.Enum],
    enum_instance: enum.Enum,
    class_name: str,
) -> None:
    """It should register an enum and keep it that type."""
    OpentronsPyroSerializer.register_enum(enum_class)

    test_dict = OpentronsPyroSerializer._generic_enum_class_to_dict(enum_instance)
    assert test_dict == {
        "__class__": class_name,
        "value": enum_instance.value,
    }

    result = OpentronsPyroSerializer._generic_enum_dict_to_class(class_name, test_dict)
    assert result == enum_instance


def test_pydantic_serialization() -> None:
    """It should register a pydantic class and serialize it from class to dict and back."""
    OpentronsPyroSerializer.register_pydantic_model(BasicTestModel)

    test_model = BasicTestModel(
        bar=123,
        xyzzy=NestedTest(foo="xzibit"),
        critical=CriticalPoint.XY_CENTER,
    )

    test_dict = OpentronsPyroSerializer._pydantic_class_to_dict(test_model)
    assert test_dict == {
        "bar": 123,
        "xyzzy": {"foo": "xzibit"},
        "critical": 4,
        "__class__": "tests.opentrons.util.test_pyro_serialization.BasicTestModel",
    }

    result = OpentronsPyroSerializer._pydantic_dict_to_class(
        "tests.opentrons.util.test_pyro_serialization.BasicTestModel",
        test_dict,
    )
    assert result == test_model


@pytest.mark.parametrize(
    "test_error",
    [
        RobotInUseError(
            message="Uh oh",
            detail={"ruh": "roh"},
            wrapping=[PythonException(exc=RuntimeError("foo"))],
        ),
        VacuumModuleUnknownError("VM123", "pressure", -100.0, -75.0),
        VacuumModulePressureNotReachedError("VM123", "pressure", -100.0, -75.0),
        VacuumModuleWasteFullError("VM123", "pressure", 0.0, 0.0),
    ],
)
def test_enumerated_error_serialization(test_error: EnumeratedError) -> None:
    """It should serialize and deserialize enumerated errors for Pyro."""
    test_dict = enumerated_error_class_to_dict(test_error)

    assert test_dict.get("bytes") is not None
    assert (
        test_dict["__class__"]
        == "opentrons_shared_data.errors.exceptions.EnumeratedError"
    )

    result = enumerated_error_dict_to_class("", test_dict)

    assert result == test_error


_DUMMY_ARGS = [
    ({Axis.Z_L: 150.2}, {Axis.Z_L: 140.0}),
    ("example",),
    ("example", "example"),
    ("example", "example", "example"),
    ("example", "example", None),
    (0.0, 0.0),
]


def _add_error_args(error_type: type[BaseException]) -> BaseException:
    last_error: TypeError | None = None
    for args in _DUMMY_ARGS:
        try:
            return error_type(*args)
        except TypeError as e:
            last_error = e
    raise AssertionError(f"Could not construct {error_type.__name__}") from last_error


def test_basic_error_serialization() -> None:
    """It should serialize and deserialize non-enumerated errors for Pyro via args and state."""
    for error_type in find_basic_errors_in_packages(HARDWARE_ERROR_PACKAGES):
        if issubclass(error_type, EnumeratedError):
            continue
        test_error = _add_error_args(error_type)
        OpentronsPyroSerializer.register_basic_error(error_type)

        class_name = ".".join((test_error.__module__, test_error.__class__.__name__))
        test_dict = OpentronsPyroSerializer._generic_error_class_to_dict(test_error)

        assert test_dict == {
            "__class__": class_name,
            "args": test_error.args,
            "state": dict(test_error.__dict__),
        }

        result = OpentronsPyroSerializer._generic_error_dict_to_class(
            class_name, test_dict
        )

        assert type(result) is error_type
        assert result.args == test_error.args
        assert result.__dict__ == test_error.__dict__
        assert str(result) == str(test_error)


def test_non_builtin_keys_with_dataclasses() -> None:
    """It should serialize and deserialize a non-builtin keys dictionary that includes dataclasses."""
    serializer = OpentronsPyroSerializer()
    serializer.register_class(EstopOverallStatus)
    serializer.register_enum(Axis)

    def _fake_func() -> Dict[Axis, EstopOverallStatus]:
        return {
            Axis.X: EstopOverallStatus(
                state=EstopState.PHYSICALLY_ENGAGED,
                left_physical_state=EstopPhysicalStatus.DISENGAGED,
                right_physical_state=EstopPhysicalStatus.ENGAGED,
            ),
            Axis.Y: EstopOverallStatus(
                state=EstopState.DISENGAGED,
                left_physical_state=EstopPhysicalStatus.ENGAGED,
                right_physical_state=EstopPhysicalStatus.DISENGAGED,
            ),
        }

    def _get_non_builtin_key_dict(attr: Any) -> NonBuiltinKeyDictWrapper:
        # This mirrors the logic used to build NonBuiltinKeyDictWrappers in pyro
        return_types = attr.__annotations__["return"]
        key_type, value_type = return_types.__args__
        result = attr()

        if is_dataclass(value_type):
            result = {key: value.to_pyro_dict(value) for key, value in result.items()}
        try:
            key_type = next(a for a in key_type.__args__ if a is not type(None))
        except AttributeError:
            pass
        try:
            value_type = next(a for a in value_type.__args__ if a is not type(None))
        except AttributeError:
            pass
        wrapped_dict = NonBuiltinKeyDictWrapper(
            dictionary=result,
            key_type=".".join((key_type.__module__, key_type.__qualname__)),
            value_type=".".join((value_type.__module__, value_type.__qualname__)),
        )
        return wrapped_dict

    # Test serialization
    result = _fake_func()
    wrapped_result = _get_non_builtin_key_dict(_fake_func)
    serialized_result = serializer._pydantic_class_to_dict(wrapped_result)
    deserialized_result = serializer._non_builtin_key_dict_wrapper_dict_to_class(
        classname="cookie", d=serialized_result
    )
    assert result == deserialized_result
