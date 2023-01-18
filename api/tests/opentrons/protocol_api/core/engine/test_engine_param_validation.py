"""Tests for Protocol API engine parameter validation."""
import pytest
from typing import List, Optional

from opentrons.protocol_api.core.engine import engine_param_validation as subject
from opentrons.protocol_api.core.engine.exceptions import (
    AmbiguousLoadLabwareParamsError,
)
from opentrons.protocol_engine.state.labware import LabwareLoadParams
from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE


@pytest.mark.parametrize(
    argnames=[
        "custom_labware_params",
        "namespace",
        "version",
        "expected_namespace",
        "expected_version",
    ],
    argvalues=[
        ([], "hello", 123, "hello", 123),
        ([], None, None, OPENTRONS_NAMESPACE, 1),
        ([], "hello", None, "hello", 1),
        ([], None, 123, OPENTRONS_NAMESPACE, 123),
        (
            [LabwareLoadParams("labware", "namespace", 456)],
            None,
            None,
            "namespace",
            456,
        ),
    ],
)
def test_resolve_load_labware_params(
    custom_labware_params: List[LabwareLoadParams],
    namespace: Optional[str],
    version: Optional[int],
    expected_namespace: str,
    expected_version: int,
) -> None:
    """It should get a namespace and version based on custom labware available or defaults."""
    result = subject.resolve_load_labware_params(
        custom_labware_params, namespace, version
    )

    assert result == (expected_namespace, expected_version)


def test_resolve_load_labware_params_raises() -> None:
    """It should raise if multiple custom labware params are provided."""
    with pytest.raises(AmbiguousLoadLabwareParamsError):
        subject.resolve_load_labware_params(
            [
                LabwareLoadParams("abc", "xyz", 123),
                LabwareLoadParams("qwerty", "uiop", 456),
            ],
            None,
            None,
        )
