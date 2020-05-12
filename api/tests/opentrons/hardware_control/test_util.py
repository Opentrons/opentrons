from typing import List

from opentrons.hardware_control.util import plan_arc
from opentrons.hardware_control.types import CriticalPoint
from opentrons.types import Point

import pytest


def check_arc_basic(arc: List[Point], from_pt: Point, to_pt: Point):
    """ Check the tests that should always be true for different-well moves
    - we should always go only up, then only xy, then only down
    - we should have three moves
    """
    # first move should move only up
    assert arc[0]._replace(z=0) == from_pt._replace(z=0)
    # second move should move only in xy
    assert arc[0].z == arc[1].z
    # second-to-last move should always end at the dest in xy
    # so the last move is z-only
    assert arc[-2]._replace(z=0) == to_pt._replace(z=0)
    # final move should arrive precisely at the dest
    assert arc[-1] == to_pt
    # first move should be up
    assert arc[0].z >= from_pt.z
    # last move should be down
    assert arc[-2].z >= to_pt.z


@pytest.mark.parametrize(
    argnames=['from_pt', 'to_pt', 'z_height'],
    argvalues=[
        [Point(10, 20, 30), Point(10, 30, 30), 100],
        [Point(10, 20, 30), Point(10, 30, 40), 100],
        [Point(10, 20, 40), Point(10, 30, 30), 40],
        [Point(10, 20, 30), Point(10, 30, 40), 40]])
def test_basic_arcs(from_pt, to_pt, z_height):
    check_arc_basic([a[0] for a in plan_arc(from_pt, to_pt, z_height)],
                    from_pt, to_pt)


def test_arc_with_waypoint():
    from_pt = Point(20, 20, 40)
    to_pt = Point(0, 0, 10)
    arc = plan_arc(from_pt, to_pt,
                   50,
                   extra_waypoints=[(5, 10), (20, 30)])
    check_arc_basic([a[0] for a in arc], from_pt, to_pt)
    assert arc[1][0].x == 5
    assert arc[1][0].y == 10
    assert arc[1][0].z == 50
    assert arc[2][0].x == 20
    assert arc[2][0].y == 30
    assert arc[2][0].z == 50


def test_cp_blending():
    from_pt = Point(10, 10, 10)
    to_pt = Point(0, 0, 10)
    arc = plan_arc(from_pt, to_pt, 50, None, CriticalPoint.XY_CENTER)
    check_arc_basic([a[0] for a in arc], from_pt, to_pt)
    assert arc[0][1] is None
    assert arc[1][1] is CriticalPoint.XY_CENTER
    assert arc[2][1] is CriticalPoint.XY_CENTER

    arc2 = plan_arc(from_pt, to_pt, 50, CriticalPoint.TIP, None)
    check_arc_basic([a[0] for a in arc], from_pt, to_pt)
    assert arc2[0][1] == CriticalPoint.TIP
    assert arc2[1][1] is None
    assert arc2[2][1] is None
