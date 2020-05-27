import pytest
from opentrons.types import Point

def test_point_mul():
    a = Point(1, 2, 3)
    b = 2
    assert a * b == Point(2, 4, 6)

    b = 3.1
    assert a * b == Point(3.1, 6.2, 9.3)

    with pytest.raises(TypeError):
        a * a


def test_point_rmul():
    a = Point(1, 2, 3)
    b = 2
    assert b * a == Point(2, 4, 6)

    b = 3.1
    assert b * a == Point(3.1, 6.2, 9.3)
