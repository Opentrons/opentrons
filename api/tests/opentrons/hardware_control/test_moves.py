import pytest
from opentrons import types
from opentrons import hardware_control as hc
from opentrons.hardware_control.types import Axis


@pytest.fixture
def hardware_api(monkeypatch, loop):
    def mock_move(position):
        pass
    hw_api = hc.API.build_hardware_simulator(loop=loop)
    monkeypatch.setattr(hw_api._backend, 'move', mock_move)
    return hw_api


async def test_controller_home(loop):
    c = hc.API.build_hardware_simulator(loop=loop)
    await c.home()
    assert c._current_position == {Axis.X: 418,
                                   Axis.Y: 353,
                                   Axis.Z: 218,
                                   Axis.A: 218,
                                   Axis.B: 19,
                                   Axis.C: 19}
    c._config = c._config._replace(gantry_calibration=[[1, 0, 0, 10],
                                                       [0, 1, 0, 20],
                                                       [0, 0, 1, 30],
                                                       [0, 0, 0, 1]],
                                   mount_offset=[0, 0, 10])
    assert c.config.gantry_calibration == [[1, 0, 0, 10],
                                           [0, 1, 0, 20],
                                           [0, 0, 1, 30],
                                           [0, 0, 0, 1]]
    await c.home()
    # Check that we correctly apply the inverse gantry calibration
    assert c._current_position == {Axis.X: 408,
                                   Axis.Y: 333,
                                   Axis.Z: 188,
                                   Axis.A: 188,
                                   Axis.B: 19,
                                   Axis.C: 19}
    # Check that we subsequently apply mount offset
    assert c.current_position(types.Mount.RIGHT) == {Axis.X: 408,
                                                     Axis.Y: 333,
                                                     Axis.A: 188,
                                                     Axis.C: 19}
    assert c.current_position(types.Mount.LEFT) == {Axis.X: 408,
                                                    Axis.Y: 333,
                                                    Axis.Z: 198,
                                                    Axis.B: 19}


async def test_controller_musthome(hardware_api):
    abs_position = types.Point(30, 20, 10)
    mount = types.Mount.RIGHT
    with pytest.raises(hc.MustHomeError):
        await hardware_api.move_to(mount, abs_position)


async def test_move(hardware_api):
    abs_position = types.Point(30, 20, 10)
    mount = types.Mount.RIGHT
    target_position1 = {Axis.X: 30,
                        Axis.Y: 20,
                        Axis.Z: 218,
                        Axis.A: 10,
                        Axis.B: 19,
                        Axis.C: 19}
    await hardware_api.home()
    await hardware_api.move_to(mount, abs_position)
    assert hardware_api._current_position == target_position1

    # This assert implicitly checks that the mount offset is not applied to
    # relative moves; if you change this to move_to, the offset will be
    # applied again
    rel_position = types.Point(30, 20, 10)
    mount2 = types.Mount.LEFT
    target_position2 = {Axis.X: 60,
                        Axis.Y: 40,
                        Axis.Z: 228,
                        Axis.A: 10,
                        Axis.B: 19,
                        Axis.C: 19}
    await hardware_api.move_rel(mount2, rel_position)
    assert hardware_api._current_position == target_position2


async def test_mount_offset_applied(hardware_api):
    await hardware_api.home()
    abs_position = types.Point(30, 20, 10)
    mount = types.Mount.LEFT
    target_position = {Axis.X: 64,
                       Axis.Y: 20,
                       Axis.Z: 10,
                       Axis.A: 218,
                       Axis.B: 19,
                       Axis.C: 19}
    await hardware_api.move_to(mount, abs_position)
    assert hardware_api._current_position == target_position


async def test_critical_point_applied(hardware_api, monkeypatch):
    await hardware_api.home()
    hardware_api._backend._attached_instruments\
        = {types.Mount.LEFT: None,
           types.Mount.RIGHT: 'p10_single_v1'}
    await hardware_api.cache_instruments()
    # Our critical point is now the tip of the nozzle
    await hardware_api.move_to(types.Mount.RIGHT, types.Point(0, 0, 0))
    target_no_offset = {Axis.X: 0,
                        Axis.Y: 0,
                        Axis.Z: 218,
                        Axis.A: 13,  # from pipette-config.json model offset
                        Axis.B: 19,
                        Axis.C: 19}
    assert hardware_api._current_position == target_no_offset
    target = {Axis.X: 0,
              Axis.Y: 0,
              Axis.A: 0,
              Axis.C: 19}
    assert hardware_api.current_position(types.Mount.RIGHT) == target
    await hardware_api.pick_up_tip(types.Mount.RIGHT)
    # Now the current position (with offset applied) should change
    target[Axis.A] = -33
    assert hardware_api.current_position(types.Mount.RIGHT) == target
    # This move should take the new critical point into account
    await hardware_api.move_to(types.Mount.RIGHT, types.Point(0, 0, 0))
    target_no_offset[Axis.A] = 46
    assert hardware_api._current_position == target_no_offset
    # But the position with offset should be back to the original
    target[Axis.A] = 0
    assert hardware_api.current_position(types.Mount.RIGHT) == target
    # And removing the tip should move us back to the original
    await hardware_api.drop_tip(types.Mount.RIGHT)
    target[Axis.A] = 33
    assert hardware_api.current_position(types.Mount.RIGHT) == target
    await hardware_api.move_to(types.Mount.RIGHT, types.Point(0, 0, 0))
    target_no_offset[Axis.A] = 13
    target[Axis.A] = 0
    assert hardware_api._current_position == target_no_offset
    assert hardware_api.current_position(types.Mount.RIGHT) == target


async def test_deck_cal_applied(monkeypatch, loop):
    new_gantry_cal = [[1, 0, 0, 10],
                      [0, 1, 0, 20],
                      [0, 0, 1, 30],
                      [0, 0, 0, 1]]
    called_with = None

    def mock_move(position):
        nonlocal called_with
        called_with = position

    hardware_api = hc.API.build_hardware_simulator(loop=loop)
    monkeypatch.setattr(hardware_api._backend, 'move', mock_move)
    old_config = hardware_api.config
    hardware_api._config = old_config._replace(
        gantry_calibration=new_gantry_cal)
    await hardware_api.home()
    await hardware_api.move_to(types.Mount.RIGHT, types.Point(0, 0, 0))
    assert called_with['X'] == 10
    assert called_with['Y'] == 20
    assert called_with['A'] == 30
    # Check that mount offset is also applied
    await hardware_api.move_to(types.Mount.LEFT, types.Point(0, 0, 0))
    assert called_with['X'] == 44
    assert called_with['Y'] == 20
    assert called_with['Z'] == 30
