import pytest
from opentrons.trackers.pose_tracker import (
    Point, Node, add, children, ascend, absolute, relative, max_z,
    stringify, update, remove, translate
)
from numpy import isclose, array, ndarray


def scale(cx, cy, cz) -> ndarray:
    return array([
        [ cx, 0.0, 0.0,   0],  # NOQA
        [0.0,  cy, 0.0,   0],
        [0.0, 0.0,  cz,   0],
        [0.0, 0.0, 0.0, 1.0]
    ])


def rotate(theta: float) -> ndarray:
    from math import sin, cos
    return array([
        [cos(theta), -sin(theta), 0.0,   0],
        [sin(theta),  cos(theta), 0.0,   0],
        [       0.0,         0.0, 1.0,   0],  # NOQA
        [       0.0,         0.0, 0.0, 1.0]   # NOQA
    ])


@pytest.fixture
def state():
    return add({}, 'root') \
        .add('1', parent='root', point=Point(1, 2, 3)) \
        .add('2', parent='root', point=Point(-1, -2, -3)) \
        .add('1-1', parent='1', point=Point(11, 12, 13)) \
        .add('1-1-1', parent='1-1', point=Point(0, 0, 0)) \
        .add('1-2', parent='1', point=Point(21, 22, 23)) \
        .add('2-1', parent='2', point=Point(-11, -12, -13)) \
        .add('2-2', parent='2', point=Point(-21, -22, -23))


def test_add():
    state = {}
    state = add(state, 'root')
    assert state == {
        'root': Node(
            parent=None,
            children=[],
            transform=translate(Point(0, 0, 0)))
    }
    state = add(state, 'child', 'root', Point(1, 2, 3))
    assert state == {
        'root': Node(
            parent=None,
            children=['child'],
            transform=translate(Point(0, 0, 0))),
        'child': Node(
            parent='root',
            children=[],
            transform=translate(Point(-1, -2, -3)))
    }

    with pytest.raises(AssertionError):
        add(state, 'child', 'root', Point(1, 2, 3))

    with pytest.raises(KeyError):
        add(state, 'new-child', 'another-root', Point(1, 2, 3))


def test_children(state):
    assert children(state, '1') == [('1-1', 0), ('1-1-1', 1), ('1-2', 0)]
    assert children(state, '1-1') == [('1-1-1', 0)]
    assert children(state, 'root') == [
        ('1', 0),
        ('1-1', 1),
        ('1-1-1', 2),
        ('1-2', 1),
        ('2', 0),
        ('2-1', 1),
        ('2-2', 1)
    ]
    assert children(state, '1-1-1') == []


def test_ascend(state):
    assert ascend(state, '1-1-1') == ['1-1-1', '1-1', '1', 'root']
    assert ascend(state, '1-1') == ['1-1', '1', 'root']
    assert ascend(state, 'root') == ['root']


def test_relative(state):
    from math import pi
    assert (relative(state, src='1-1', dst='2-1') == (24., 28., 32.)).all()
    state = \
        add({}, 'root') \
        .add('1', parent='root', transform=rotate(pi / 2.0)) \
        .add('1-1', parent='1', point=Point(1, 0, 0)) \
        .add('2', parent='root', point=Point(1, 0, 0))

    assert isclose(relative(state, src='1-1', dst='2'), (-1.0, -1.0, 0)).all()
    assert isclose(relative(state, src='2', dst='1-1'), (0.0, 0.0, 0)).all()

    state = add({}, 'root') \
        .add('1', parent='root', transform=scale(2, 1, 1)) \
        .add('1-1', parent='1', point=Point(1, 1, 1)) \

    assert isclose(relative(state, src='root', dst='1-1'), (-2.0, -1.0, -1.0)).all()
    assert isclose(relative(state, src='1-1', dst='root'), (0.5, 1.0, 1.0)).all()


def test_absolute(state):
    assert (absolute(state, '1') == (1, 2, 3)).all()
    assert (absolute(state, '1-1') == (12, 14, 16)).all()
    assert (absolute(state, '2') == (-1, -2, -3)).all()
    assert (absolute(state, '2-1') == (-12, -14, -16)).all()


def test_max_z(state):
    assert max_z(state, '1') == 23


def test_stringify(state):
    assert stringify(state, '1-2') == '1-2 [-21.0, -22.0, -23.0] [ 22.  24.  26.]'
    assert stringify(state) == '\n'.join(
        ['root [0.0, 0.0, 0.0] [ 0.  0.  0.]'] +
        [' ' + s for s in stringify(state, '1').split('\n')] +
        [' ' + s for s in stringify(state, '2').split('\n')]
    )


def test_update(state):
    state = update(state, '1-1', Point(0, 0, 0))
    assert (absolute(state, '1-1-1') == (1, 2, 3)).all()


def test_remove(state):
    state = remove(state, '1')
    assert {*state} == {'2-1', '2', '2-2', 'root'}
    state = remove(state, '2')
    assert {*state} == {'root'}
    state = remove(state, 'root')
    assert state == {}


def test_transform():
    from math import pi
    state = add({}, 'root') \
        .add('1', parent='root', transform=scale(2, 2, 2)) \
        .add('1-1', parent='1', point=Point(1, 0, 0))

    assert isclose(absolute(state, '1-1'), (0.5, 0, 0)).all()
