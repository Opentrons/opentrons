"""Test for the Pyro Serialization."""

import enum

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
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocol_engine.types.module import ModuleModel
from opentrons.types import DeckSlotName
from opentrons.util.pyro.pyro_serialization import (
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


def test_basic_error_serialization() -> None:
    """It should serialize and deserialize non-enumerated errors for Pyro via args."""
    for error_type in find_basic_errors_in_packages(HARDWARE_ERROR_PACKAGES):
        test_error = error_type("example")
        # todo(NBS, 3036-8-5) this "example" might not work
        OpentronsPyroSerializer.register_basic_error(error_type)

        class_name = ".".join((test_error.__module__, test_error.__class__.__name__))
        test_dict = OpentronsPyroSerializer._generic_error_class_to_dict(test_error)

        assert test_dict == {
            "__class__": class_name,
            "args": test_error.args,
        }

        result = OpentronsPyroSerializer._generic_error_dict_to_class(
            class_name, test_dict
        )

        assert type(result) is error_type
        assert result.args == test_error.args
        assert str(result) == str(test_error)
