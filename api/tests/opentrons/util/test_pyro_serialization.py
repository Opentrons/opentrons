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

from opentrons.drivers.asyncio.communication.errors import (
    ErrorResponse,
    NoResponse,
    SerialException,
)
from opentrons.drivers.flex_stacker.errors import EStopTriggered, MotorStallDetected
from opentrons.hardware_control.types import CriticalPoint, FailedTipStateCheck
from opentrons.protocol_engine.types.module import ModuleModel
from opentrons.types import DeckSlotName
from opentrons.util.pyro.pyro_serialization import (
    OpentronsPyroSerializer,
    enumerated_error_class_to_dict,
    enumerated_error_dict_to_class,
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


@pytest.mark.parametrize(
    "error_type, test_error",
    [
        (FailedTipStateCheck, FailedTipStateCheck("tip state mismatch")),
        (SerialException, SerialException("COM1", "connection lost")),
        (NoResponse, NoResponse("COM1", "G28")),
        (ErrorResponse, ErrorResponse("COM1", "ERR001", "G28")),
        (EStopTriggered, EStopTriggered("COM1", "ERR006:estop", "G28")),
        (MotorStallDetected, MotorStallDetected("COM1", "ERR403:stall", "G28")),
    ],
)
def test_basic_error_serialization(
    error_type: type[BaseException], test_error: BaseException
) -> None:
    """It should serialize and deserialize non-enumerated errors for Pyro via pickle."""
    OpentronsPyroSerializer.register_basic_error(error_type)

    class_name = ".".join((test_error.__module__, test_error.__class__.__name__))
    test_dict = OpentronsPyroSerializer._generic_error_class_to_dict(test_error)

    assert test_dict.get("bytes") is not None
    assert test_dict["__class__"] == class_name

    result = OpentronsPyroSerializer._generic_error_dict_to_class(class_name, test_dict)

    assert type(result) is type(test_error)
    assert result.args == test_error.args
    assert result.__dict__ == test_error.__dict__
    assert str(result) == str(test_error)
