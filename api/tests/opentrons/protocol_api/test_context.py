""" Test the functions and classes in the protocol context """

import json
import pkgutil

import opentrons.protocol_api as papi
from opentrons.protocol_api.geometry import Deck
from opentrons.protocol_api.labware import load
from opentrons.types import MotionStrategy, Mount, Point
from opentrons.hardware_control import API
from opentrons.hardware_control.types import Axis
from opentrons.config.pipette_config import configs

import pytest


labware_name = 'generic_96_wellPlate_380_uL'
labware_def = json.loads(
    pkgutil.get_data('opentrons',
                     'shared_data/definitions2/{}.json'.format(labware_name)))


@pytest.fixture
def load_my_labware(monkeypatch):
    def dummy_load(labware):
        return labware_def
    monkeypatch.setattr(papi.labware, '_load_definition_by_name', dummy_load)


def test_slot_names(load_my_labware):
    slots_by_int = list(range(1, 13))
    slots_by_str = [str(idx) for idx in slots_by_int]
    for method in (slots_by_int, slots_by_str):
        d = Deck()
        for idx, slot in enumerate(method):
            lw = load(labware_name, d.position_for(slot), str(slot))
            assert slot in d
            d[slot] = lw
            with pytest.raises(ValueError):
                d[slot] = 'not this time boyo'
            del d[slot]
            assert slot in d
            assert d[slot] is None

    assert 'hasasdaia' not in d
    with pytest.raises(ValueError):
        d['ahgoasia'] = 'nope'


def test_highest_z(load_my_labware):
    deck = Deck()
    assert deck.highest_z == 0
    lw = load(labware_name, deck.position_for(1), '1')
    deck[1] = lw
    assert deck.highest_z == lw.wells()[0].top().z
    del deck[1]
    assert deck.highest_z == 0


def test_load_instrument(loop):
    ctx = papi.ProtocolContext(loop=loop)
    for config in configs:
        loaded = ctx.load_instrument(config, Mount.LEFT, replace=True)
        assert loaded.name == config
        prefix = config.split('_v')[0]
        loaded = ctx.load_instrument(prefix, Mount.RIGHT, replace=True)
        assert loaded.name.startswith(prefix)


def test_motion(loop):
    hardware = API.build_hardware_simulator(loop=loop)
    ctx = papi.ProtocolContext(loop)
    ctx.connect(hardware)
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)
    instr.home()
    assert instr.move_to((0, 0, 0)) is instr
    assert hardware.current_position(instr._mount) == {Axis.X: 0,
                                                       Axis.Y: 0,
                                                       Axis.A: 0,
                                                       Axis.C: 19}


def test_location_parsing(loop, load_my_labware):
    ctx = papi.ProtocolContext(loop)
    lw = ctx.load_labware_by_name('generic_96_wellPlate_380_uL', '1')
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)
    w0 = lw.wells()[0]
    assert instr._get_point_and_cache(w0, 'top') == w0.top()
    assert instr._last_location is w0
    assert instr._get_point_and_cache(w0, 'bottom') == w0.bottom()
    assert instr._last_location is w0
    assert instr._get_point_and_cache(w0, 'center') == w0.center()
    assert instr._last_location is w0
    assert instr._get_point_and_cache(w0.bottom(), 'top') == w0.bottom()
    assert instr._last_location is None
    assert instr._get_point_and_cache(lw, 'top') == lw.wells()[0].top()
    assert instr._last_location == lw.wells()[0]
    assert instr._get_point_and_cache(None, 'top') == w0.top()
    assert instr._last_location == lw.wells()[0]
    assert instr._get_point_and_cache((0, 1, 2), 'bottom') == Point(0, 1, 2)
    with pytest.raises(RuntimeError):
        instr._get_point_and_cache(None, 'top')
    with pytest.raises(TypeError):
        instr._get_point_and_cache(2, 'bottom')


def test_pipette_info(loop):
    ctx = papi.ProtocolContext(loop)
    right = ctx.load_instrument('p300_multi', Mount.RIGHT)
    left = ctx.load_instrument('p1000_single', Mount.LEFT)
    assert right.type == 'multi'
    assert right.name\
        == ctx._hardware.attached_instruments[Mount.RIGHT]['name']
    assert left.type == 'single'
    assert left.name == ctx._hardware.attached_instruments[Mount.LEFT]['name']


def test_aspirate(loop, load_my_labware, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    lw = ctx.load_labware_by_name('generic_96_wellPlate_380_uL', 1)
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)

    asp_called_with = None

    async def fake_hw_aspirate(mount, volume=None, rate=1.0):
        nonlocal asp_called_with
        asp_called_with = (mount, volume, rate)

    move_called_with = None

    def fake_move(mount, loc, strat):
        nonlocal move_called_with
        move_called_with = (mount, loc, strat)

    monkeypatch.setattr(ctx._hardware._api, 'aspirate', fake_hw_aspirate)
    monkeypatch.setattr(ctx, 'move_to', fake_move)

    instr.aspirate(2.0, lw)

    assert asp_called_with == (Mount.RIGHT, 2.0, 1.0)
    assert move_called_with == (Mount.RIGHT, lw.wells()[0].bottom(),
                                MotionStrategy.ARC)


def test_dispense(loop, load_my_labware, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    lw = ctx.load_labware_by_name('generic_96_wellPlate_380_uL', 1)
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)

    disp_called_with = None

    async def fake_hw_dispense(mount, volume=None, rate=1.0):
        nonlocal disp_called_with
        disp_called_with = (mount, volume, rate)

    move_called_with = None

    def fake_move(mount, loc, strat):
        nonlocal move_called_with
        move_called_with = (mount, loc, strat)

    monkeypatch.setattr(ctx._hardware._api, 'dispense', fake_hw_dispense)
    monkeypatch.setattr(ctx, 'move_to', fake_move)

    instr.dispense(2.0, lw)

    assert disp_called_with == (Mount.RIGHT, 2.0, 1.0)
    assert move_called_with == (Mount.RIGHT, lw.wells()[0].bottom(),
                                MotionStrategy.ARC)
