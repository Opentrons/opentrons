import json

import pytest

from opentrons.util.vector import (Vector, VectorEncoder, VectorValue)


def test_init():
    v1 = Vector(1, 2, 3)
    v2 = Vector((1, 2, 3))
    v3 = Vector({'x': 1, 'y': 2, 'z': 3})
    v4 = Vector({'x': 1})

    assert v1 == (1, 2, 3)
    assert v2 == (1, 2, 3)
    assert v3 == (1, 2, 3)
    assert v4 == Vector(1, 0, 0)

    with pytest.raises(ValueError):
        Vector()


def test_repr():
    v1 = Vector(1, 2, 3)
    assert str(v1) == '(x=1.00, y=2.00, z=3.00)'


def test_add():
    v1 = Vector(1, 2, 3)
    v2 = Vector(4, 5, 6)
    res = v1 + v2

    assert res == Vector(5, 7, 9)


def test_to_iterable():
    v1 = Vector(1, 2, 3)
    iterable = v1.to_iterable()
    assert hasattr(iterable, '__iter__')


def test_zero_coordinates():
    zero_coords = Vector(1, 2, 3).zero_coordinates()
    assert zero_coords == VectorValue(0, 0, 0)


def test_substract():
    v1 = Vector(1, 2, 3)
    v2 = Vector(4, 5, 6)
    res = v2 - v1

    assert res == Vector(3.0, 3.0, 3.0)


def test_index():
    v1 = Vector(1, 2, 3)

    assert v1['x'] == 1
    assert v1[0] == 1
    assert tuple(v1[:-1]) == (1, 2)


def test_iterator():
    v1 = Vector(1, 2, 3)

    res = tuple([x for x in v1])
    assert res == (1, 2, 3)


def test_div():
    v1 = Vector(2.0, 4.0, 6.0)
    res = v1 / 2.0

    assert res == Vector(1.0, 2.0, 3.0)
    res = v1 / Vector(2.0, 4.0, 6.0)
    assert res == Vector(1.0, 1.0, 1.0)


def test_mul():
    v1 = Vector(2.0, 4.0, 6.0)
    res = v1 * 2.0
    assert res == Vector(4.0, 8.0, 12.0)

    res = v1 * Vector(-1.0, -1.0, -1.0)
    assert res == Vector(-2.0, -4.0, -6.0)


def test_json_encoder():
    v1 = Vector(1.0, 2.0, 3.0)
    s = json.dumps(v1, cls=VectorEncoder)
    v2 = json.loads(s)
    assert v1 == v2
