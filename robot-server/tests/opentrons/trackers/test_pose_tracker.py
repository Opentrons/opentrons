import pytest
from opentrons.trackers.pose_tracker import (
    Point, Node, add, descendants, ascend, change_base, max_z,
    update, remove, translate, init, ROOT, has_children
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
    return init() \
        .add('1', point=Point(1, 2, 3)) \
        .add('2', point=Point(-1, -2, -3)) \
        .add('1-1', parent='1', point=Point(11, 12, 13)) \
        .add('1-1-1', parent='1-1', point=Point(0, 0, 0)) \
        .add('1-2', parent='1', point=Point(21, 22, 23)) \
        .add('2-1', parent='2', point=Point(-11, -12, -13)) \
        .add('2-2', parent='2', point=Point(-21, -22, -23))


def test_add():
    state = init()
    assert state == {
        ROOT: Node(
            parent=None,
            children=[],
            transform=translate(Point(0, 0, 0)))
    }
    state = add(state, obj='child', point=Point(1, 2, 3))
    assert state == {
        ROOT: Node(
            parent=None,
            children=['child'],
            transform=translate(Point(0, 0, 0))),
        'child': Node(
            parent=ROOT,
            children=[],
            transform=translate(Point(-1, -2, -3)))
    }

    with pytest.raises(AssertionError):
        add(state, obj='child', point=Point(1, 2, 3))

    with pytest.raises(KeyError):
        add(
            state,
            obj='new-child',
            parent='another-root',
            point=Point(1, 2, 3)
        )


def test_descendants(state):
    assert descendants(state, '1') == [('1-1', 0), ('1-1-1', 1), ('1-2', 0)]
    assert descendants(state, '1-1') == [('1-1-1', 0)]
    assert descendants(state, ROOT) == [
        ('1', 0),
        ('1-1', 1),
        ('1-1-1', 2),
        ('1-2', 1),
        ('2', 0),
        ('2-1', 1),
        ('2-2', 1)
    ]
    assert descendants(state, '1-1-1') == []


def test_has_children(state):
    assert not has_children(state, '2-2')
    assert has_children(state, '2')


def test_ascend(state):
    assert ascend(state, '1-1-1') == ['1-1-1', '1-1', '1', ROOT]
    assert ascend(state, '1-1') == ['1-1', '1', ROOT]
    assert ascend(state, ROOT) == [ROOT]


def test_relative(state):
    from math import pi
    assert (change_base(state, src='1-1', dst='2-1') == (24., 28., 32.)).all()
    state = \
        init() \
        .add('1', transform=rotate(pi / 2.0)) \
        .add('1-1', parent='1', point=Point(1, 0, 0)) \
        .add('2', point=Point(1, 0, 0))

    assert isclose(
        change_base(state, src='1-1', dst='2'), (-1.0, -1.0, 0)).all()
    assert isclose(
        change_base(state, src='2', dst='1-1'), (0.0, 0.0, 0)).all()

    state = init() \
        .add('1', transform=scale(2, 1, 1)) \
        .add('1-1', parent='1', point=Point(1, 1, 1)) \

    assert isclose(
        change_base(state, src=ROOT, dst='1-1'), (-2.0, -1.0, -1.0)).all()
    assert isclose(
        change_base(state, src='1-1', dst=ROOT), (0.5, 1.0, 1.0)).all()


def test_absolute(state):
    assert (change_base(state, src='1') == (1, 2, 3)).all()
    assert (change_base(state, src='1-1') == (12, 14, 16)).all()
    assert (change_base(state, src='2') == (-1, -2, -3)).all()
    assert (change_base(state, src='2-1') == (-12, -14, -16)).all()


def test_max_z(state):
    assert max_z(state, '1') == 23.0


def test_update(state):
    state = update(state, '1-1', Point(0, 0, 0))
    assert (change_base(state, src='1-1-1') == (1, 2, 3)).all()


def test_remove(state):
    state = remove(state, '1')
    assert {*state} == {'2-1', '2', '2-2', ROOT}
    state = remove(state, '2')
    assert {*state} == {ROOT}
    state = remove(state, ROOT)
    assert state == {}


def test_change_base():
    state = init() \
        .add('1', parent=ROOT, transform=scale(2, 2, 2)) \
        .add('1-1', parent='1', point=Point(1, 0, 0))

    assert isclose(change_base(state, src='1-1'), (0.5, 0, 0)).all()
