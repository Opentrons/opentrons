from opentrons.protocol_api import back_compat  # , ProtocolContext
from opentrons.types import Mount


def test_add_instrument(loop, monkeypatch):
    requested_instr, requested_mount = None, None

    def fake_load(instr_name, mount):
        nonlocal requested_instr
        nonlocal requested_mount
        requested_instr = instr_name
        requested_mount = mount

    monkeypatch.setattr(back_compat.instruments._ctx,
                        'load_instrument', fake_load)

    back_compat.instruments.P1000_Single('left')
    assert requested_instr == 'p1000_single'
    assert requested_mount == Mount.LEFT
    back_compat.instruments.P10_Single('right')
    assert requested_instr == 'p10_single'
    assert requested_mount == Mount.RIGHT
    back_compat.instruments.P10_Multi('left')
    assert requested_instr == 'p10_multi'
    assert requested_mount == Mount.LEFT
    back_compat.instruments.P50_Single('right')
    assert requested_instr == 'p50_single'
    assert requested_mount == Mount.RIGHT
    back_compat.instruments.P50_Multi('left')
    assert requested_instr == 'p50_multi'
    assert requested_mount == Mount.LEFT
    back_compat.instruments.P300_Single('right')
    assert requested_instr == 'p300_single'
    assert requested_mount == Mount.RIGHT
    back_compat.instruments.P300_Multi('left')
    assert requested_instr == 'p300_multi'
    assert requested_mount == Mount.LEFT
    back_compat.instruments.P1000_Single('right')
    assert requested_instr == 'p1000_single'
    assert requested_mount == Mount.RIGHT
