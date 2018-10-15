""" Test the functions and classes in the protocol context """

from opentrons import protocol_api as papi

import pytest


def test_slot_names():
    slots_by_int = list(range(1, 13))
    slots_by_str = [str(idx) for idx in slots_by_int]
    for method in (slots_by_int, slots_by_str):
        d = papi.Deck()
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
