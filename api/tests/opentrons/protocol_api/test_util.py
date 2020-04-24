import pytest

from opentrons.types import Point, Location
from opentrons.protocols.types import APIVersion
from opentrons.protocol_api.labware import Labware, get_labware_definition
from opentrons.protocol_api.util import (
    HardwareManager, AxisMaxSpeeds, build_edges)
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
    old_correct_edges = [
        test_lw['A1']._from_center_cartesian(x=1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=-1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=1.0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=-1.0, z=1) + off,
    ]
    res = build_edges(test_lw['A1'], 1.0, APIVersion(2, 2))
    assert res == old_correct_edges

    new_correct_edges = [
        test_lw['A1']._from_center_cartesian(x=1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=-1.0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=1.0, z=1) + off,
        test_lw['A1']._from_center_cartesian(x=0, y=-1.0, z=1) + off,
    ]
    res2 = build_edges(test_lw['A1'], 1.0, APIVersion(2, 4))
    assert res2 == new_correct_edges
