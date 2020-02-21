# pylama:ignore=E501
# TODO: Modify all calls to get a Well to use the `wells` method
from numpy import isclose
from unittest import mock
import pytest

from opentrons.legacy_api.containers import load as containers_load
from opentrons.config import pipette_config
from opentrons.trackers import pose_tracker


@pytest.mark.api1_only
def test_use_filter_tips(instruments, robot):
    # test tips with lower working volume than max volume of pipette used to
    # ensure that the pipette never over-aspirates with a smaller pipette tip
    tipracks = [
        'opentrons_96_filtertiprack_10ul',
        'opentrons_96_filtertiprack_200ul',
        'opentrons_96_filtertiprack_1000ul'
    ]
    for t in tipracks:
        robot.reset()
        tip_rack = containers_load(robot, t, '3')
        plate = containers_load(robot, '96-flat', '1')
        p300 = instruments.P300_Single(
            mount='left', tip_racks=[tip_rack])

        p300.pick_up_tip()
        p300.aspirate(plate[0])

        # working volume should be the lesser of the pipette max volume
        # and the tip max volume
        assert p300.current_volume == p300._working_volume
        assert p300.current_volume == min(
            tip_rack[0].max_volume(), p300.max_volume)

        # working volume should revert back to pipette max volume if no tip
        # is attached
        p300.return_tip()
        assert p300._working_volume == p300.max_volume


@pytest.mark.api1_only
def test_shake_during_pick_up(monkeypatch, robot, instruments):
    robot.reset()
    pip = instruments._create_pipette_from_config(
            config=pipette_config.load('p1000_single_v2.0'),
            mount='left',
            name='p1000_single_v2.0')
    tiprack = containers_load(robot, 'opentrons_96_tiprack_1000ul', '1')

    shake_tips_pick_up = mock.Mock(
        side_effect=pip._shake_off_tips_pick_up)
    monkeypatch.setattr(pip, '_shake_off_tips_pick_up',
                        shake_tips_pick_up)

    # Test double shake for after pick up tips
    pip.pick_up_tip(tiprack[0])
    assert shake_tips_pick_up.call_count == 2

    actual_calls = []

    def mock_jog(pose_tree, axis, distance):
        actual_calls.append((axis, distance))

    monkeypatch.setattr(pip, '_jog', mock_jog)

    # Test shake in both x and y
    shake_tips_pick_up()
    expected_calls = [('x', -0.3), ('x', 0.6), ('x', -0.3),
                      ('y', -0.3), ('y', 0.6), ('y', -0.3),
                      ('z', 20)]
    assert actual_calls == expected_calls
    pip.tip_attached = False


@pytest.mark.api1_only
def test_shake_during_drop(monkeypatch, robot, instruments):
    robot.reset()
    pip = instruments._create_pipette_from_config(
            config=pipette_config.load('p1000_single_v1.5'),
            mount='left',
            name='p1000_single_v2.0')
    tiprack = containers_load(robot, 'opentrons_96_tiprack_1000ul', '1')

    shake_tips_drop = mock.Mock(
        side_effect=pip._shake_off_tips_drop)
    monkeypatch.setattr(pip, '_shake_off_tips_drop',
                        shake_tips_drop)

    # Test single shake for after pick up tips
    pip.tip_attached = True
    pip.drop_tip(tiprack.wells(0))
    assert shake_tips_drop.call_count == 1

    actual_calls = []

    def jog_side_effect(pose_tree, axis, distance):
        actual_calls.append((axis, distance))

    jog = mock.Mock(side_effect=jog_side_effect)
    monkeypatch.setattr(pip, '_jog', jog)

    # Test shake only in x, with no location passed, shake distance is 2.25
    shake_tips_drop()
    expected_calls = [('x', -2.25), ('x', 4.5), ('x', -2.25),
                      ('z', 20)]
    assert actual_calls == expected_calls

    # Test drop tip shake at a well with diameter above upper limit (2.25 mm)
    tiprack.wells(0).properties['width'] = 2.3*4
    actual_calls.clear()
    shake_tips_drop(tiprack.wells(0))
    expected_calls = [('x', -2.25), ('x', 4.5), ('x', -2.25),
                      ('z', 20)]
    assert actual_calls == expected_calls

    # Test drop tip shake at a well with diameter between upper limit
    # and lower limit (1.00 - 2.25 mm)
    tiprack.wells(0).properties['width'] = 2*4
    actual_calls.clear()
    shake_tips_drop(tiprack.wells(0))
    expected_calls = [('x', -2), ('x', 4), ('x', -2),
                      ('z', 20)]
    assert actual_calls == expected_calls

    # Test drop tip shake at a well with diameter below lower limit (1.00 mm)
    tiprack.wells(0).properties['width'] = 0.9*4
    actual_calls.clear()
    shake_tips_drop(tiprack.wells(0))
    expected_calls = [('x', -1), ('x', 2), ('x', -1),
                      ('z', 20)]
    assert actual_calls == expected_calls
    pip.tip_attached = False


@pytest.mark.api1_only
def test_pipette_version_1_0_and_1_3_extended_travel(robot, instruments):
    models = [
        'p10_single', 'p10_multi', 'p50_single', 'p50_multi',
        'p300_single', 'p300_multi', 'p1000_single'
    ]

    for m in models:
        robot.reset()
        v1 = m + '_v1'
        v13 = m + '_v1.3'
        left = instruments._create_pipette_from_config(
            config=pipette_config.load(v1),
            mount='left',
            name=v1)
        right = instruments._create_pipette_from_config(
            config=pipette_config.load(v13),
            mount='right',
            name=v13)

        # the difference between v1 and v1.3 is that the plunger's travel
        # distance extended, allowing greater ranges for aspirate/dispense
        # and blow-out. Test that all v1.3 pipette have larger travel thant v1
        left_poses = left.plunger_positions
        left_diff = left_poses['top'] - left_poses['blow_out']
        right_poses = right.plunger_positions
        right_diff = right_poses['top'] - right_poses['blow_out']
        assert right_diff > left_diff


@pytest.mark.api1_only
def test_all_pipette_models_can_transfer(robot, instruments):
    from opentrons.config import pipette_config

    models = [
        'p10_single', 'p10_multi', 'p50_single', 'p50_multi',
        'p300_single', 'p300_multi', 'p1000_single'
    ]

    for m in models:
        robot.reset()
        v1 = m + '_v1'
        v13 = m + '_v1.3'
        left = instruments._create_pipette_from_config(
            config=pipette_config.load(v1),
            mount='left',
            name=v1)
        right = instruments._create_pipette_from_config(
            config=pipette_config.load(v13),
            mount='right',
            name=v13)

        left.tip_attached = True
        right.tip_attached = True
        left.aspirate().dispense()
        right.aspirate().dispense()


@pytest.mark.api1_only
def test_pipette_models_reach_max_volume(robot, instruments):

    for model in pipette_config.config_models:
        config = pipette_config.load(model)
        robot.reset()
        pipette = instruments._create_pipette_from_config(
            config=config,
            mount='right',
            name=model)

        pipette.tip_attached = True
        pipette.aspirate(pipette.max_volume)
        pos = pose_tracker.absolute(
            robot.poses,
            pipette.instrument_actuator)
        assert pos[0] < pipette.plunger_positions['top']


@pytest.mark.api1_only
def test_flow_rate(robot, instruments):
    # Test new flow-rate functionality on all pipettes with different max vols
    robot.reset()
    p10 = instruments.P10_Single(mount='right')

    p10.set_flow_rate(aspirate=10)
    ul_per_mm = p10._ul_per_mm(p10.max_volume, 'aspirate')
    expected_mm_per_sec = round(10 / ul_per_mm, 6)
    assert p10.speeds['aspirate'] == expected_mm_per_sec

    p10.set_flow_rate(dispense=20)
    ul_per_mm = p10._ul_per_mm(p10.max_volume, 'dispense')
    expected_mm_per_sec = round(20 / ul_per_mm, 6)
    assert p10.speeds['dispense'] == expected_mm_per_sec

    robot.reset()
    p50 = instruments.P50_Single(mount='right')

    p50.set_flow_rate(aspirate=50)
    ul_per_mm = p50._ul_per_mm(p50.max_volume, 'aspirate')
    expected_mm_per_sec = round(50 / ul_per_mm, 6)
    assert p50.speeds['aspirate'] == expected_mm_per_sec

    p50.set_flow_rate(dispense=60)
    ul_per_mm = p50._ul_per_mm(p50.max_volume, 'dispense')
    expected_mm_per_sec = round(60 / ul_per_mm, 6)
    assert p50.speeds['dispense'] == expected_mm_per_sec

    robot.reset()
    p300 = instruments.P300_Single(mount='right')

    p300.set_flow_rate(aspirate=300)
    ul_per_mm = p300._ul_per_mm(p300.max_volume, 'aspirate')
    expected_mm_per_sec = round(300 / ul_per_mm, 6)
    assert p300.speeds['aspirate'] == expected_mm_per_sec

    p300.set_flow_rate(dispense=310)
    ul_per_mm = p300._ul_per_mm(p300.max_volume, 'dispense')
    expected_mm_per_sec = round(310 / ul_per_mm, 6)
    assert p300.speeds['dispense'] == expected_mm_per_sec

    robot.reset()
    p1000 = instruments.P1000_Single(mount='right')

    p1000.set_flow_rate(aspirate=1000)
    ul_per_mm = p1000._ul_per_mm(p1000.max_volume, 'aspirate')
    expected_mm_per_sec = round(1000 / ul_per_mm, 6)
    assert p1000.speeds['aspirate'] == expected_mm_per_sec

    p1000.set_flow_rate(dispense=1100)
    ul_per_mm = p1000._ul_per_mm(p1000.max_volume, 'dispense')
    expected_mm_per_sec = round(1100 / ul_per_mm, 6)
    assert p1000.speeds['dispense'] == expected_mm_per_sec


@pytest.mark.api1_only
def test_pipette_max_deck_height(robot, instruments):
    robot.reset()
    tallest_point = robot._driver.homed_position['Z']
    p = instruments.P300_Single(mount='left')
    assert p._max_deck_height() == tallest_point

    # TODO: revise when tip length is on tipracks
    for tip_length in [10, 25, 55, 100]:
        p._add_tip(length=tip_length)
        assert p._max_deck_height() == tallest_point - tip_length
        p._remove_tip(length=tip_length)


@pytest.mark.api1_only
def test_retract(robot, instruments):
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    p300 = instruments.P300_Single(mount='left')
    from opentrons.drivers.smoothie_drivers.driver_3_0 import HOMED_POSITION

    p300.move_to(plate[0].top())

    assert p300.previous_placeable == plate[0]
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300)
    assert current_pos[2] == plate[0].coordinates()[2]

    p300.retract()

    assert p300.previous_placeable is None
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300.instrument_mover)
    assert current_pos[2] == HOMED_POSITION['A']


@pytest.mark.api1_only
@pytest.mark.xfail
def test_aspirate_move_to(old_aspiration, robot, instruments):
    # TODO: it seems like this test is checking that the aspirate point is
    # TODO: *fully* at the bottom of the well, which isn't the expected
    # TODO: behavior of aspirate when a location is not specified. This should
    # TODO: be split into two tests--one for this behavior (specifying a place)
    # TODO: and another one for the default
    robot.reset()
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    p300 = instruments.P300_Single(
        mount='left', tip_racks=[tip_rack])
    p300.pick_up_tip()

    x, y, z = (161.0, 116.7, 0.0)
    plate = containers_load(robot, '96-flat', '1')
    well = plate[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=plate)
    location = (plate, pos)

    robot.poses = p300._move(robot.poses, x=x, y=y, z=z)
    robot.calibrate_container_with_instrument(plate, p300, False)

    p300.aspirate(100, location)
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300.instrument_actuator)

    assert isclose(current_pos, (6.9, 0.0, 0.0)).all()

    current_pos = pose_tracker.absolute(robot.poses, p300)
    assert isclose(current_pos, (161,  116.7,   10.5)).all()


@pytest.mark.api1_only
def test_dispense_move_to(old_aspiration, robot, instruments):
    # TODO: same as for aspirate
    robot.reset()
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    p300 = instruments.P300_Single(
                   mount='left',
                   tip_racks=[tip_rack])

    x, y, z = (161.0, 116.7, 0.0)
    plate = containers_load(robot, '96-flat', '1')
    well = plate[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=plate)
    location = (plate, pos)

    robot.poses = p300._move(robot.poses, x=x, y=y, z=z)
    robot.calibrate_container_with_instrument(plate, p300, False)

    p300.pick_up_tip()
    p300.aspirate(100, location)
    p300.dispense(100, location)
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300.instrument_actuator)
    assert (current_pos == (1.5, 0.0, 0.0)).all()

    current_pos = pose_tracker.absolute(robot.poses, p300)
    assert isclose(current_pos, (161,  116.7,   10.5)).all()


@pytest.mark.api1_only
def test_trough_move_to(robot, instruments):
    # TODO: new labware system should center multichannel pipettes within wells
    # TODO: (correct single-channel position currently corresponds to back-
    # TODO: most tip of multi-channel), so calculate against that
    robot.reset()
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    p300 = instruments.P300_Single(
                   mount='left',
                   tip_racks=[tip_rack])

    trough = containers_load(robot, 'trough-12row', '1')
    p300.pick_up_tip()
    p300.move_to(trough)
    current_pos = pose_tracker.absolute(robot.poses, p300)
    assert isclose(current_pos, (0, 0, 38)).all()


@pytest.mark.api1_only
def test_delay_calls(monkeypatch, instruments, robot):
    from opentrons.legacy_api.instruments import pipette
    p300 = instruments.P300_Single(mount='right')

    cmd = []

    def mock_pause():
        nonlocal cmd
        cmd.append('pause')

    def mock_resume():
        nonlocal cmd
        cmd.append('resume')

    def mock_sleep(seconds):
        cmd.append("sleep {}".format(seconds))

    def mock_is_simulating():
        return False

    monkeypatch.setattr(robot, 'is_simulating', mock_is_simulating)
    monkeypatch.setattr(robot, 'pause', mock_pause)
    monkeypatch.setattr(robot, 'resume', mock_resume)
    monkeypatch.setattr(pipette, '_sleep', mock_sleep)

    p300.delay(seconds=4, minutes=1)

    assert 'pause' in cmd
    assert 'sleep 64.0' in cmd
    assert 'resume' in cmd


@pytest.mark.xfail
def test_drop_tip_in_trash(monkeypatch, instruments, robot, labware):
    from opentrons.legacy_api.instruments.pipette import Pipette
    robot.home()
    tiprack = labware.load('tiprack-200ul', '1')
    p300 = instruments.P300_Multi(mount='left', tip_racks=[tiprack])
    p300.pick_up_tip()

    movelog = []
    move_fn = Pipette.move_to

    def log_move(self, location, strategy=None):
        movelog.append(location)
        move_fn(self, location, strategy)

    monkeypatch.setattr(Pipette, "move_to", log_move)

    p300.drop_tip()

    base_obj = movelog[0][0]
    y_offset = movelog[0][1][1]
    assert base_obj == robot.fixed_trash[0]
    assert y_offset == 111.5
