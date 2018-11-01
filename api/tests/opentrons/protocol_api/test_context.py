""" Test the functions and classes in the protocol context """

import json
import pkgutil

import opentrons.protocol_api as papi
from opentrons.types import Mount, Point, Location
from opentrons.hardware_control import API
from opentrons.hardware_control.types import Axis
from opentrons.config.pipette_config import configs

import pytest


# TODO: Remove once load_labware_by_name is implemented
labware_name = 'generic_96_wellPlate_380_uL'
labware_def = json.loads(
    pkgutil.get_data('opentrons',
                     'shared_data/definitions2/{}.json'.format(labware_name)))


@pytest.fixture
def load_my_labware(monkeypatch):
    def dummy_load(labware):
        return labware_def
    monkeypatch.setattr(papi.labware, '_load_definition_by_name', dummy_load)


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
    assert instr.move_to(Location(Point(0, 0, 0), None)) is instr
    assert hardware.current_position(instr._mount) == {Axis.X: 0,
                                                       Axis.Y: 0,
                                                       Axis.A: 0,
                                                       Axis.C: 19}


def test_location_cache(loop, monkeypatch, load_my_labware):
    hardware = API.build_hardware_simulator(loop=loop)
    ctx = papi.ProtocolContext(loop)
    ctx.connect(hardware)
    right = ctx.load_instrument('p10_single', Mount.RIGHT)
    lw = ctx.load_labware_by_name('generic_96_wellPlate_380_uL', 1)
    ctx.home()

    test_args = None

    def fake_plan_move(from_loc, to_loc, deck,
                       well_z_margin=None,
                       lw_z_margin=None):
        nonlocal test_args
        test_args = (from_loc, to_loc, deck, well_z_margin, lw_z_margin)
        return [Point(0, 1, 10), Point(1, 2, 10), Point(1, 2, 3)]

    monkeypatch.setattr(papi.geometry, 'plan_moves', fake_plan_move)
    # When we move without a cache, the from location should be the gantry
    # position
    right.move_to(lw.wells()[0].top())
    # The home position from hardware_control/simulator.py, taking into account
    # that the right pipette is a p10 single which is a different height than
    # the reference p300 single
    assert test_args[0].point == Point(418, 353, 205)
    assert test_args[0].labware is None

    # kOnce we have a location cache, that should be our from_loc
    right.move_to(lw.wells()[1].top())
    assert test_args[0].labware == lw.wells()[0]


def test_move_uses_arc(loop, monkeypatch, load_my_labware):
    hardware = API.build_hardware_simulator(loop=loop)
    ctx = papi.ProtocolContext(loop)
    ctx.connect(hardware)
    ctx.home()
    right = ctx.load_instrument('p10_single', Mount.RIGHT)
    lw = ctx.load_labware_by_name('generic_96_wellPlate_380_uL', 1)
    ctx.home()

    targets = []

    async def fake_move(mount, target_pos):
        nonlocal targets
        targets.append((mount, target_pos))
    monkeypatch.setattr(hardware, 'move_to', fake_move)

    right.move_to(lw.wells()[0].top())
    assert len(targets) == 3
    assert targets[-1][0] == Mount.RIGHT
    assert targets[-1][1] == lw.wells()[0].top().point


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
    ctx.home()
    lw = ctx.load_labware_by_name('generic_96_wellPlate_380_uL', 1)
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)

    asp_called_with = None

    async def fake_hw_aspirate(mount, volume=None, rate=1.0):
        nonlocal asp_called_with
        asp_called_with = (mount, volume, rate)

    move_called_with = None

    def fake_move(mount, loc):
        nonlocal move_called_with
        move_called_with = (mount, loc)

    monkeypatch.setattr(ctx._hardware._api, 'aspirate', fake_hw_aspirate)
    monkeypatch.setattr(ctx._hardware._api, 'move_to', fake_move)

    instr.aspirate(2.0, lw.wells()[0].bottom())

    assert asp_called_with == (Mount.RIGHT, 2.0, 1.0)
    assert move_called_with == (Mount.RIGHT, lw.wells()[0].bottom().point)

    instr.well_bottom_clearance = 1.0
    instr.aspirate(2.0, lw.wells()[0])
    dest_point, dest_lw = lw.wells()[0].bottom()
    dest_point = dest_point._replace(z=dest_point.z + 1.0)
    assert move_called_with == (Mount.RIGHT, dest_point)

    move_called_with = None
    instr.aspirate(2.0)
    assert move_called_with is None


def test_dispense(loop, load_my_labware, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    lw = ctx.load_labware_by_name('generic_96_wellPlate_380_uL', 1)
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)

    disp_called_with = None

    async def fake_hw_dispense(mount, volume=None, rate=1.0):
        nonlocal disp_called_with
        disp_called_with = (mount, volume, rate)

    move_called_with = None

    def fake_move(mount, loc):
        nonlocal move_called_with
        move_called_with = (mount, loc)

    monkeypatch.setattr(ctx._hardware._api, 'dispense', fake_hw_dispense)
    monkeypatch.setattr(ctx._hardware._api, 'move_to', fake_move)

    instr.dispense(2.0, lw.wells()[0].bottom())

    assert disp_called_with == (Mount.RIGHT, 2.0, 1.0)
    assert move_called_with == (Mount.RIGHT, lw.wells()[0].bottom().point)

    instr.well_bottom_clearance = 1.0
    instr.dispense(2.0, lw.wells()[0])
    dest_point, dest_lw = lw.wells()[0].bottom()
    dest_point = dest_point._replace(z=dest_point.z + 1.0)
    assert move_called_with == (Mount.RIGHT, dest_point)

    move_called_with = None
    instr.dispense(2.0)
    assert move_called_with is None
