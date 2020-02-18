from opentrons.helpers import helpers
from opentrons.util.vector import Vector
# TODO: Move `helpers` methods into either pipette or other non-generic place


def test_break_down_travel():
    # with 3-dimensional points
    p1 = Vector(0, 0, 0)
    p2 = Vector(10, -12, 14)
    res = helpers.break_down_travel(
        p1, p2, increment=5, mode='absolute')
    assert res[-1] == p2
    assert len(res) == 5

    p1 = Vector(10, -12, 14)
    res = helpers.break_down_travel(Vector(0, 0, 0), p1, mode='relative')
    expected = Vector(
        0.46537410754407676,
        -0.5584489290528921,
        0.6515237505617075)
    assert res[-1] == expected
    assert len(res) == 5
