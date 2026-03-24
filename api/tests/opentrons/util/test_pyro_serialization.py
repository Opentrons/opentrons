"""Test for the Pyro Serialization."""

from pydantic import BaseModel

from opentrons.hardware_control.types import CriticalPoint
from opentrons.util.pyro.pyro_serialization import OpentronsPyroSerializer


class NestedTest(BaseModel):
    """A basic pydantic model that is nested in another model."""

    foo: str


class TestModel(BaseModel):
    """A basic pydantic model for serialization tests. Contains a basic type, nested model, and an enum."""

    bar: int
    xyzzy: NestedTest
    critical: CriticalPoint


def test_pydantic_serialization() -> None:
    """It should register a pydantic class and serialize it from class to dict and back."""
    OpentronsPyroSerializer.register_pydantic_model(TestModel)

    test_model = TestModel(
        bar=123,
        xyzzy=NestedTest(foo="xzibit"),
        critical=CriticalPoint.XY_CENTER,
    )

    test_dict = OpentronsPyroSerializer._pydantic_class_to_dict(test_model)
    assert test_dict == {
        "bar": 123,
        "xyzzy": {"foo": "xzibit"},
        "critical": 4,
        "__class__": "tests.opentrons.util.test_pyro_serialization.TestModel",
    }

    result = OpentronsPyroSerializer._pydantic_dict_to_class(
        "tests.opentrons.util.test_pyro_serialization.TestModel",
        test_dict,
    )
    assert result == test_model
