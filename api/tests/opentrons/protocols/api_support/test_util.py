from typing import Dict

import pytest

from opentrons.hardware_control.types import Axis
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import (
    AxisMaxSpeeds,
    find_value_for_api_version,
)


def test_max_speeds_userdict() -> None:
    defaults = AxisMaxSpeeds(robot_type="OT-2 Standard")
    assert defaults.data == {}
    assert dict(defaults) == {}

    with pytest.raises(KeyError):
        defaults["asdas"] = 2

    with pytest.raises(AssertionError):
        defaults["x"] = -1

    with pytest.raises(AssertionError):
        defaults["y"] = "ggg"

    with pytest.raises(KeyError):
        defaults["b"] = 2

    with pytest.raises(KeyError):
        defaults["c"] = 3

    defaults["x"] = 2
    defaults[Axis.A] = 20

    assert defaults["X"] == 2
    assert defaults["x"] == 2
    assert defaults[Axis.X] == 2

    assert defaults["A"] == 20
    assert defaults["a"] == 20
    assert defaults[Axis.A] == 20

    assert sorted(list(defaults.keys())) == sorted(["X", "A"])
    assert "X" in defaults.keys()

    del defaults["A"]
    assert "A" not in defaults

    defaults["x"] = None
    assert "x" not in defaults


@pytest.mark.parametrize(
    "data,level,desired",
    [
        ({"2.0": 5}, APIVersion(2, 0), 5),
        ({"2.0": 5}, APIVersion(2, 5), 5),
        ({"2.6": 4, "2.0": 5}, APIVersion(2, 1), 5),
        ({"2.6": 4, "2.0": 5}, APIVersion(2, 6), 4),
        ({"2.0": 5, "2.6": 4}, APIVersion(2, 3), 5),
        ({"2.0": 5, "2.6": 4}, APIVersion(2, 6), 4),
    ],
)
def test_find_value_for_api_version(
    data: Dict[str, float], level: APIVersion, desired: float
) -> None:
    assert find_value_for_api_version(level, data) == desired
