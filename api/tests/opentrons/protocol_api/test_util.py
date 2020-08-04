import pytest

import opentrons.protocol_api as papi
from opentrons.types import Point, Location, Mount
from opentrons.protocols.types import APIVersion
from opentrons.protocol_api.labware import Labware, get_labware_definition
from opentrons.protocol_api.geometry import Deck
from opentrons.protocol_api.util import (
    HardwareManager, AxisMaxSpeeds, build_edges, _find_value_for_api_version)
from opentrons.hardware_control import API, adapters, types, ThreadManager


async def test_hw_manager(loop):
    # When built without an input it should build its own adapter
    mgr = HardwareManager(None)
    adapter = mgr.hardware
    # When "disconnecting" from its own simulator, the adapter should
    # be stopped and a new one created
    new = mgr.reset_hw()
    assert new is not adapter
    # When deleted, the self-created adapter should be stopped
    del mgr

    # When built with a hardware API input it should wrap it with a new
    # synchronous adapter and not build its own API
    sim = await API.build_hardware_simulator(loop=loop)
    mgr = HardwareManager(sim)
    assert isinstance(mgr.hardware, adapters.SynchronousAdapter)
    passed = mgr.hardware
    # When disconnecting from a real external adapter, it should create
    # its own simulator and should
    new = mgr.reset_hw()
    assert new is not passed

    thread_manager = ThreadManager(API.build_hardware_simulator)
    sa = thread_manager.sync
    # When connecting to an adapter it shouldn’t rewrap it
    assert mgr.set_hw(sa) is sa
    del mgr
    thread_manager.clean_up()


def test_max_speeds_userdict():
    defaults = AxisMaxSpeeds()
    assert defaults.data == {}
    assert dict(defaults) == {}

    with pytest.raises(KeyError):
        defaults['asdas'] = 2

    with pytest.raises(AssertionError):
        defaults['x'] = -1

    with pytest.raises(AssertionError):
        defaults['y'] = 'ggg'

    with pytest.raises(KeyError):
        defaults['b'] = 2

    with pytest.raises(KeyError):
        defaults['c'] = 3

    defaults['x'] = 2
    defaults[types.Axis.A] = 20

    assert defaults['X'] == 2
    assert defaults['x'] == 2
    assert defaults[types.Axis.X] == 2

    assert defaults['A'] == 20
    assert defaults['a'] == 20
    assert defaults[types.Axis.A] == 20

    assert sorted(list(defaults.keys()))\
        == sorted(['X', 'A'])
    assert 'X' in defaults.keys()

    del defaults['A']
    assert 'A' not in defaults

    defaults['x'] = None
    assert 'x' not in defaults


def test_build_edges():
    lw_def = get_labware_definition('corning_96_wellplate_360ul_flat')
    test_lw = Labware(lw_def, Location(Point(0, 0, 0), None))
    off = Point(0, 0, 1.0)
    deck = Deck()
    old_correct_edges = [
        test_lw['A1']._from_center_cartesian(x=1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=-1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=1.0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=-1.0, z=1) + off,
    ]
    res = build_edges(test_lw['A1'], 1.0, APIVersion(2, 2), Mount.RIGHT, deck)
    assert res == old_correct_edges

    new_correct_edges = [
        test_lw['A1']._from_center_cartesian(x=1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=-1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=1.0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=-1.0, z=1) + off,
    ]
    res2 = build_edges(test_lw['A1'], 1.0, APIVersion(2, 4), Mount.RIGHT, deck)
    assert res2 == new_correct_edges


def test_build_edges_left_pipette(loop):
    ctx = papi.ProtocolContext(loop)
    test_lw = ctx.load_labware('corning_96_wellplate_360ul_flat', '2')
    test_lw2 = ctx.load_labware('corning_96_wellplate_360ul_flat', '6')
    mod = ctx.load_module('magnetic module', '3')
    mod.load_labware('corning_96_wellplate_360ul_flat')
    off = Point(0, 0, 1.0)
    left_pip_edges = [
        test_lw['A12']._from_center_cartesian(x=-1.0, y=0, z=1) + off,
        test_lw['A12']._from_center_cartesian(x=0, y=0, z=1) + off,
        test_lw['A12']._from_center_cartesian(x=0, y=1.0, z=1) + off,
        test_lw['A12']._from_center_cartesian(x=0, y=-1.0, z=1) + off,
    ]
    # Test that module in slot 3 results in modified edge list
    res = build_edges(
        test_lw['A12'], 1.0, APIVersion(2, 4), Mount.LEFT, ctx._deck_layout)
    assert res == left_pip_edges

    left_pip_edges = [
        test_lw2['A12']._from_center_cartesian(x=-1.0, y=0, z=1) + off,
        test_lw2['A12']._from_center_cartesian(x=0, y=0, z=1) + off,
        test_lw2['A12']._from_center_cartesian(x=0, y=1.0, z=1) + off,
        test_lw2['A12']._from_center_cartesian(x=0, y=-1.0, z=1) + off,
    ]
    # Test that labware in slot 6 results in modified edge list
    res2 = build_edges(
        test_lw2['A12'], 1.0, APIVersion(2, 4), Mount.LEFT, ctx._deck_layout)
    assert res2 == left_pip_edges


def test_build_edges_right_pipette(loop):
    ctx = papi.ProtocolContext(loop)
    test_lw = ctx.load_labware('corning_96_wellplate_360ul_flat', '2')
    test_lw2 = ctx.load_labware('corning_96_wellplate_360ul_flat', '6')
    mod = ctx.load_module('magnetic module', '1')
    mod.load_labware('corning_96_wellplate_360ul_flat')
    off = Point(0, 0, 1.0)
    right_pip_edges = [
        test_lw['A1']._from_center_cartesian(x=1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=1.0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=-1.0, z=1) + off,
    ]
    # Test that module in slot 1 results in modified edge list
    res = build_edges(
        test_lw['A1'], 1.0, APIVersion(2, 4), Mount.RIGHT, ctx._deck_layout)
    assert res == right_pip_edges

    right_pip_edges = [
        test_lw2['A12']._from_center_cartesian(x=1.0, y=0, z=1) + off,
        test_lw2['A12']._from_center_cartesian(x=-1.0, y=0, z=1) + off,
        test_lw2['A12']._from_center_cartesian(x=0, y=0, z=1) + off,
        test_lw2['A12']._from_center_cartesian(x=0, y=1.0, z=1) + off,
        test_lw2['A12']._from_center_cartesian(x=0, y=-1.0, z=1) + off,
    ]
    # Test that labware in slot 6 results in unmodified edge list
    res2 = build_edges(
        test_lw2['A12'], 1.0, APIVersion(2, 4), Mount.RIGHT, ctx._deck_layout)
    assert res2 == right_pip_edges


@pytest.mark.parametrize('data,level,desired', [
    ({'2.0': 5}, APIVersion(2, 0), 5),
    ({'2.0': 5}, APIVersion(2, 5), 5),
    ({'2.6': 4, '2.0': 5}, APIVersion(2, 1), 5),
    ({'2.6': 4, '2.0': 5}, APIVersion(2, 6), 4),
    ({'2.0': 5, '2.6': 4}, APIVersion(2, 3), 5),
    ({'2.0': 5, '2.6': 4}, APIVersion(2, 6), 4)
])
def test_find_value_for_api_version(data, level, desired):
    assert _find_value_for_api_version(level, data) == desired
