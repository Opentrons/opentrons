from unittest import mock

import pytest

from opentrons.types import Mount
from opentrons.hardware_control import API


@pytest.mark.api2_only
def test_add_instrument(loop, monkeypatch, singletons):
    fake_load = mock.Mock()
    instruments = singletons['instruments']
    monkeypatch.setattr(instruments._robot_wrapper._ctx,
                        'load_instrument', fake_load)

    instruments.P1000_Single('left')
    instruments.P10_Single('right')
    instruments.P10_Multi('left')
    instruments.P50_Single('right')
    instruments.P50_Multi('left')
    instruments.P300_Single('right')
    instruments.P300_Multi('left')
    instruments.P1000_Single('right')
    assert fake_load.call_args_list == [
        (('p1000_single', Mount.LEFT), {}),
        (('p10_single', Mount.RIGHT), {}),
        (('p10_multi', Mount.LEFT), {}),
        (('p50_single', Mount.RIGHT), {}),
        (('p50_multi', Mount.LEFT), {}),
        (('p300_single', Mount.RIGHT), {}),
        (('p300_multi', Mount.LEFT), {}),
        (('p1000_single', Mount.RIGHT), {})
    ]


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


@pytest.mark.api2_only
def test_head_speed(singletons):
    # Setting axis speeds should set max speeds
    singletons['robot'].head_speed(x=2, y=3, z=5)
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
    assert left._ctx._default_speed == 10
    # And setting it with already-created instruments should work
    singletons['robot'].head_speed(combined_speed=20)
    assert left._ctx._default_speed == 20


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


@pytest.mark.api2_ony
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
