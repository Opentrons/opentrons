import pytest
from opentrons.types import Mount, Point
from opentrons.config import robot_configs, pipette_config


async def test_input_checks(hardware_api, monkeypatch):
    expected_tl = 0

    old_hotspots = robot_configs.calculate_tip_probe_hotspots

    def check_tiplength(tip_length, tip_probe):
        nonlocal expected_tl
        assert expected_tl == tip_length
        return old_hotspots(tip_length, tip_probe)

    monkeypatch.setattr(robot_configs,
                        'calculate_tip_probe_hotspots', check_tiplength)

    await hardware_api.cache_instruments({Mount.RIGHT: 'p300_single'})
    await hardware_api.home()

    with pytest.raises(AssertionError):
        await hardware_api.locate_tip_probe_center(Mount.RIGHT)

    expected_tl = 10
    await hardware_api.locate_tip_probe_center(Mount.RIGHT, 10)
    assert not hardware_api._attached_instruments[Mount.RIGHT].has_tip

    await hardware_api.pick_up_tip(Mount.RIGHT, 20)
    expected_tl = 20
    await hardware_api.locate_tip_probe_center(Mount.RIGHT)

    assert hardware_api._attached_instruments[Mount.RIGHT].has_tip
    await hardware_api.locate_tip_probe_center(Mount.RIGHT, 20)


@pytest.mark.parametrize('mount', [Mount.RIGHT, Mount.LEFT])
@pytest.mark.parametrize('pipette_model', pipette_config.config_models)
async def test_moves_to_hotspot(hardware_api, monkeypatch,
                                mount, pipette_model):
    move_calls = []
    rel_calls = []
    probe_calls = []

    old_move_to = hardware_api.move_to
    old_move_rel = hardware_api.move_rel
    old_probe = hardware_api._backend.probe

    async def fake_move_to(which_mount, point):
        move_calls.append((which_mount, point))
        return await old_move_to(which_mount, point)

    async def fake_move_rel(which_mount, delta):
        rel_calls.append((which_mount, delta))
        return await old_move_rel(which_mount, delta)

    def fake_probe(ax, dist):
        probe_calls.append((ax, dist))
        return old_probe(ax, dist)

    monkeypatch.setattr(hardware_api, 'move_to', fake_move_to)
    monkeypatch.setattr(hardware_api, 'move_rel', fake_move_rel)
    monkeypatch.setattr(hardware_api._backend, 'probe', fake_probe)

    await hardware_api.cache_instruments({mount: pipette_model})
    await hardware_api.home()

    center = await hardware_api.locate_tip_probe_center(mount, 30)
    hotspots = robot_configs.calculate_tip_probe_hotspots(
        30, hardware_api._config.tip_probe)
    assert len(move_calls) == len(hotspots) * 4
    assert len(rel_calls) == len(hotspots)
    move_iter = iter(move_calls)
    rel_iter = iter(rel_calls)
    probe_iter = iter(probe_calls)
    bounce_base = hardware_api._config.tip_probe.bounce_distance
    old_center = hardware_api._config.tip_probe.center
    for hs in hotspots:
        x0 = old_center[0] + hs.x_start_offs
        y0 = old_center[1] + hs.y_start_offs
        z0 = hs.z_start_abs
        next(move_iter)
        next(move_iter)
        rel = next(rel_iter)
        if hs.probe_distance < 0:
            bounce = bounce_base
        else:
            bounce = -bounce_base
        assert rel[1] == Point(**{hs.axis: bounce})
        prep_point = next(move_iter)
        assert prep_point[1] == Point(x0, y0, z0)
        probe = next(probe_iter)
        assert probe[0] == hs.axis if hs.axis != 'z' else 'a'
        assert probe[1] == hs.probe_distance
        next(move_iter)

    targ = Point(*hardware_api._config.tip_probe.center)
    # The x and y are the same because the offsets from our naive mock of
    # probe() should cancel out, but the z only has one side so we need
    # to figure out what it will be
    targ = targ._replace(z=hotspots[-1][3]+hotspots[-1][4])
    assert list(center) == pytest.approx(targ)


@pytest.mark.parametrize('mount', [Mount.RIGHT, Mount.LEFT])
@pytest.mark.parametrize('pipette_model', pipette_config.config_models)
async def test_update_instrument_offset(hardware_api, mount, pipette_model):
    await hardware_api.cache_instruments({mount: pipette_model})
    p = Point(1, 2, 3)
    with pytest.raises(ValueError):
        await hardware_api.update_instrument_offset(mount)
    await hardware_api.update_instrument_offset(mount, new_offset=p)
    pip_type = 'multi' if 'multi' in pipette_model else 'single'
    assert\
        hardware_api._config.instrument_offset[mount.name.lower()][pip_type]\
        == [1, 2, 3]
    assert hardware_api._attached_instruments[mount]._instrument_offset == p
    center = Point(*hardware_api._config.tip_probe.center) + Point(3, 2, 1)
    await hardware_api.update_instrument_offset(mount, from_tip_probe=center)
    assert\
        hardware_api._config.instrument_offset[mount.name.lower()][pip_type]\
        == [-3, -2, -1]
    assert hardware_api._attached_instruments[mount]._instrument_offset\
        == Point(-3, -2, -1)
