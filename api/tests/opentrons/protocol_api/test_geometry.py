import pytest

from opentrons.types import Location, Point
from opentrons.protocol_api.geometry import (
    Deck, plan_moves, safe_height, first_parent, should_dodge_thermocycler)
from opentrons.protocol_api import labware, module_geometry
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocol_api.definitions import MAX_SUPPORTED_VERSION

labware_name = 'corning_96_wellplate_360ul_flat'
trough_name = 'usascientific_12_reservoir_22ml'
P300M_GEN2_MAX_HEIGHT = 155.75


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
            mod = module_geometry.load_module(
                module_geometry.TemperatureModuleModel.TEMPERATURE_V1,
                d.position_for(slot))
            d[slot] = mod
            assert mod == d[slot]

    assert 'hasasdaia' not in d
    with pytest.raises(ValueError):
        d['ahgoasia'] = 'nope'


def test_slot_collisions():
    d = Deck()
    mod_slot = '7'
    mod = module_geometry.load_module(
        module_geometry.ThermocyclerModuleModel.THERMOCYCLER_V1,
        d.position_for(mod_slot))
    d[mod_slot] = mod
    with pytest.raises(ValueError):
        d['7'] = 'not this time boyo'
    with pytest.raises(ValueError):
        d['8'] = 'nor this time boyo'
    with pytest.raises(ValueError):
        d['10'] = 'or even this time boyo'
    with pytest.raises(ValueError):
        d['11'] = 'def not this time though'

    lw_slot = '4'
    lw = labware.load(labware_name, d.position_for(lw_slot))
    d[lw_slot] = lw

    assert lw_slot in d


def test_highest_z():
    deck = Deck()
    assert deck.highest_z == 0
    lw = labware.load(labware_name, deck.position_for(1))
    deck[1] = lw
    assert deck.highest_z == pytest.approx(lw.wells()[0].top().point.z)
    del deck[1]
    assert deck.highest_z == 0
    mod = module_geometry.load_module(
        module_geometry.TemperatureModuleModel.TEMPERATURE_V1,
        deck.position_for(8))
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
    assert arc[0][0]._replace(z=0) == from_loc.point._replace(z=0)
    assert arc[0][0].z == arc[1][0].z
    assert arc[1][0]._replace(z=0) == to_loc.point._replace(z=0)
    assert arc[2][0] == to_loc.point
    assert arc[0][0].z >= from_loc.point.z
    assert arc[1][0].z >= to_loc.point.z


def test_direct_movs():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))

    same_place = plan_moves(
        lw1.wells()[0].top(), lw1.wells()[0].top(), deck,
        instr_max_height=P300M_GEN2_MAX_HEIGHT)
    assert same_place == [(lw1.wells()[0].top().point, None)]

    same_well = plan_moves(
        lw1.wells()[0].top(), lw1.wells()[0].bottom(), deck,
        instr_max_height=P300M_GEN2_MAX_HEIGHT)
    assert same_well == [(lw1.wells()[0].bottom().point, None)]


def test_basic_arc():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    lw2 = labware.load(labware_name, deck.position_for(2))
    deck[1] = lw1
    deck[2] = lw2

    # same-labware moves should use the smaller safe z
    same_lw = plan_moves(lw1.wells()[0].top(),
                         lw1.wells()[8].bottom(),
                         deck,
                         P300M_GEN2_MAX_HEIGHT,
                         7.0, 15.0)
    check_arc_basic(same_lw, lw1.wells()[0].top(), lw1.wells()[8].bottom())
    assert same_lw[0][0].z == lw1.wells()[0].top().point.z + 7.0

    # different-labware moves, or moves with no labware attached,
    # should use the larger safe z and the global z
    different_lw = plan_moves(lw1.wells()[0].top(),
                              lw2.wells()[0].bottom(),
                              deck,
                              P300M_GEN2_MAX_HEIGHT,
                              7.0, 15.0)
    check_arc_basic(different_lw,
                    lw1.wells()[0].top(), lw2.wells()[0].bottom())
    assert different_lw[0][0].z == deck.highest_z + 15.0


def test_force_direct():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    lw2 = labware.load(labware_name, deck.position_for(2))
    # same-labware moves should move direct
    same_lw = plan_moves(lw1.wells()[0].top(),
                         lw1.wells()[8].bottom(),
                         deck,
                         P300M_GEN2_MAX_HEIGHT,
                         7.0, 15.0, force_direct=True)
    assert same_lw == [(lw1.wells()[8].bottom().point, None)]

    # different-labware moves should move direct
    different_lw = plan_moves(lw1.wells()[0].top(),
                              lw2.wells()[0].bottom(),
                              deck,
                              P300M_GEN2_MAX_HEIGHT,
                              7.0, 15.0, force_direct=True)
    assert different_lw == [(lw2.wells()[0].bottom().point, None)]


def test_no_labware_loc():
    labware_def = labware.get_labware_definition(labware_name)

    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    lw2 = labware.load(labware_name, deck.position_for(2))
    deck[1] = lw1
    deck[2] = lw2
    # Various flavors of locations without labware should work
    no_lw = lw1.wells()[0].top()._replace(labware=None)

    no_from = plan_moves(no_lw, lw2.wells()[0].bottom(), deck,
                         P300M_GEN2_MAX_HEIGHT, 7.0, 15.0)
    check_arc_basic(no_from, no_lw, lw2.wells()[0].bottom())
    assert no_from[0][0].z == deck.highest_z + 15.0

    no_to = plan_moves(lw1.wells()[0].bottom(), no_lw, deck,
                       P300M_GEN2_MAX_HEIGHT, 7.0, 15.0)
    check_arc_basic(no_to, lw1.wells()[0].bottom(), no_lw)
    assert no_from[0][0].z == deck.highest_z + 15.0

    no_well = lw1.wells()[0].top()._replace(labware=lw1)

    no_from_well = plan_moves(no_well, lw1.wells()[1].top(), deck,
                              P300M_GEN2_MAX_HEIGHT, 7.0, 15.0)
    check_arc_basic(no_from_well, no_well, lw1.wells()[1].top())
    assert no_from_well[0][0].z\
        == labware_def['dimensions']['zDimension'] + 7.0

    no_to_well = plan_moves(lw1.wells()[1].top(), no_well, deck,
                            P300M_GEN2_MAX_HEIGHT, 7.0, 15.0)
    check_arc_basic(no_to_well, lw1.wells()[1].top(), no_well)
    assert no_to_well[0][0].z\
        == labware_def['dimensions']['zDimension'] + 7.0


def test_arc_tall_point():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    tall_z = 100
    old_top = lw1.wells()[0].top()
    tall_point = old_top.point._replace(z=tall_z)
    tall_top = old_top._replace(point=tall_point)
    to_tall = plan_moves(lw1.wells()[2].top(), tall_top, deck, 7.0, 15.0)
    check_arc_basic(to_tall, lw1.wells()[2].top(), tall_top)
    assert to_tall[0][0].z == tall_z

    from_tall = plan_moves(tall_top, lw1.wells()[3].top(), deck, 7.0, 15.0)
    check_arc_basic(from_tall, tall_top, lw1.wells()[3].top())
    assert from_tall[0][0].z == tall_z

    no_well = tall_top._replace(labware=lw1)
    from_tall_lw = plan_moves(no_well, lw1.wells()[4].bottom(), deck,
                              7.0, 15.0)
    check_arc_basic(from_tall_lw, no_well, lw1.wells()[4].bottom())


def test_arc_lower_minimum_z_height():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    tall_z = 100
    minimum_z_height = 42
    old_top = lw1.wells()[0].top()
    tall_point = old_top.point._replace(z=tall_z)
    tall_top = old_top._replace(point=tall_point)
    to_tall = plan_moves(
        lw1.wells()[2].top(), tall_top, deck,
        P300M_GEN2_MAX_HEIGHT, 7.0, 15.0, False,
        minimum_z_height=minimum_z_height)
    check_arc_basic(to_tall, lw1.wells()[2].top(), tall_top)
    assert to_tall[0][0].z == tall_z

    from_tall = plan_moves(
        tall_top, lw1.wells()[3].top(), deck,
        P300M_GEN2_MAX_HEIGHT, 7.0, 15.0,
        minimum_z_height=minimum_z_height)
    check_arc_basic(from_tall, tall_top, lw1.wells()[3].top())
    assert from_tall[0][0].z == tall_z

    no_well = tall_top._replace(labware=lw1)
    from_tall_lw = plan_moves(no_well, lw1.wells()[4].bottom(), deck,
                              P300M_GEN2_MAX_HEIGHT, 7.0, 15.0)
    check_arc_basic(from_tall_lw, no_well, lw1.wells()[4].bottom())


def test_direct_minimum_z_height():
    deck = Deck()
    lw1 = labware.load(labware_name, deck.position_for(1))
    from_loc = lw1.wells()[0].bottom().move(Point(x=-2))
    to_loc = lw1.wells()[0].bottom().move(Point(x=2))
    zmo = 150
    # This would normally be a direct move since it’s inside the same well,
    # but we want to check that we override it into an arc
    moves = plan_moves(from_loc, to_loc, deck, P300M_GEN2_MAX_HEIGHT,
                       minimum_z_height=zmo)
    assert len(moves) == 3
    assert moves[0][0].z == zmo  # equals zmo b/c 150 is max of all safe z's
    check_arc_basic(moves, from_loc, to_loc)


def test_direct_cp():
    deck = Deck()
    trough = labware.load(trough_name, deck.position_for(1))
    lw1 = labware.load(labware_name, deck.position_for(2))
    # when moving from no origin location to a centered labware we should
    # start in default cp
    from_nothing = plan_moves(Location(Point(50, 50, 50), None),
                              trough.wells()[0].top(),
                              deck, P300M_GEN2_MAX_HEIGHT)
    check_arc_basic(from_nothing, Location(Point(50, 50, 50), None),
                    trough.wells()[0].top())
    assert from_nothing[0][1] is None
    assert from_nothing[1][1] == CriticalPoint.XY_CENTER
    assert from_nothing[2][1] == CriticalPoint.XY_CENTER
    # when moving from an origin with a centered labware to a dest with a
    # centered labware we should stay in centered the entire time, whether
    # arc
    from_centered_arc = plan_moves(trough.wells()[0].top(),
                                   trough.wells()[1].top(),
                                   deck, P300M_GEN2_MAX_HEIGHT)
    check_arc_basic(from_centered_arc,
                    trough.wells()[0].top(), trough.wells()[1].top())
    assert from_centered_arc[0][1] == CriticalPoint.XY_CENTER
    assert from_centered_arc[1][1] == CriticalPoint.XY_CENTER
    assert from_centered_arc[2][1] == CriticalPoint.XY_CENTER
    # or direct
    from_centered_direct = plan_moves(trough.wells()[0].top(),
                                      trough.wells()[1].bottom(),
                                      deck, P300M_GEN2_MAX_HEIGHT)
    assert from_centered_direct[0][1] == CriticalPoint.XY_CENTER
    # when moving from centered to normal, only the first move should be
    # centered
    to_normal = plan_moves(trough.wells()[0].top(), lw1.wells()[0].top(), deck,
                           P300M_GEN2_MAX_HEIGHT)
    check_arc_basic(to_normal, trough.wells()[0].top(), lw1.wells()[0].top())
    assert to_normal[0][1] == CriticalPoint.XY_CENTER
    assert to_normal[1][1] is None
    assert to_normal[2][1] is None


def test_gen2_module_transforms():
    deck = Deck()
    tmod = module_geometry.load_module(
        module_geometry.TemperatureModuleModel.TEMPERATURE_V2,
        deck.position_for('1'),
        MAX_SUPPORTED_VERSION)
    assert tmod.labware_offset == Point(-1.45, -0.15, 80.09)
    tmod2 = module_geometry.load_module(
        module_geometry.TemperatureModuleModel.TEMPERATURE_V2,
        deck.position_for('3'),
        MAX_SUPPORTED_VERSION)
    assert tmod2.labware_offset == Point(1.15, -0.15, 80.09)

    mmod = module_geometry.load_module(
        module_geometry.MagneticModuleModel.MAGNETIC_V2,
        deck.position_for('1'),
        MAX_SUPPORTED_VERSION)
    assert mmod.labware_offset == Point(-1.175, -0.125, 82.25)
    mmod2 = module_geometry.load_module(
        module_geometry.MagneticModuleModel.MAGNETIC_V2,
        deck.position_for('3'),
        MAX_SUPPORTED_VERSION)
    assert mmod2.labware_offset == Point(1.425, -0.125, 82.25)


def test_instr_max_height():
    deck = Deck()
    trough = labware.load(trough_name, deck.position_for(1))
    trough2 = labware.load(trough_name, deck.position_for(2))
    deck[1] = trough
    deck[2] = trough2

    # if the highest deck height is between 1 mm and 10 mm below
    # the max instrument achievable height, we use the max instrument
    # height as the safe height
    instr_max_height = trough.wells()[0].top().point.z + 1
    height = safe_height(
        trough.wells()[0].top(), trough2.wells()[0].top(),
        deck, round(instr_max_height, 2), 7.0, 15.0)
    assert height == round(instr_max_height, 2)

    # if the highest deck height is > 10 mm below the max instrument
    # height, we use the lw_z_margin instead
    instr_max_height = trough.wells()[0].top().point.z + 30
    height2 = safe_height(
        trough.wells()[0].top(), trough2.wells()[0].top(),
        deck, round(instr_max_height, 2), 7.0, 15.0)
    assert height2 ==\
        round(trough.wells()[0].top().point.z, 2) + 15.0

    # it fails if the highest deck height is less than 1 mm below
    # the max instr achievable height
    instr_max_height = trough.wells()[0].top().point.z
    with pytest.raises(Exception):
        safe_height(
            trough.wells()[0].top(), trough2.wells()[0].top(),
            deck, round(instr_max_height, 2), 7.0, 15.0)


def test_first_parent():
    deck = Deck()
    trough = labware.load(trough_name, deck.position_for(1))
    assert first_parent(trough) == '1'
    assert first_parent(trough['A2']) == '1'
    assert first_parent(None) is None
    assert first_parent('6') == '6'
    mod = module_geometry.load_module(
        module_geometry.TemperatureModuleModel.TEMPERATURE_V2,
        deck.position_for('6'),
        MAX_SUPPORTED_VERSION)
    mod_trough = mod.add_labware(labware.load(trough_name, mod.location))
    assert first_parent(mod_trough['A5']) == '6'
    assert first_parent(mod_trough) == '6'
    assert first_parent(mod) == '6'

    mod_trough._parent = mod_trough
    with pytest.raises(RuntimeError):
        # make sure we catch cycles
        first_parent(mod_trough)


def test_should_dodge():
    deck = Deck()
    # with no tc loaded, doesn't matter what the positions are
    assert not should_dodge_thermocycler(
        deck, deck.position_for(4), deck.position_for(9))
    deck[7] = module_geometry.load_module(
        module_geometry.ThermocyclerModuleModel.THERMOCYCLER_V1,
        deck.position_for(7))
    # with a tc loaded, some positions should require dodging
    assert should_dodge_thermocycler(
        deck, deck.position_for(12), deck.position_for(1))
    # but ones that weren't explicitly marked shouldn't
    assert not should_dodge_thermocycler(
        deck, deck.position_for(1), deck.position_for(2))
    # including a situation where we might have some messed up locations
    # with no parent
    assert not should_dodge_thermocycler(
        deck,
        deck.position_for(1)._replace(labware=None),
        deck.position_for(12)
    )


def test_labware_in_next_slow():
    deck = Deck()
    trough = labware.load(trough_name, deck.position_for(4))
    trough2 = labware.load(trough_name, deck.position_for(1))
    trough3 = labware.load(trough_name, deck.position_for(3))
    deck[4] = trough
    deck[1] = trough2
    deck[3] = trough3
    assert deck.right_of('3') is None
    assert deck.left_of('2') is trough2
    assert deck.right_of('2') is trough3

    assert deck.right_of('9') is None
