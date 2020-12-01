import pytest
from unittest import mock
from functools import partial
from tests.opentrons.conftest import state
from opentrons.config import robot_configs
from opentrons.protocol_api import labware
from opentrons.api import models
from opentrons.types import Point, Location, Mount
from opentrons.hardware_control import CriticalPoint, API
from opentrons.hardware_control.types import MotionChecks

state = partial(state, 'calibration')


@pytest.mark.api2_only  # noqa(C901)
async def test_tip_probe_v2(main_router, model, monkeypatch):
    def fake_update(self, mount, new_offset=None, from_tip_probe=None):
        assert mount == Mount[model.instrument.mount.upper()]
        if new_offset:
            assert new_offset == Point(0, 0, 0)
        elif from_tip_probe:
            assert from_tip_probe == Point(0, 0, 0)
        else:
            assert False, "fake_update called with no args"

    def fake_move(instrument):
        assert instrument == model.instrument

    monkeypatch.setattr(API, 'update_instrument_offset', fake_update)
    monkeypatch.setattr(main_router.calibration_manager,
                        '_move_to_front', fake_move)

    tr = labware.load('opentrons_96_tiprack_300ul', Location(Point(), 'test'))

    model.instrument.tip_racks = [
        models.Container(tr,
                         [model.instrument._instrument],
                         model.instrument._context)]

    def new_fake_locate(self, mount, tip_length):
        assert tip_length == pytest.approx(59.3 - 7.47)
        return Point(0, 0, 0)

    monkeypatch.setattr(API, 'locate_tip_probe_center', new_fake_locate)
    main_router.calibration_manager.tip_probe(model.instrument)
    await main_router.wait_until(state('ready'))

    def new_fake_locate2(self, mount, tip_length):
        assert tip_length == pytest.approx(59.3 - 7.47)
        return Point(0, 0, 0)

    monkeypatch.setattr(API, 'locate_tip_probe_center', new_fake_locate2)
    main_router.calibration_manager.tip_probe(model.instrument)


async def test_correct_hotspots():
    config = robot_configs.build_config([], {})

    tip_length = 47
    switch_clearance = 7.5
    x_switch_offset = 2.0
    y_switch_offset = 5.0
    z_switch_offset = 5.0
    deck_clearance = 5.0
    z_probe_clearance = 5.0
    z_start_clearance = 20.0

    size_x, size_y, size_z = config.tip_probe.dimensions

    rel_x_start = (size_x / 2) + switch_clearance
    rel_y_start = (size_y / 2) + switch_clearance
    center = [293.03, 301.27, 74.3]

    nozzle_safe_z = round((size_z - tip_length) + z_probe_clearance, 3)
    z_start = max(deck_clearance, nozzle_safe_z)
    expected = [robot_configs.HotSpot('x',
                                      -rel_x_start,
                                      x_switch_offset,
                                      z_start,
                                      size_x),
                robot_configs.HotSpot('x',
                                      rel_x_start,
                                      x_switch_offset,
                                      z_start,
                                      -size_x),
                robot_configs.HotSpot('y',
                                      y_switch_offset,
                                      -rel_y_start,
                                      z_start,
                                      size_y),
                robot_configs.HotSpot('y',
                                      y_switch_offset,
                                      rel_y_start,
                                      z_start,
                                      -size_y),
                robot_configs.HotSpot('z',
                                      0,
                                      z_switch_offset,
                                      center[2] + z_start_clearance,
                                      -size_z)]

    actual = robot_configs.calculate_tip_probe_hotspots(
        tip_length,
        config.tip_probe)

    assert expected == actual


@pytest.mark.api2_only
async def test_move_to_front_api2(main_router, model):
    main_router.calibration_manager._hardware.home()
    with mock.patch.object(API, 'move_to') as patch:
        main_router.calibration_manager.move_to_front(model.instrument)
        patch.assert_called_with(Mount.RIGHT, Point(132.5, 90.5, 150),
                                 critical_point=CriticalPoint.NOZZLE)

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


async def test_pick_up_tip(main_router, model):
    with mock.patch.object(
            model.instrument._instrument, 'pick_up_tip') as pick_up_tip:
        main_router.calibration_manager.pick_up_tip(
            model.instrument,
            model.container)

        pick_up_tip.assert_called_with(
            model.container._container.wells()[0])

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


async def test_drop_tip(main_router, model):
    with mock.patch.object(
            model.instrument._instrument, 'drop_tip') as drop_tip:
        main_router.calibration_manager.drop_tip(
            model.instrument,
            model.container)

        drop_tip.assert_called_with(
            model.container._container.wells()[0])

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


async def test_return_tip(main_router, model):
    with mock.patch.object(
            model.instrument._instrument, 'return_tip') as return_tip:
        main_router.calibration_manager.return_tip(model.instrument)

        return_tip.assert_called_with()

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


@pytest.mark.api2_only
async def test_home_api2(main_router, model):
    main_router.calibration_manager.home(
        model.instrument)

    await main_router.wait_until(state('moving'))
    await main_router.wait_until(state('ready'))


@pytest.mark.api2_only
async def test_home_all_api2(main_router, model):
    with mock.patch.object(model.instrument._context, 'home') as home:
        main_router.calibration_manager.home_all(
            model.instrument)

        home.assert_called_once()

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


async def test_move_to_top(main_router, model):
    with mock.patch.object(model.instrument._instrument, 'move_to') as move_to:
        main_router.calibration_manager.move_to(
            model.instrument,
            model.container)
        target = model.container._container.wells()[0].top()
        move_to.assert_called_with(target)

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


@pytest.mark.api2_only
async def test_jog_api2(main_router, model):
    main_router.calibration_manager.home(model.instrument)
    with mock.patch.object(API, 'move_rel') as jog:
        for distance, axis in zip((1, 2, 3), 'xyz'):
            main_router.calibration_manager.jog(
                model.instrument,
                distance,
                axis
            )

        expected = [
            mock.call(Mount.RIGHT, point, check_bounds=MotionChecks.HIGH)
            for point in [Point(x=1), Point(y=2), Point(z=3)]]

        assert jog.mock_calls == expected

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


@pytest.mark.api2_only
async def test_update_container_offset_v2(main_router, model):
    with mock.patch(
        'opentrons.protocol_api.labware.save_calibration') as call,\
            mock.patch.object(API,
                              'gantry_position') as gp:
        gp.return_value = Point(0, 0, 0)
        main_router.calibration_manager.update_container_offset(
            model.container,
            model.instrument
        )
        diff = (Point(0, 0, 0)
                - model.container._container.wells()[0].top().point)
        call.assert_called_with(model.container._container,
                                diff)


@pytest.mark.api2_only
async def test_jog_calibrate_bottom_v2(
        main_router,
        model,
        calibrate_bottom_flag):

    # Check that the feature flag correctly implements calibrate to bottom
    container = model.container._container
    height = container.wells()[0].geometry._depth
    old_bottom = container.wells()[0].bottom().point

    main_router.calibration_manager.home(model.instrument)
    main_router.calibration_manager.move_to(model.instrument, model.container)
    main_router.calibration_manager.jog(model.instrument, 1, 'x')
    main_router.calibration_manager.jog(model.instrument, 2, 'y')
    main_router.calibration_manager.jog(model.instrument, 3, 'z')
    main_router.calibration_manager.jog(model.instrument, -height, 'z')

    main_router.calibration_manager.update_container_offset(
        model.container,
        model.instrument
    )

    assert list(model.container._container.wells()[0].bottom().point)\
        == pytest.approx(old_bottom + Point(1, 2, 3))


@pytest.mark.api2_only
async def test_jog_calibrate_top_v2(
        main_router,
        model):

    # Check that the old behavior remains the same without the feature flag

    container = model.container._container
    old_top = container.wells()[0].top().point
    main_router.calibration_manager.home(model.instrument)
    main_router.calibration_manager.move_to(model.instrument, model.container)
    main_router.calibration_manager.jog(model.instrument, 1, 'x')
    main_router.calibration_manager.jog(model.instrument, 2, 'y')
    main_router.calibration_manager.jog(model.instrument, 3, 'z')

    main_router.calibration_manager.update_container_offset(
        model.container,
        model.instrument
    )
    assert list(model.container._container.wells()[0].top().point)\
        == pytest.approx(old_top + Point(1, 2, 3))
