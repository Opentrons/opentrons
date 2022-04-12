import pytest
from opentrons.types import Point, Location
from opentrons.protocol_api.labware import Labware


def test_point_mul() -> None:
    a = Point(1, 2, 3)
    b: float = 2
    assert a * b == Point(2, 4, 6)

    b = 3.1
    assert a * b == Point(3.1, 6.2, 9.3)

    with pytest.raises(TypeError):
        a * a  # type: ignore[operator]


def test_point_rmul() -> None:
    a = Point(1, 2, 3)
    b: float = 2
    assert b * a == Point(2, 4, 6)

    b = 3.1
    assert b * a == Point(3.1, 6.2, 9.3)


def test_location_repr_labware(min_lw: Labware) -> None:
    """It should represent labware as Labware"""
    loc = Location(point=Point(x=1.1, y=2.1, z=3.5), labware=min_lw)
    assert (
        f"{loc}"
        == "Location(point=Point(x=1.1, y=2.1, z=3.5), labware=minimal labware on deck)"
    )


def test_location_repr_well(min_lw: Labware) -> None:
    """It should represent labware as Well"""
    loc = Location(point=Point(x=1, y=2, z=3), labware=min_lw.wells()[0])
    assert (
        f"{loc}"
        == "Location(point=Point(x=1, y=2, z=3), labware=A1 of minimal labware on deck)"
    )


def test_location_repr_slot() -> None:
    """It should represent labware as a slot"""
    loc = Location(point=Point(x=-1, y=2, z=3), labware="1")
    assert f"{loc}" == "Location(point=Point(x=-1, y=2, z=3), labware=1)"
