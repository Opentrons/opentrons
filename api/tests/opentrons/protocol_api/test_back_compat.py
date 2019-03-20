import pytest

from opentrons.protocol_api import back_compat, ProtocolContext
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


def test_labware_mappings(loop, monkeypatch):
    lw_name, lw_label = None, None

    def fake_ctx_load(labware_name, location, label=None):
        nonlocal lw_name
        nonlocal lw_label
        lw_name = labware_name
        lw_label = label
        return 'heres a fake labware'

    ctx = ProtocolContext(loop)
    bc = back_compat.BCLabware(ctx)
    monkeypatch.setattr(ctx, 'load_labware_by_name', fake_ctx_load)
    obj = bc.load('384-plate', 2, 'hey there')
    assert obj == 'heres a fake labware'
    assert lw_name == 'corning_384_wellplate_112_ul'
    assert lw_label == 'hey there'

    with pytest.raises(NotImplementedError,
                       match='Labware 24-vial-plate is not supported'):
        bc.load('24-vial-plate', 2)

    with pytest.raises(NotImplementedError,
                       match='Module load not yet implemented'):
        bc.load('magdeck', 3)
