import pytest

from opentrons.protocol_api.geometry import Deck, plan_moves
from opentrons.protocol_api import labware

# TODO: Remove once load_labware_by_name is implemented
labware_name = 'generic_96_wellPlate_380_uL'


def test_slot_names():
    slots_by_int = list(range(1, 13))
    slots_by_str = [str(idx) for idx in slots_by_int]
    for method in (slots_by_int, slots_by_str):
        d = Deck()
        for idx, slot in enumerate(method):
            lw = labware.load(labware_name, d.position_for(slot))
            assert slot in d
            d[slot] = lw
            with pytest.raises(ValueError):
                d[slot] = 'not this time boyo'
            del d[slot]
            assert slot in d
            assert d[slot] is None
            mod = labware.load_module('tempdeck', d.position_for(slot))
            d[slot] = mod
            assert mod == d[slot]

    assert 'hasasdaia' not in d
    with pytest.raises(ValueError):
        d['ahgoasia'] = 'nope'


def test_highest_z():
    deck = Deck()
    assert deck.highest_z == 0
    lw = labware.load(labware_name, deck.position_for(1))
    deck[1] = lw
    assert deck.highest_z == lw.wells()[0].top().point.z
    del deck[1]
    assert deck.highest_z == 0
    mod = labware.load_module('tempdeck', deck.position_for(8))
    deck[8] = mod
    assert deck.highest_z == mod.highest_z
    lw = labware.load(labware_name, mod.location)
    mod.add_labware(lw)
    deck.recalculate_high_z()
    assert deck.highest_z == mod.highest_z


def check_arc_basic(arc, from_loc, to_loc):
    """ Check the tests that should always be true for different-well moves
    - we should always go only up, then only xy, then only down
    - we should have three moves
    """
    assert len(arc) == 3
    assert arc[0]._replace(z=0) == from_loc.point._replace(z=0)
    assert arc[0].z >= from_loc.point.z
    assert arc[0].z == arc[1].z
    assert arc[1]._replace(z=0) == to_loc.point._replace(z=0)
    assert arc[1].z >= to_loc.point.z
    assert arc[2] == to_loc.point


def test_direct_movs():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))

    same_place = plan_moves(lw1.wells()[0].top(), lw1.wells()[0].top(), deck)
    assert same_place == [lw1.wells()[0].top().point]

    same_well = plan_moves(lw1.wells()[0].top(), lw1.wells()[0].bottom(), deck)
    assert same_well == [lw1.wells()[0].bottom().point]


def test_basic_arc():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    lw2 = labware.load(labware_name, deck.position_for(2))
    # same-labware moves should use the smaller safe z
    same_lw = plan_moves(lw1.wells()[0].top(),
                         lw1.wells()[8].bottom(),
                         deck,
                         7.0, 15.0)
    check_arc_basic(same_lw, lw1.wells()[0].top(), lw1.wells()[8].bottom())
    assert same_lw[0].z == lw1.wells()[0].top().point.z + 7.0

    # different-labware moves, or moves with no labware attached,
    # should use the larger safe z and the global z
    different_lw = plan_moves(lw1.wells()[0].top(),
                              lw2.wells()[0].bottom(),
                              deck,
                              7.0, 15.0)
    check_arc_basic(different_lw,
                    lw1.wells()[0].top(), lw2.wells()[0].bottom())
    assert different_lw[0].z == deck.highest_z + 15.0


def test_no_labware_loc():
    labware_def = labware._load_definition_by_name(labware_name)

    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    lw2 = labware.load(labware_name, deck.position_for(2))
    # Various flavors of locations without labware should work
    no_lw = lw1.wells()[0].top()._replace(labware=None)

    no_from = plan_moves(no_lw, lw2.wells()[0].bottom(), deck, 7.0, 15.0)
    check_arc_basic(no_from, no_lw, lw2.wells()[0].bottom())
    assert no_from[0].z == deck.highest_z + 15.0

    no_to = plan_moves(lw1.wells()[0].bottom(), no_lw, deck, 7.0, 15.0)
    check_arc_basic(no_to, lw1.wells()[0].bottom(), no_lw)
    assert no_from[0].z == deck.highest_z + 15.0

    no_well = lw1.wells()[0].top()._replace(labware=lw1)

    no_from_well = plan_moves(no_well, lw1.wells()[1].top(), deck, 7.0, 15.0)
    check_arc_basic(no_from_well, no_well, lw1.wells()[1].top())
    assert no_from_well[0].z\
        == labware_def['dimensions']['overallHeight'] + 7.0

    no_to_well = plan_moves(lw1.wells()[1].top(), no_well, deck, 7.0, 15.0)
    check_arc_basic(no_to_well, lw1.wells()[1].top(), no_well)
    assert no_to_well[0].z == labware_def['dimensions']['overallHeight'] + 7.0


def test_arc_tall_point():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    tall_z = 100
    old_top = lw1.wells()[0].top()
    tall_point = old_top.point._replace(z=tall_z)
    tall_top = old_top._replace(point=tall_point)
    to_tall = plan_moves(lw1.wells()[2].top(), tall_top, deck, 7.0, 15.0)
    check_arc_basic(to_tall, lw1.wells()[2].top(), tall_top)
    assert to_tall[0].z == tall_z

    from_tall = plan_moves(tall_top, lw1.wells()[3].top(), deck, 7.0, 15.0)
    check_arc_basic(from_tall, tall_top, lw1.wells()[3].top())
    assert from_tall[0].z == tall_z

    no_well = tall_top._replace(labware=lw1)
    from_tall_lw = plan_moves(no_well, lw1.wells()[4].bottom(), deck,
                              7.0, 15.0)
    check_arc_basic(from_tall_lw, no_well, lw1.wells()[4].bottom())
