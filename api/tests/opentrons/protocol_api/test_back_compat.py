import pytest

from opentrons.protocol_api import back_compat, ProtocolContext
from opentrons.types import Mount


@pytest.mark.api2_only
def test_add_instrument(loop, monkeypatch, singletons):
    requested_instr, requested_mount = None, None

    def fake_load(instr_name, mount):
        nonlocal requested_instr
        nonlocal requested_mount
        requested_instr = instr_name
        requested_mount = mount

    instruments = singletons['instruments']
    monkeypatch.setattr(instruments._ctx,
                        'load_instrument', fake_load)

    instruments.P1000_Single('left')
    assert requested_instr == 'p1000_single'
    assert requested_mount == Mount.LEFT
    instruments.P10_Single('right')
    assert requested_instr == 'p10_single'
    assert requested_mount == Mount.RIGHT
    instruments.P10_Multi('left')
    assert requested_instr == 'p10_multi'
    assert requested_mount == Mount.LEFT
    instruments.P50_Single('right')
    assert requested_instr == 'p50_single'
    assert requested_mount == Mount.RIGHT
    instruments.P50_Multi('left')
    assert requested_instr == 'p50_multi'
    assert requested_mount == Mount.LEFT
    instruments.P300_Single('right')
    assert requested_instr == 'p300_single'
    assert requested_mount == Mount.RIGHT
    instruments.P300_Multi('left')
    assert requested_instr == 'p300_multi'
    assert requested_mount == Mount.LEFT
    instruments.P1000_Single('right')
    assert requested_instr == 'p1000_single'
    assert requested_mount == Mount.RIGHT


@pytest.mark.api2_only
def test_labware_mappings(loop, monkeypatch, singletons):
    lw_name, lw_label = None, None

    def fake_ctx_load(labware_name, location, label=None):
        nonlocal lw_name
        nonlocal lw_label
        lw_name = labware_name
        lw_label = label
        return 'heres a fake labware'

    labware = singletons['labware']
    monkeypatch.setattr(labware._ctx, 'load_labware', fake_ctx_load)
    obj = labware.load('384-plate', 2, 'hey there')
    assert obj == 'heres a fake labware'
    assert lw_name == 'corning_384_wellplate_112ul_flat'
    assert lw_label == 'hey there'

    with pytest.raises(NotImplementedError,
                       match='Labware 24-vial-rack is not supported'):
        labware.load('24-vial-rack', 2)

    with pytest.raises(NotImplementedError,
                       match='Module load not yet implemented'):
        labware.load('magdeck', 3)
