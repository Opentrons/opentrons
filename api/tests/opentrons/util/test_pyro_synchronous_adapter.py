"""Test for the Pyro Synchronous Adapter"""

import asyncio
import inspect
from types import FunctionType
from typing import TypeVar

import pytest

from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.ot3api import OT3API
from opentrons.util.pyro_synchronous_adapter import PyroSynchronousObject


@pytest.fixture
def managed_obj(ot3_hardware: ThreadManager[OT3API]) -> OT3API:
    managed = ot3_hardware.managed_obj
    assert managed
    return managed


def test_pyro_synchronous_adapter_ot3api(managed_obj: OT3API) -> None:
    """Test that the PyroSynchronousObject creates a fully adapted class of OT3API public methods and properties."""
    pyro_object = PyroSynchronousObject(managed_obj)
    pyro_object_members = [name for name, attr in inspect.getmembers(pyro_object)]

    # The PyroSynchronousObject should only adapt public properties, functions and async functions from a base class.
    for name, attr in inspect.getmembers(managed_obj):
        if (
            "__" not in name
            and not name.startswith("_")
            and (
                isinstance(attr, property)
                or isinstance(attr, FunctionType)
                or asyncio.iscoroutinefunction(attr)
            )
            and not (inspect.ismethod(attr) and inspect.isclass(attr.__self__))
        ):
            assert name in pyro_object_members

        # Now check to ensure that things thate aren't supposed to be there (like private methods) aren't present
        if "__" not in name and (
            name.startswith("_")
            or (inspect.ismethod(attr) and inspect.isclass(attr.__self__))
            or isinstance(attr, TypeVar)
        ):
            assert name not in pyro_object_members
