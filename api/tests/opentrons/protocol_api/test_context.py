""" Test the functions and classes in the protocol context """

import json
import pkgutil
from unittest import mock

import opentrons.protocol_api as papi
from opentrons.types import Mount, Point, Location, TransferTipPolicy
from opentrons.hardware_control import API, adapters
from opentrons.hardware_control.pipette import Pipette
from opentrons.hardware_control.types import Axis
from opentrons.config.pipette_config import config_models
from opentrons.protocol_api import transfers as tf

import pytest


@pytest.fixture
def get_labware_def(monkeypatch):
    def dummy_load(labware_name, namespace=None, version=None):
        # TODO: Ian 2019-05-30 use fixtures not real defs
        labware_def = json.loads(
            pkgutil.get_data(
                'opentrons',
                f'shared_data/labware/definitions/2/{labware_name}/1.json'))
        return labware_def
    monkeypatch.setattr(papi.labware, 'get_labware_definition', dummy_load)


def test_load_instrument(loop):
    ctx = papi.ProtocolContext(loop=loop)
    for config in config_models:
        loaded = ctx.load_instrument(config, Mount.LEFT, replace=True)
        assert loaded.model == config
        prefix = config.split('_v')[0]
        loaded = ctx.load_instrument(prefix, Mount.RIGHT, replace=True)
        assert loaded.name.startswith(prefix)


async def test_motion(loop):
    hardware = API.build_hardware_simulator(loop=loop)
    ctx = papi.ProtocolContext(loop)
    ctx.connect(hardware)
    ctx.home()
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)
    old_pos = await hardware.current_position(instr._mount)
    instr.home()
    assert instr.move_to(Location(Point(0, 0, 0), None)) is instr
    old_pos[Axis.X] = 0
    old_pos[Axis.Y] = 0
    old_pos[Axis.A] = 0
    old_pos[Axis.C] = 2
    assert await hardware.current_position(instr._mount) == old_pos


def test_location_cache(loop, monkeypatch, get_labware_def):
    hardware = API.build_hardware_simulator(loop=loop)
    ctx = papi.ProtocolContext(loop)
    ctx.connect(hardware)
    right = ctx.load_instrument('p10_single', Mount.RIGHT)
    lw = ctx.load_labware_by_name('corning_96_wellplate_360ul_flat', 1)
    ctx.home()

    test_args = None

    def fake_plan_move(from_loc, to_loc, deck,
                       well_z_margin=None,
                       lw_z_margin=None,
                       force_direct=False,
                       minimum_z_height=None):
        nonlocal test_args
        test_args = (from_loc, to_loc, deck, well_z_margin, lw_z_margin)
        return [(Point(0, 1, 10), None),
                (Point(1, 2, 10), None),
                (Point(1, 2, 3), None)]

    monkeypatch.setattr(papi.geometry, 'plan_moves', fake_plan_move)
    # When we move without a cache, the from location should be the gantry
    # position
    right.move_to(lw.wells()[0].top())
    # The home position from hardware_control/simulator.py, taking into account
    # that the right pipette is a p10 single which is a different height than
    # the reference p300 single
    assert test_args[0].point == Point(418, 353, 205)
    assert test_args[0].labware is None

    # Once we have a location cache, that should be our from_loc
    right.move_to(lw.wells()[1].top())
    assert test_args[0].labware == lw.wells()[0]


def test_move_uses_arc(loop, monkeypatch, get_labware_def):
    hardware = API.build_hardware_simulator(loop=loop)
    ctx = papi.ProtocolContext(loop)
    ctx.connect(hardware)
    ctx.home()
    right = ctx.load_instrument('p10_single', Mount.RIGHT)
    lw = ctx.load_labware_by_name('corning_96_wellplate_360ul_flat', 1)
    ctx.home()

    targets = []

    async def fake_move(mount, target_pos, **kwargs):
        nonlocal targets
        targets.append((mount, target_pos, kwargs))
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
    name = ctx._hw_manager.hardware.attached_instruments[Mount.RIGHT]['name']
    model = ctx._hw_manager.hardware.attached_instruments[Mount.RIGHT]['model']
    assert right.name == name
    assert right.model == model
    assert left.type == 'single'
    name = ctx._hw_manager.hardware.attached_instruments[Mount.LEFT]['name']
    model = ctx._hw_manager.hardware.attached_instruments[Mount.LEFT]['model']
    assert left.name == name
    assert left.model == model


def test_pick_up_and_drop_tip(loop, get_labware_def):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 1)
    tip_length = tiprack.tip_length
    mount = Mount.LEFT

    instr = ctx.load_instrument('p300_single', mount, tip_racks=[tiprack])

    pipette: Pipette = ctx._hw_manager.hardware._attached_instruments[mount]
    model_offset = Point(*pipette.config.model_offset)
    assert pipette.critical_point() == model_offset
    target_location = tiprack.wells_by_index()['A1'].top()

    instr.pick_up_tip(target_location)
    assert not tiprack.wells()[0].has_tip
    new_offset = model_offset - Point(0, 0,
                                      tip_length)
    assert pipette.critical_point() == new_offset

    instr.drop_tip(target_location)
    assert tiprack.wells()[0].has_tip
    assert pipette.critical_point() == model_offset


def test_return_tip(loop, get_labware_def):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 1)
    mount = Mount.LEFT

    instr = ctx.load_instrument('p300_single', mount, tip_racks=[tiprack])

    with pytest.raises(TypeError):
        instr.return_tip()

    pipette: Pipette\
        = ctx._hw_manager.hardware._attached_instruments[mount]

    target_location = tiprack.wells_by_index()['A1'].top()
    instr.pick_up_tip(target_location)
    assert not tiprack.wells()[0].has_tip
    assert pipette.has_tip

    instr.return_tip()
    assert not pipette.has_tip
    assert tiprack.wells()[0].has_tip


def test_pick_up_tip_no_location(loop, get_labware_def):
    ctx = papi.ProtocolContext(loop)
    ctx.home()

    tiprack1 = ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 1)
    tip_length1 = tiprack1.tip_length

    tiprack2 = ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 2)
    tip_length2 = tip_length1 + 1.0
    tiprack2.tip_length = tip_length2

    mount = Mount.LEFT

    instr = ctx.load_instrument(
        'p300_single', mount, tip_racks=[tiprack1, tiprack2])

    pipette: Pipette = ctx._hw_manager.hardware._attached_instruments[mount]
    model_offset = Point(*pipette.config.model_offset)
    assert pipette.critical_point() == model_offset

    instr.pick_up_tip()

    assert 'picking up tip' in ','.join([cmd.lower()
                                         for cmd in ctx.commands()])
    assert not tiprack1.wells()[0].has_tip

    new_offset = model_offset - Point(0, 0,
                                      tip_length1)
    assert pipette.critical_point() == new_offset

    # TODO: remove argument and verify once trash container is added
    instr.drop_tip(tiprack1.wells()[0].top())
    assert tiprack1.wells()[0].has_tip
    assert pipette.critical_point() == model_offset

    for well in tiprack1.wells():
        if well.has_tip:
            tiprack1.use_tips(well)

    assert tiprack1.next_tip() is None

    assert tiprack2.wells()[0].has_tip
    instr.pick_up_tip()
    assert not tiprack2.wells()[0].has_tip


def test_instrument_trash(loop, get_labware_def):
    ctx = papi.ProtocolContext(loop)
    ctx.home()

    mount = Mount.LEFT
    instr = ctx.load_instrument('p300_single', mount)

    assert instr.trash_container.name == 'opentrons_1_trash_1100ml_fixed'

    new_trash = ctx.load_labware_by_name('usascientific_12_reservoir_22ml', 2)
    instr.trash_container = new_trash

    assert instr.trash_container.name == 'usascientific_12_reservoir_22ml'


def test_aspirate(loop, get_labware_def, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    lw = ctx.load_labware_by_name('corning_96_wellplate_360ul_flat', 1)
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)

    fake_hw_aspirate = mock.Mock()
    fake_move = mock.Mock()
    monkeypatch.setattr(ctx._hw_manager.hardware._api,
                        'aspirate', fake_hw_aspirate)
    monkeypatch.setattr(ctx._hw_manager.hardware._api, 'move_to', fake_move)

    instr.aspirate(2.0, lw.wells()[0].bottom())
    assert 'aspirating' in ','.join([cmd.lower() for cmd in ctx.commands()])

    fake_hw_aspirate.assert_called_once_with(Mount.RIGHT, 2.0, 1.0)
    assert fake_move.call_args_list[-2] ==\
        mock.call(Mount.RIGHT, lw.wells()[0].top().point,
                  critical_point=None, speed=400)
    assert fake_move.call_args_list[-1] ==\
        mock.call(Mount.RIGHT, lw.wells()[0].bottom().point,
                  critical_point=None, speed=400)
    fake_move.reset_mock()
    fake_hw_aspirate.reset_mock()
    instr.well_bottom_clearance = 1.0
    instr.aspirate(2.0, lw.wells()[0])
    dest_point, dest_lw = lw.wells()[0].bottom()
    dest_point = dest_point._replace(z=dest_point.z + 1.0)
    assert fake_move.call_args_list[-2] ==\
        mock.call(Mount.RIGHT, lw.wells()[0].top().point,
                  critical_point=None, speed=400)
    assert fake_move.call_args_list[-1] ==\
        mock.call(Mount.RIGHT, dest_point, critical_point=None, speed=400)
    assert len(fake_move.call_args_list) == 2
    fake_move.reset_mock()
    ctx._hw_manager.hardware._api\
                            ._attached_instruments[Mount.RIGHT]\
                            ._current_volume = 1
    instr.aspirate(2.0)
    fake_move.assert_not_called()


def test_dispense(loop, get_labware_def, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    lw = ctx.load_labware_by_name('corning_96_wellplate_360ul_flat', 1)
    instr = ctx.load_instrument('p10_single', Mount.RIGHT)

    disp_called_with = None

    async def fake_hw_dispense(mount, volume=None, rate=1.0):
        nonlocal disp_called_with
        disp_called_with = (mount, volume, rate)

    move_called_with = None

    def fake_move(mount, loc, **kwargs):
        nonlocal move_called_with
        move_called_with = (mount, loc, kwargs)

    monkeypatch.setattr(ctx._hw_manager.hardware._api,
                        'dispense', fake_hw_dispense)
    monkeypatch.setattr(ctx._hw_manager.hardware._api, 'move_to', fake_move)

    instr.dispense(2.0, lw.wells()[0].bottom())
    assert 'dispensing' in ','.join([cmd.lower() for cmd in ctx.commands()])
    assert disp_called_with == (Mount.RIGHT, 2.0, 1.0)
    assert move_called_with == (Mount.RIGHT, lw.wells()[0].bottom().point,
                                {'critical_point': None,
                                 'speed': 400})

    instr.well_bottom_clearance = 1.0
    instr.dispense(2.0, lw.wells()[0])
    dest_point, dest_lw = lw.wells()[0].bottom()
    dest_point = dest_point._replace(z=dest_point.z + 1.0)
    assert move_called_with == (Mount.RIGHT, dest_point,
                                {'critical_point': None,
                                 'speed': 400})

    move_called_with = None
    instr.dispense(2.0)
    assert move_called_with is None


def test_hw_manager(loop):
    # When built without an input it should build its own adapter
    mgr = papi.ProtocolContext.HardwareManager(None)
    assert mgr._is_orig
    adapter = mgr.hardware
    # When "disconnecting" from its own simulator, the adapter should
    # be stopped and a new one created
    assert adapter.is_alive()
    new = mgr.reset_hw()
    assert new is not adapter
    assert not adapter.is_alive()
    # When deleted, the self-created adapter should be stopped
    del mgr
    assert not new.is_alive()
    # When built with a hardware API input it should wrap it but not
    # build its own
    mgr = papi.ProtocolContext.HardwareManager(
        API.build_hardware_simulator(loop=loop))
    assert isinstance(mgr.hardware, adapters.SynchronousAdapter)
    assert not mgr._is_orig
    passed = mgr.hardware
    # When disconnecting from a real external adapter, it should create
    # its own simulator and should _not_ stop the old hardware thread
    new = mgr.reset_hw()
    assert new is not passed
    assert mgr._is_orig
    assert passed.is_alive()
    # When connecting to an adapter it shouldn’t rewrap it
    assert mgr.set_hw(passed) is passed
    # And should kill its old one
    assert not new.is_alive()
    del mgr
    # but not its new one, even if deleted
    assert passed.is_alive()


def test_mix(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    lw = ctx.load_labware_by_name(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 1)
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 3)
    instr = ctx.load_instrument('p300_single', Mount.RIGHT,
                                tip_racks=[tiprack])

    instr.pick_up_tip()
    mix_steps = []
    aspirate_called_with = None
    dispense_called_with = None

    def fake_aspirate(vol=None, loc=None, rate=None):
        nonlocal aspirate_called_with
        nonlocal mix_steps
        aspirate_called_with = ('aspirate', vol, loc, rate)
        mix_steps.append(aspirate_called_with)

    def fake_dispense(vol=None, loc=None, rate=None):
        nonlocal dispense_called_with
        nonlocal mix_steps
        dispense_called_with = ('dispense', vol, loc, rate)
        mix_steps.append(dispense_called_with)

    monkeypatch.setattr(instr, 'aspirate', fake_aspirate)
    monkeypatch.setattr(instr, 'dispense', fake_dispense)

    repetitions = 2
    volume = 5
    location = lw.wells()[0]
    rate = 2
    instr.mix(repetitions, volume, location, rate)
    expected_mix_steps = [('aspirate', volume, location, 2),
                          ('dispense', volume, None, 2),
                          ('aspirate', volume, None, 2),
                          ('dispense', volume, None, 2)]

    assert mix_steps == expected_mix_steps


def test_touch_tip_default_args(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    lw = ctx.load_labware_by_name(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 1)
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 3)
    instr = ctx.load_instrument('p300_single', Mount.RIGHT,
                                tip_racks=[tiprack])

    instr.pick_up_tip()
    total_hw_moves = []

    async def fake_hw_move(mount, abs_position, speed=None,
                           critical_point=None):
        nonlocal total_hw_moves
        total_hw_moves.append((abs_position, speed))

    instr.aspirate(10, lw.wells()[0])
    monkeypatch.setattr(ctx._hw_manager.hardware._api, 'move_to', fake_hw_move)
    instr.touch_tip()
    z_offset = Point(0, 0, 1)   # default z offset of 1mm
    speed = 60                  # default speed
    edges = [lw.wells()[0]._from_center_cartesian(1, 0, 1) - z_offset,
             lw.wells()[0]._from_center_cartesian(-1, 0, 1) - z_offset,
             lw.wells()[0]._from_center_cartesian(0, 1, 1) - z_offset,
             lw.wells()[0]._from_center_cartesian(0, -1, 1) - z_offset]
    for i in range(1, 5):
        assert total_hw_moves[i] == (edges[i - 1], speed)


def test_blow_out(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    lw = ctx.load_labware_by_name(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 1)
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 3)
    instr = ctx.load_instrument('p300_single', Mount.RIGHT,
                                tip_racks=[tiprack])

    move_location = None
    instr.pick_up_tip()
    instr.aspirate(10, lw.wells()[0])

    def fake_move(loc):
        nonlocal move_location
        move_location = loc

    monkeypatch.setattr(instr, 'move_to', fake_move)

    instr.blow_out()
    # pipette should not move, if no location is passed
    assert move_location is None

    instr.aspirate(10)
    instr.blow_out(lw.wells()[0])
    # pipette should blow out at the top of the well as default
    assert move_location == lw.wells()[0].top()

    instr.aspirate(10)
    instr.blow_out(lw.wells()[0].bottom())
    # pipette should blow out at the location defined
    assert move_location == lw.wells()[0].bottom()


def test_transfer_options(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    lw1 = ctx.load_labware_by_name('biorad_96_wellplate_200ul_pcr', 1)
    lw2 = ctx.load_labware_by_name('corning_96_wellplate_360ul_flat', 2)
    tiprack = ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 3)
    instr = ctx.load_instrument('p300_single', Mount.RIGHT,
                                tip_racks=[tiprack])

    ctx.home()
    transfer_options = None

    def fake_execute_transfer(xfer_plan):
        nonlocal transfer_options
        transfer_options = xfer_plan._options

    monkeypatch.setattr(instr, '_execute_transfer', fake_execute_transfer)
    instr.transfer(10, lw1.columns()[0], lw2.columns()[0],
                   new_tip='always', mix_before=(2, 10),
                   mix_after=(3, 20), blow_out=True)
    expected_xfer_options1 = tf.TransferOptions(
        transfer=tf.Transfer(
            new_tip=TransferTipPolicy.ALWAYS,
            air_gap=0,
            carryover=True,
            gradient_function=None,
            disposal_volume=0,
            mix_strategy=tf.MixStrategy.BOTH,
            drop_tip_strategy=tf.DropTipStrategy.TRASH,
            blow_out_strategy=tf.BlowOutStrategy.TRASH,
            touch_tip_strategy=tf.TouchTipStrategy.NEVER
        ),
        pick_up_tip=tf.PickUpTipOpts(),
        mix=tf.Mix(
            mix_before=tf.MixOpts(repetitions=2,
                                  volume=10,
                                  rate=None),
            mix_after=tf.MixOpts(repetitions=3,
                                 volume=20,
                                 rate=None)
        ),
        blow_out=tf.BlowOutOpts(),
        touch_tip=tf.TouchTipOpts(),
        aspirate=tf.AspirateOpts(),
        dispense=tf.DispenseOpts()
    )
    assert transfer_options == expected_xfer_options1

    instr.pick_up_tip()
    instr.distribute(50, lw1.rows()[0][0], lw2.columns()[0],
                     new_tip='never', touch_tip=True, trash=False,
                     disposal_volume=10,
                     mix_before=(2, 30),
                     mix_after=(3, 20))
    instr.drop_tip()
    expected_xfer_options2 = tf.TransferOptions(
        transfer=tf.Transfer(
            new_tip=TransferTipPolicy.NEVER,
            air_gap=0,
            carryover=True,
            gradient_function=None,
            disposal_volume=10,
            mix_strategy=tf.MixStrategy.BEFORE,
            drop_tip_strategy=tf.DropTipStrategy.RETURN,
            blow_out_strategy=tf.BlowOutStrategy.NONE,
            touch_tip_strategy=tf.TouchTipStrategy.ALWAYS
        ),
        pick_up_tip=tf.PickUpTipOpts(),
        mix=tf.Mix(mix_before=tf.MixOpts(repetitions=2,
                                         volume=30,
                                         rate=None),
                   mix_after=tf.MixOpts()),
        blow_out=tf.BlowOutOpts(),
        touch_tip=tf.TouchTipOpts(),
        aspirate=tf.AspirateOpts(),
        dispense=tf.DispenseOpts()
    )
    assert transfer_options == expected_xfer_options2


def test_flow_rate(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    old_sfm = ctx._hw_manager.hardware

    def pass_on(aspirate=None, dispense=None, blow_out=None):
        old_sfm(aspirate=None, dispense=None, blow_out=None)

    set_flow_rate = mock.Mock(side_effect=pass_on)
    monkeypatch.setattr(ctx._hw_manager.hardware, 'set_flow_rate',
                        set_flow_rate)
    instr = ctx.load_instrument('p300_single', Mount.RIGHT)

    ctx.home()
    instr.flow_rate = {'aspirate': 1}
    assert set_flow_rate.called_with(aspirate=1)
    set_flow_rate.reset_mock()
    instr.flow_rate = {'dispense': 10, 'blow_out': 2}
    assert set_flow_rate.called_with(dispense=10, blow_out=2)
    assert instr.flow_rate == {'aspirate': 1, 'dispense': 10, 'blow_out': 2}


def test_pipette_speed(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    old_sfm = ctx._hw_manager.hardware

    def pass_on(aspirate=None, dispense=None, blow_out=None):
        old_sfm(aspirate=None, dispense=None, blow_out=None)

    set_speed = mock.Mock(side_effect=pass_on)
    monkeypatch.setattr(ctx._hw_manager.hardware, 'set_pipette_speed',
                        set_speed)
    instr = ctx.load_instrument('p300_single', Mount.RIGHT)

    ctx.home()
    instr.speed = {'aspirate': 1}
    assert set_speed.called_with(aspirate=1)
    set_speed.reset_mock()
    instr.speed = {'dispense': 10, 'blow_out': 2}
    assert set_speed.called_with(dispense=10, blow_out=2)
    assert instr.speed == {'aspirate': 1, 'dispense': 10, 'blow_out': 2}
