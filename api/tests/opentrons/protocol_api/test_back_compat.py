from unittest import mock

import pytest

from opentrons.hardware_control import API


@pytest.mark.parametrize('ctorname,modelname', [
    ('P1000_Single', 'p1000_single'),
    ('P1000_Single_GEN2', 'p1000_single_gen2'),
    ('P300_Single', 'p300_single'),
    ('P300_Single_GEN2', 'p300_single_gen2'),
    ('P300_Multi', 'p300_multi'),
    ('P300_Multi_GEN2', 'p300_multi_gen2'),
    ('P20_Single_GEN2', 'p20_single_gen2'),
    ('P20_Multi_GEN2', 'p20_multi_gen2'),
    ('P10_Single', 'p10_single'),
    ('P10_Multi', 'p10_multi')
])
@pytest.mark.api2_only
def test_add_instrument(loop, monkeypatch, singletons,
                        ctorname, modelname):
    instruments = singletons['instruments']
    pip = getattr(instruments, ctorname)('left')
    assert pip.name == modelname


@pytest.mark.api2_only
def test_head_speed(singletons):
    # Setting axis speeds should set max speeds
    singletons['robot'].head_speed(x=2, y=3, z=5, b=3)
    assert singletons['robot']._ctx.max_speeds['X'] == 2
    assert singletons['robot']._ctx.max_speeds['Y'] == 3
    assert singletons['robot']._ctx.max_speeds['Z'] == 5
    assert 'A' not in singletons['robot']._ctx.max_speeds
    # but not default speeds
    assert singletons['robot']._head_speed_override is None

    # Setting default speed shouldn't affect max speeds
    singletons['robot'].head_speed(combined_speed=10)
    assert singletons['robot']._ctx.max_speeds['X'] == 2
    assert singletons['robot']._ctx.max_speeds['Y'] == 3
    assert singletons['robot']._ctx.max_speeds['Z'] == 5
    assert 'A' not in singletons['robot']._ctx.max_speeds
    # And should be cached
    assert singletons['robot']._head_speed_override == 10
    # Default speed should be provisioned on pipette create from the cache
    left = singletons['instruments'].P50_Single('left')
    assert left._instr_ctx._default_speed == 10
    # and so should plunger max
    assert left._max_plunger_speed == 3
    # And setting it with already-created instruments should work
    singletons['robot'].head_speed(combined_speed=20, b=4)
    assert left._instr_ctx._default_speed == 20
    assert left._max_plunger_speed == 4


@pytest.mark.api2_only
def test_pause(singletons, monkeypatch):
    pause_mock = mock.Mock()
    monkeypatch.setattr(singletons['robot']._ctx,
                        'pause', pause_mock)
    singletons['robot'].pause()
    pause_mock.assert_called_once_with(None)
    pause_mock.reset_mock()
    singletons['robot'].pause(msg='Hi')
    pause_mock.assert_called_once_with('Hi')


@pytest.mark.api2_only
def test_resume(singletons, monkeypatch):
    resume_mock = mock.Mock()
    monkeypatch.setattr(
        singletons['robot']._ctx,
        'resume',
        resume_mock)
    singletons['robot'].resume()
    resume_mock.assert_called_once()


@pytest.mark.api2_only
def test_comment(singletons, monkeypatch):
    comment_mock = mock.Mock()
    monkeypatch.setattr(singletons['robot']._ctx,
                        'comment',
                        comment_mock)
    singletons['robot'].comment('hello')
    comment_mock.assert_called_once_with('hello')


@pytest.mark.api2_only
def test_connect_simulating(singletons, monkeypatch):
    assert singletons['robot'].is_simulating()
    assert not singletons['robot'].is_connected()
    build_mock = mock.Mock()
    new_sim = API.build_hardware_simulator()
    build_mock.return_value = new_sim
    is_sim_mock = mock.Mock()
    is_sim_mock.return_value = False
    monkeypatch.setattr(new_sim, 'get_is_simulator',
                        is_sim_mock)
    monkeypatch.setattr(API, 'build_hardware_controller',
                        build_mock)
    singletons['robot'].connect('testport')
    assert build_mock.call_args_list[0][1]['port'] == 'testport'
    assert not singletons['robot'].is_simulating()
    assert singletons['robot'].is_connected()
    singletons['robot'].disconnect()
    assert singletons['robot'].is_simulating()
    assert not singletons['robot'].is_connected()


@pytest.mark.api2_only
def test_robot_move(singletons, monkeypatch):
    instr_mock = mock.Mock()
    singletons['robot'].move_to('hi', instr_mock)
    assert instr_mock.move_to.call_args_list[0] == (('hi', 'arc'), {})


@pytest.mark.api2_only
def test_robot_reset(singletons):
    singletons['instruments'].P300_Single('right')
    singletons['robot'].head_speed(204, x=2)
    singletons['robot'].reset()
    assert singletons['robot']._instrs == {}
    assert singletons['robot']._head_speed_override is None
    assert singletons['robot']._ctx.max_speeds == {}


@pytest.mark.api2_only
def test_robot_deck_wrapper(singletons):
    assert singletons['robot'].deck['12'] == singletons['robot'].deck['12']
