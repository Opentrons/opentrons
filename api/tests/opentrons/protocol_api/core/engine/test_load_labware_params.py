"""Tests for Protocol API engine parameter validation."""
import pytest
from typing import List, Optional

from opentrons.protocol_api.core.engine import load_labware_params as subject
from opentrons.protocol_engine.state.labware import LabwareLoadParams
from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE


@pytest.mark.parametrize(
    argnames=[
        "load_name",
        "namespace",
        "version",
        "custom_labware_params",
        "expected_namespace",
        "expected_version",
    ],
    argvalues=[
        ("hello", "world", 123, [], "world", 123),
        ("hello", "world", None, [], "world", 1),
        ("hello", None, 123, [], OPENTRONS_NAMESPACE, 123),
        ("hello", None, None, [], OPENTRONS_NAMESPACE, 1),
        (
            "hello",
            "world",
            None,
            [
                LabwareLoadParams("hello", "world", 123),
                LabwareLoadParams("hello", "foo", 123),
            ],
            "world",
            123,
        ),
        (
            "hello",
            None,
            123,
            [
                LabwareLoadParams("hello", "world", 123),
                LabwareLoadParams("hello", "world", 456),
            ],
            "world",
            123,
        ),
        (
            "hello",
            None,
            None,
            [
                LabwareLoadParams("hello", "world", 123),
                LabwareLoadParams("goodbye", "world", 123),
            ],
            "world",
            123,
        ),
    ],
)
def test_resolve_load_labware_params(
    load_name: str,
    namespace: Optional[str],
    version: Optional[int],
    custom_labware_params: List[LabwareLoadParams],
    expected_namespace: str,
    expected_version: int,
) -> None:
    """It should get a namespace and version based on custom labware available or defaults."""
    result = subject.resolve(load_name, namespace, version, custom_labware_params)

    assert result == (expected_namespace, expected_version)


def test_resolve_load_labware_params_raises() -> None:
    """It should raise if multiple custom labware params are provided."""
    with pytest.raises(subject.AmbiguousLoadLabwareParamsError):
        subject.resolve(
            "hello",
            "world",
            None,
            [
                LabwareLoadParams("hello", "world", 123),
                LabwareLoadParams("hello", "world", 456),
            ],
        )
