import pytest
from opentrons import types
from opentrons import hardware_control as hc


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
    assert c._current_position == {'X': 418, 'Y': 353, 'Z': 218,
                                   'A': 218, 'B': 19, 'C': 19}


async def test_controller_musthome(hardware_api):
    abs_position = types.Point(30, 20, 10)
    mount = types.Mount.RIGHT
    with pytest.raises(hc.MustHomeError):
        await hardware_api.move_to(mount, abs_position)


async def test_move(hardware_api):
    abs_position = types.Point(30, 20, 10)
    mount = types.Mount.RIGHT
    target_position1 = {'X': 30, 'Y': 20, 'Z': 218, 'A': 10, 'B': 19, 'C': 19}
    await hardware_api.home()
    await hardware_api.move_to(mount, abs_position)
    assert hardware_api._current_position == target_position1

    rel_position = types.Point(30, 20, 10)
    mount2 = types.Mount.LEFT
    target_position2 = {'X': 60, 'Y': 40, 'Z': 228, 'A': 10, 'B': 19, 'C': 19}
    await hardware_api.move_rel(mount2, rel_position)
    assert hardware_api._current_position == target_position2
