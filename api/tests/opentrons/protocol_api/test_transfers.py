""" Test the Transfer class and its functions """
import pytest
import opentrons.protocol_api as papi
from opentrons.types import Mount, TransferTipPolicy
from opentrons.protocol_api import transfers as tx


@pytest.fixture
def _instr_labware(loop):
    ctx = papi.ProtocolContext(loop)
    lw1 = ctx.load_labware_by_name('biorad_96_wellPlate_pcr_200_uL', 1)
    lw2 = ctx.load_labware_by_name('generic_96_wellPlate_380_uL', 2)
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_300_uL', 3)
    instr = ctx.load_instrument('p300_single', Mount.RIGHT,
                                tip_racks=[tiprack])

    return {'ctx': ctx, 'instr': instr, 'lw1': lw1, 'lw2': lw2,
            'tiprack': tiprack}


def test_default_transfers(_instr_labware):
    # Transfer 100ml from row1 of labware1 to row1 of labware2: first with
    #  new_tip = ONCE, then with new_tip = NEVER
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    lw2 = _instr_labware['lw2']

    # ========== Transfer ===========
    xfer_plan = tx.TransferPlan(100, lw1.columns()[0], lw2.columns()[0],
                                _instr_labware['instr'])
    xfer_plan_list = []
    for step in xfer_plan:
        xfer_plan_list.append(step)
    exp1 = [{'method': 'pick_up_tip', 'params': {}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][0], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][0], 1.0]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][1], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][1], 1.0]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][2], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][2], 1.0]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][3], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][3], 1.0]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][4], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][4], 1.0]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][5], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][5], 1.0]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][6], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][6], 1.0]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][7], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][7], 1.0]},
            {'method': 'drop_tip', 'params': []}]
    assert xfer_plan_list == exp1

    # ========== Distribute ===========
    dist_plan = tx.TransferPlan(50, lw1.columns()[0][0], lw2.columns()[0],
                                _instr_labware['instr'])
    dist_plan_list = []
    for step in dist_plan:
        dist_plan_list.append(step)
    exp2 = [{'method': 'pick_up_tip', 'params': {}},
            {'method': 'aspirate', 'params': [250, lw1.columns()[0][0], 1.0]},
            {'method': 'dispense', 'params': [50, lw2.columns()[0][0], 1.0]},
            {'method': 'dispense', 'params': [50, lw2.columns()[0][1], 1.0]},
            {'method': 'dispense', 'params': [50, lw2.columns()[0][2], 1.0]},
            {'method': 'dispense', 'params': [50, lw2.columns()[0][3], 1.0]},
            {'method': 'dispense', 'params': [50, lw2.columns()[0][4], 1.0]},
            {'method': 'aspirate', 'params': [150, lw1.columns()[0][0], 1.0]},
            {'method': 'dispense', 'params': [50, lw2.columns()[0][5], 1.0]},
            {'method': 'dispense', 'params': [50, lw2.columns()[0][6], 1.0]},
            {'method': 'dispense', 'params': [50, lw2.columns()[0][7], 1.0]},
            {'method': 'drop_tip', 'params': []}]
    assert dist_plan_list == exp2

    # ========== Consolidate ===========
    consd_plan = tx.TransferPlan(50, lw1.columns()[0], lw2.columns()[0][0],
                                 _instr_labware['instr'])
    consd_plan_list = []
    for step in consd_plan:
        consd_plan_list.append(step)
    exp3 = [{'method': 'pick_up_tip', 'params': {}},
            {'method': 'aspirate', 'params': [50, lw1.columns()[0][0], 1.0]},
            {'method': 'aspirate', 'params': [50, lw1.columns()[0][1], 1.0]},
            {'method': 'aspirate', 'params': [50, lw1.columns()[0][2], 1.0]},
            {'method': 'aspirate', 'params': [50, lw1.columns()[0][3], 1.0]},
            {'method': 'aspirate', 'params': [50, lw1.columns()[0][4], 1.0]},
            {'method': 'dispense', 'params': [250, lw2.columns()[0][0], 1.0]},
            {'method': 'aspirate', 'params': [50, lw1.columns()[0][5], 1.0]},
            {'method': 'aspirate', 'params': [50, lw1.columns()[0][6], 1.0]},
            {'method': 'aspirate', 'params': [50, lw1.columns()[0][7], 1.0]},
            {'method': 'dispense', 'params': [150, lw2.columns()[0][0], 1.0]},
            {'method': 'drop_tip', 'params': []}]
    assert consd_plan_list == exp3


def test_no_new_tip(_instr_labware):
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    lw2 = _instr_labware['lw2']

    options = tx.TransferOptions()
    options = options._replace(
        transfer=options.transfer._replace(
            new_tip=TransferTipPolicy.NEVER))
    # ========== Transfer ==========
    xfer_plan = tx.TransferPlan(100, lw1.columns()[0], lw2.columns()[0],
                                _instr_labware['instr'], options=options)
    for step in xfer_plan:
        assert step['method'] != 'pick_up_tip'
        assert step['method'] != 'drop_tip'

    # ========== Distribute ===========
    dist_plan = tx.TransferPlan(30, lw1.columns()[0][0], lw2.columns()[0],
                                _instr_labware['instr'], options=options)
    for step in dist_plan:
        assert step['method'] != 'pick_up_tip'
        assert step['method'] != 'drop_tip'

    # ========== Consolidate ===========
    consd_plan = tx.TransferPlan(40, lw1.columns()[0], lw2.rows()[0][1],
                                 _instr_labware['instr'], options=options)
    for step in consd_plan:
        assert step['method'] != 'pick_up_tip'
        assert step['method'] != 'drop_tip'


def test_new_tip_always(_instr_labware, monkeypatch):
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    lw2 = _instr_labware['lw2']
    tiprack = _instr_labware['tiprack']
    i_ctx = _instr_labware['instr']

    options = tx.TransferOptions()
    options = options._replace(
        transfer=options.transfer._replace(
            new_tip=TransferTipPolicy.ALWAYS,
            drop_tip_strategy=tx.DropTipStrategy.RETURN))

    xfer_plan = tx.TransferPlan(100,
                                lw1.columns()[0][1:5], lw2.columns()[0][1:5],
                                _instr_labware['instr'], options=options)
    xfer_plan_list = []
    for step in xfer_plan:
        xfer_plan_list.append(step)
    exp1 = [{'method': 'pick_up_tip', 'params': {}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][1], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][1], 1.0]},
            {'method': 'return_tip', 'params': []},
            {'method': 'pick_up_tip', 'params': {}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][2], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][2], 1.0]},
            {'method': 'return_tip', 'params': []},
            {'method': 'pick_up_tip', 'params': {}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][3], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][3], 1.0]},
            {'method': 'return_tip', 'params': []},
            {'method': 'pick_up_tip', 'params': {}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][4], 1.0]},
            {'method': 'dispense', 'params': [100, lw2.columns()[0][4], 1.0]},
            {'method': 'return_tip', 'params': []}]
    assert xfer_plan_list == exp1
    for cmd in xfer_plan_list:
        if isinstance(cmd['params'], dict):
            getattr(i_ctx, cmd['method'])(**cmd['params'])
        else:
            getattr(i_ctx, cmd['method'])(*cmd['params'])
    assert tiprack.next_tip() == tiprack.columns()[0][4]


def test_transfer_w_airgap_blowout(_instr_labware):
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    lw2 = _instr_labware['lw2']

    options = tx.TransferOptions()
    options = options._replace(
        transfer=options.transfer._replace(
            air_gap=10, blow_out_strategy=tx.BlowOutStrategy.DEST_IF_EMPTY,
            new_tip=TransferTipPolicy.NEVER))

    # ========== Transfer ==========
    xfer_plan = tx.TransferPlan(100, lw1.columns()[0][1:5], lw2.rows()[0][1:5],
                                _instr_labware['instr'], options=options)
    xfer_plan_list = []
    for step in xfer_plan:
        xfer_plan_list.append(step)
    exp1 = [{'method': 'aspirate', 'params': [100, lw1.columns()[0][1], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][1], 1.0]},
            {'method': 'blow_out', 'params': [lw2.rows()[0][1]]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][2], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][2], 1.0]},
            {'method': 'blow_out', 'params': [lw2.rows()[0][2]]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][3], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][3], 1.0]},
            {'method': 'blow_out', 'params': [lw2.rows()[0][3]]},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][4], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][4], 1.0]},
            {'method': 'blow_out', 'params': [lw2.rows()[0][4]]}]
    assert xfer_plan_list == exp1

    # ========== Distribute ==========
    dist_plan = tx.TransferPlan(60, lw1.columns()[1][0], lw2.rows()[1][1:6],
                                _instr_labware['instr'], options=options)
    dist_plan_list = []
    for step in dist_plan:
        dist_plan_list.append(step)
    exp2 = [{'method': 'aspirate', 'params': [240, lw1.columns()[1][0], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][1], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][2], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][3], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][4], 1.0]},
            {'method': 'blow_out', 'params': [lw2.rows()[1][4]]},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][0], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][5], 1.0]},
            {'method': 'blow_out', 'params': [lw2.rows()[1][5]]}]
    assert dist_plan_list == exp2

    # ========== Consolidate ==========
    consd_plan = tx.TransferPlan(60, lw1.columns()[1], lw2.rows()[1][1],
                                 _instr_labware['instr'], options=options)
    consd_plan_list = []
    for step in consd_plan:
        consd_plan_list.append(step)
    exp3 = [{'method': 'aspirate', 'params': [60, lw1.columns()[1][0], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][1], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][2], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][3], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [270, lw2.rows()[1][1], 1.0]},
            {'method': 'blow_out', 'params': [lw2.rows()[1][1]]},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][4], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][5], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][6], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][7], 1.0]},
            {'method': 'air_gap', 'params': [10]},
            {'method': 'dispense', 'params': [10]},
            {'method': 'dispense', 'params': [270, lw2.rows()[1][1], 1.0]},
            {'method': 'blow_out', 'params': [lw2.rows()[1][1]]}]
    assert consd_plan_list == exp3


def test_touchtip_mix(_instr_labware):
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    lw2 = _instr_labware['lw2']

    options = tx.TransferOptions()
    options = options._replace(
        transfer=options.transfer._replace(
            new_tip=TransferTipPolicy.NEVER,
            touch_tip_strategy=tx.TouchTipStrategy.ALWAYS,
            mix_strategy=tx.MixStrategy.AFTER))

    # ========== Transfer ==========
    xfer_plan = tx.TransferPlan(100, lw1.columns()[0][1:5], lw2.rows()[0][1:5],
                                _instr_labware['instr'], options=options)
    xfer_plan_list = []
    for step in xfer_plan:
        xfer_plan_list.append(step)
    exp1 = [{'method': 'aspirate', 'params': [100, lw1.columns()[0][1], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][1], 1.0]},
            {'method': 'mix', 'params': {}},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][2], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][2], 1.0]},
            {'method': 'mix', 'params': {}},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][3], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][3], 1.0]},
            {'method': 'mix', 'params': {}},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][4], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][4], 1.0]},
            {'method': 'mix', 'params': {}},
            {'method': 'touch_tip', 'params': {}}]
    assert xfer_plan_list == exp1

    # ========== Distribute ==========
    dist_plan = tx.TransferPlan(60, lw1.columns()[1][0], lw2.rows()[1][1:6],
                                _instr_labware['instr'], options=options)
    dist_plan_list = []
    for step in dist_plan:
        dist_plan_list.append(step)
    exp2 = [{'method': 'aspirate', 'params': [240, lw1.columns()[1][0], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][1], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][2], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][3], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][4], 1.0]},
            {'method': 'mix', 'params': {}},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][0], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [60, lw2.rows()[1][5], 1.0]},
            {'method': 'mix', 'params': {}},
            {'method': 'touch_tip', 'params': {}}]

    assert dist_plan_list == exp2

    # ========== Consolidate ==========
    consd_plan = tx.TransferPlan(60, lw1.columns()[1], lw2.rows()[1][1],
                                 _instr_labware['instr'], options=options)
    consd_plan_list = []
    for step in consd_plan:
        consd_plan_list.append(step)
    exp3 = [{'method': 'aspirate', 'params': [60, lw1.columns()[1][0], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][1], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][2], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][3], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [240, lw2.rows()[1][1], 1.0]},
            {'method': 'mix', 'params': {}},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][4], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][5], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][6], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'aspirate', 'params': [60, lw1.columns()[1][7], 1.0]},
            {'method': 'touch_tip', 'params': {}},
            {'method': 'dispense', 'params': [240, lw2.rows()[1][1], 1.0]},
            {'method': 'mix', 'params': {}},
            {'method': 'touch_tip', 'params': {}}]
    assert consd_plan_list == exp3


def test_all_options(_instr_labware):
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    lw2 = _instr_labware['lw2']

    options = tx.TransferOptions()
    options = options._replace(
        transfer=options.transfer._replace(
            new_tip=TransferTipPolicy.ONCE,
            drop_tip_strategy=tx.DropTipStrategy.RETURN,
            touch_tip_strategy=tx.TouchTipStrategy.ALWAYS,
            mix_strategy=tx.MixStrategy.AFTER),
        pick_up_tip=options.pick_up_tip._replace(
            presses=4,
            increment=2),
        touch_tip=options.touch_tip._replace(
            speed=1.6),
        mix=options.mix._replace(
            mix_after=options.mix.mix_after._replace(
                repetitions=2)),
        blow_out=options.blow_out._replace(
            location=lw2.columns()[10][0]),
        aspirate=options.aspirate._replace(
            rate=1.5))

    xfer_plan = tx.TransferPlan(100, lw1.columns()[0][1:4], lw2.rows()[0][1:4],
                                _instr_labware['instr'], options=options)
    xfer_plan_list = []
    for step in xfer_plan:
        xfer_plan_list.append(step)
    exp1 = [{'method': 'pick_up_tip', 'params': {
                                      'presses': 4, 'increment': 2}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][1], 1.5]},
            {'method': 'touch_tip', 'params': {'speed': 1.6}},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][1], 1.0]},
            {'method': 'mix', 'params': {'repetitions': 2}},
            {'method': 'touch_tip', 'params': {'speed': 1.6}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][2], 1.5]},
            {'method': 'touch_tip', 'params': {'speed': 1.6}},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][2], 1.0]},
            {'method': 'mix', 'params': {'repetitions': 2}},
            {'method': 'touch_tip', 'params': {'speed': 1.6}},
            {'method': 'aspirate', 'params': [100, lw1.columns()[0][3], 1.5]},
            {'method': 'touch_tip', 'params': {'speed': 1.6}},
            {'method': 'dispense', 'params': [100, lw2.rows()[0][3], 1.0]},
            {'method': 'mix', 'params': {'repetitions': 2}},
            {'method': 'touch_tip', 'params': {'speed': 1.6}},
            {'method': 'return_tip', 'params': []}]
    assert xfer_plan_list == exp1
