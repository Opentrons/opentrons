""" Test the functions and classes in the protocol context """

import opentrons.protocol_api as papi
from opentrons.protocol_api.geometry import Deck
from opentrons.types import Mount
from opentrons.hardware_control import API
from opentrons.hardware_control.types import Axis
from opentrons.config.pipette_config import configs

import pytest


def test_slot_names():
    slots_by_int = list(range(1, 13))
    slots_by_str = [str(idx) for idx in slots_by_int]
    for method in (slots_by_int, slots_by_str):
        d = Deck()
        for idx, slot in enumerate(method):
            assert slot in d
            d[slot] = 'its real'
            with pytest.raises(ValueError):
                d[slot] = 'not this time boyo'
            del d[slot]
            assert slot in d
            assert d[slot] is None

    assert 'hasasdaia' not in d
    with pytest.raises(ValueError):
        d['ahgoasia'] = 'nope'


def test_load_instrument(loop):
    ctx = papi.ProtocolContext(loop=loop)
    for config in configs:
        loaded = ctx.load_instrument(config, Mount.LEFT)
        assert loaded.name == config
        prefix = config.split('_v')[0]
        loaded = ctx.load_instrument(prefix, Mount.RIGHT)
        assert loaded.name.startswith(prefix)


def test_motion(loop):
    hardware = API.build_hardware_simulator(loop=loop)
    ctx = papi.ProtocolContext(hardware, loop)
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)
    instr.home()
    instr.move_to((0, 0, 0))
    assert hardware.current_position(instr._mount) == {Axis.X: 0,
                                                       Axis.Y: 0,
                                                       Axis.A: 0,
                                                       Axis.C: 19}
