import math

import pytest

from opentrons.legacy_api.containers.placeable import (
    Container,
    Well,
    Deck,
    Slot)
from opentrons.util.vector import Vector
from tests.opentrons import generate_plate
# TODO: Remove `generate_plate` and use JS generated data or redesign as
# TODO: property tests
# TODO: Modify all calls to get a Well to use the `wells`/`rows` methods


def assertWellSeriesEqual(w1, w2):
    if hasattr(w1, '__len__') and hasattr(w2, '__len__'):
        if len(w1) != len(w2):
            print(w1)
            print('lengths: {} and {}'.format(len(w1), len(w2)))
            print(w2)
            assert False
        for i in range(len(w1)):
            if w1[i] != w2[i]:
                print(w1)
                print('lengths: {} and {}'.format(len(w1), len(w2)))
                print(w2)
                assert False
    else:
        assert w1 == w2


def test_get_name():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    expected = '<Well A1>'
    assert str(c['A1']) == expected
    expected = '<Container>'
    assert str(c) == expected


def test_iterator():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    res = [well.coordinates() for well in c]
    expected = [(0, 0, 0), (5, 0, 0), (0, 5, 0), (5, 5, 0)]

    assert res == expected


def test_next():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    well = c['A1']
    expected = c.get_child_by_name('B1')

    assert next(well) == expected


def test_cycle():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    cycle_iter = c.cycle()
    for n in range(3):
        for i in range(4):
            assert next(cycle_iter) == c[i]


def test_iter_method():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    cycle_iter = c.iter()
    for i in range(4):
        assert next(cycle_iter) == c[i]


def test_int_index():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)

    assert c[3] == c.get_child_by_name('B2')
    assert c[1] == c.get_child_by_name('B1')


def test_add_placeables():
    a = generate_plate(4, 2, (5, 5), (0, 0), 5)
    b = generate_plate(4, 2, (5, 5), (0, 0), 5)

    result = a + b
    assert len(result) == 8
    for i in range(len(a)):
        assert a[i] == result[i]
    for i in range(len(b)):
        assert b[i] == result[i + len(a)]

    result = a.cols(0) + b.rows(0)
    assert len(result) == 4
    assert a[0] == result[0]
    assert a[1] == result[1]
    assert b[0] == result[2]
    assert b[2] == result[3]


def test_named_well():
    deck = Deck()
    slot = Slot()
    c = Container()
    deck.add(slot, 'A1', (0, 0, 0))
    red = Well(properties={'radius': 5})
    blue = Well(properties={'radius': 5})
    c.add(red, "Red", (0, 0, 0))
    c.add(blue, "Blue", (10, 0, 0))
    slot.add(c)

    assert deck['A1'][0]['Red'] == red


def test_generate_plate():
    c = generate_plate(
        wells=96,
        cols=8,
        spacing=(10, 15),
        offset=(5, 15),
        radius=5
    )

    assert c['A1'].coordinates() == (5, 15, 0)
    assert c['B2'].coordinates() == (15, 30, 0)


def test_coordinates():
    deck = Deck()
    slot = Slot()
    plate = generate_plate(
        wells=96,
        cols=8,
        spacing=(10, 15),
        offset=(5, 15),
        radius=5
    )
    deck.add(slot, 'B2', (100, 200, 0))
    slot.add(plate)

    assert plate['A1'].coordinates(deck) == (105, 215, 0)


def test_get_container_name():
    deck = Deck()
    slot = Slot()
    c = Container()
    deck.add(slot, 'A1', (0, 0, 0))
    red = Well(properties={'radius': 5})
    blue = Well(properties={'radius': 5})
    c.add(red, "Red", (0, 0, 0))
    c.add(blue, "Blue", (10, 0, 0))
    slot.add(c)

    assert red.get_name() == 'Red'


def test_well_from_center():
    deck = Deck()
    slot = Slot()
    plate = generate_plate(
        wells=4,
        cols=2,
        spacing=(10, 10),
        offset=(0, 0),
        radius=5
    )
    deck.add(slot, 'A1', (0, 0, 0))
    slot.add(plate)

    assert plate['B2'].center() == (5, 5, 0)
    assert plate['B2'].from_center(x=0.0, y=0.0, z=0.0) == (5, 5, 0)
    assert plate['B2'].from_center(r=1.0, theta=math.pi / 2, h=0.0)\
        == (5.0, 10.0, 0)


def test_get_all_children():
    c1 = generate_plate(4, 2, (5, 5), (0, 0), 5)
    c2 = generate_plate(4, 2, (5, 5), (0, 0), 5)
    deck = Deck()
    deck.add(c1, "A1", (0, 0, 0))
    deck.add(c2, "A2", (50, 50, 50))
    assert len(deck.get_all_children()) == 10


def test_top_bottom():
    deck = Deck()
    slot = Slot()
    plate = generate_plate(
        wells=4,
        cols=2,
        spacing=(10, 10),
        offset=(0, 0),
        radius=5,
        height=10
    )
    deck.add(slot, 'A1', (0, 0, 0))
    slot.add(plate)

    assert plate['A1'].bottom(10) == (plate['A1'], Vector(5, 5, 10))
    assert plate['A1'].top(10) == (plate['A1'], Vector(5, 5, 20))
    assert plate['A1'].bottom(10, radius=1.0, degrees=90) \
        == (plate['A1'], Vector(5, 10, 10))
    assert plate['A1'].top(10, radius=1.0, degrees=90)\
        == (plate['A1'], Vector(5, 10, 20))
    assert plate['A1'].bottom(10, radius=0.5, degrees=270)\
        == (plate['A1'], Vector(5, 2.5, 10.00))
    assert plate['A1'].top(10, radius=0.5, degrees=270)\
        == (plate['A1'], Vector(5, 2.5, 20.00))


def test_slice_with_strings():
    c = generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)
    assertWellSeriesEqual(c['A1':'A2'], c[0:8])
    assertWellSeriesEqual(c['A12':], c.cols[-1][0:])
    assertWellSeriesEqual(c.cols['4':'8'], c.cols[3:7])
    assertWellSeriesEqual(c.rows['B':'E'], c.rows[1:4])
    assertWellSeriesEqual(c.rows['B']['1':'7'], c.rows[1][0:6])


def test_wells():
    c = generate_plate(96, 8, (9, 9), (16, 11), 2.5, 40)

    assertWellSeriesEqual(c.well(0), c[0])
    assertWellSeriesEqual(c.well('A2'), c['A2'])
    assertWellSeriesEqual(c.wells(0), c[0])
    assertWellSeriesEqual(c.wells(), c[0:])

    expected = [c[n] for n in ['A1', 'B2', 'C3']]
    assertWellSeriesEqual(c.wells('A1', 'B2', 'C3'), expected)
    assertWellSeriesEqual(c.get('A1', 'B2', 'C3'), expected)
    assertWellSeriesEqual(c('A1', 'B2', 'C3'), expected)

    expected = [c.rows[0][0], c.rows[0][5]]
    assertWellSeriesEqual(c.rows['A'].wells('1', '6'), expected)
    assertWellSeriesEqual(c.rows['A'].get('1', '6'), expected)

    expected = [c.rows[0][0], c.rows[0][5]]
    assertWellSeriesEqual(c.rows['A'].wells(['1', '6']), expected)
    assertWellSeriesEqual(c.rows['A'].get('1', '6'), expected)
    assertWellSeriesEqual(c.rows('A').get('1', '6'), expected)

    expected = c.wells('A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1')
    assertWellSeriesEqual(c.wells('A1', to='H1'), expected)
    assertWellSeriesEqual(c.get('A1', to='H1'), expected)

    expected = c.wells('A1', 'C1', 'E1', 'G1')
    assertWellSeriesEqual(c.wells('A1', to='H1', step=2), expected)
    assertWellSeriesEqual(c.get('A1', to='H1', step=2), expected)

    expected = c.cols['1':'12':2]
    assertWellSeriesEqual(c.cols('1', to='12', step=2), expected)

    expected = c.wells(
        'A3', 'G2', 'E2', 'C2', 'A2', 'G1', 'E1', 'C1', 'A1')
    assertWellSeriesEqual(c.wells('A3', to='A1', step=2), expected)
    assertWellSeriesEqual(c.get('A3', to='A1', step=2), expected)

    expected = c.wells('A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1')
    assertWellSeriesEqual(c.wells('A1', length=8), expected)

    expected = c.wells('A1', 'C1', 'E1', 'G1', 'A2', 'C2', 'E2', 'G2')
    assertWellSeriesEqual(c.wells('A1', length=8, step=2), expected)

    expected = c.wells('A1', 'H12', 'G12', 'F12')
    assertWellSeriesEqual(c.wells('A1', length=4, step=-1), expected)

    expected = c.wells('A1', 'H12', 'G12', 'F12')
    assertWellSeriesEqual(c.wells('A1', length=-4, step=-1), expected)

    expected = c.wells('A1', 'H12', 'G12', 'F12')
    assertWellSeriesEqual(c.wells('A1', length=-4, step=1), expected)

    expected = c.wells('A1', 'B1', 'C1', 'D1')
    assertWellSeriesEqual(c.wells(length=4), expected)

    assertWellSeriesEqual(c.wells(43), c.wells(x=3, y=5))
    assertWellSeriesEqual(c.rows(3), c.wells(y=3))
    assertWellSeriesEqual(c.cols(4), c.wells(x=4))
    with pytest.raises(ValueError):
        c.wells(**{'x': '1', 'y': '2'})
