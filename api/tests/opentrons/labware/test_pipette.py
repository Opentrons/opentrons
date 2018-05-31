# pylama:ignore=E501

from opentrons import instruments, robot
from opentrons.containers import load as containers_load
from opentrons.trackers import pose_tracker
from numpy import isclose


def test_pipette_version_1_0_and_1_3_extended_travel():
    from opentrons.instruments import pipette_config

    models = [
        'p10_single', 'p10_multi', 'p50_single', 'p50_multi',
        'p300_single', 'p300_multi', 'p1000_single'
    ]

    for m in models:
        robot.reset()
        left = instruments._create_pipette_from_config(
            config=pipette_config.load(m + '_v1'),
            mount='left')
        right = instruments._create_pipette_from_config(
            config=pipette_config.load(m + '_v1.3'),
            mount='right')

        # the difference between v1 and v1.3 is that the plunger's travel
        # distance extended, allowing greater ranges for aspirate/dispense
        # and blow-out. Test that all v1.3 pipette have larger travel thant v1
        left_poses = left.plunger_positions
        left_diff = left_poses['top'] - left_poses['blow_out']
        right_poses = right.plunger_positions
        right_diff = right_poses['top'] - right_poses['blow_out']
        assert right_diff > left_diff


def test_pipette_models():
    robot.reset()
    p = instruments.P10_Single(mount='left')
    assert p.channels == 1
    assert p.max_volume > 10
    p = instruments.P10_Multi(mount='right')
    assert p.channels == 8
    assert p.max_volume > 10

    robot.reset()
    p = instruments.P50_Single(mount='left')
    assert p.channels == 1
    assert p.max_volume > 50
    p = instruments.P50_Multi(mount='right')
    assert p.channels == 8
    assert p.max_volume > 50

    robot.reset()
    p = instruments.P300_Single(mount='left')
    assert p.channels == 1
    assert p.max_volume > 300
    p = instruments.P300_Multi(mount='right')
    assert p.channels == 8
    assert p.max_volume > 300

    robot.reset()
    p = instruments.P1000_Single(mount='left')
    assert p.channels == 1
    assert p.max_volume > 1000


def test_pipette_max_deck_height():
    robot.reset()
    tallest_point = robot._driver.homed_position['Z']
    p = instruments.P300_Single(mount='left')
    assert p._max_deck_height() == tallest_point

    for tip_length in [10, 25, 55, 100]:
        p._add_tip(length=tip_length)
        assert p._max_deck_height() == tallest_point - tip_length
        p._remove_tip(length=tip_length)


def test_retract():
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    p300 = instruments.P300_Single(mount='left')
    from opentrons.drivers.smoothie_drivers.driver_3_0 import HOMED_POSITION

    p300.move_to(plate[0].top())

    assert p300.previous_placeable == plate[0]
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300)
    assert current_pos[2] == plate[0].top()[1][2]

    p300.retract()

    assert p300.previous_placeable is None
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300.instrument_mover)
    assert current_pos[2] == HOMED_POSITION['A']


def test_aspirate_move_to():
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

    assert (current_pos == (7.847594, 0.0, 0.0)).all()

    current_pos = pose_tracker.absolute(robot.poses, p300)
    assert isclose(current_pos, (175.34,  127.94,   10.5)).all()


def test_dispense_move_to():
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
    assert (current_pos == (2.5, 0.0, 0.0)).all()

    current_pos = pose_tracker.absolute(robot.poses, p300)
    assert isclose(current_pos, (175.34,  127.94,   10.5)).all()


def test_trough_move_to():
    from opentrons.instruments.pipette_config import Y_OFFSET_MULTI
    robot.reset()
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    p300 = instruments.P300_Single(
                   mount='left',
                   tip_racks=[tip_rack])

    trough = containers_load(robot, 'trough-12row', '1')
    p300.pick_up_tip()
    p300.move_to(trough)
    current_pos = pose_tracker.absolute(robot.poses, p300)

    assert isclose(current_pos, (14.34, 7.75 + 35 + Y_OFFSET_MULTI, 40)).all()


def test_delay_calls(monkeypatch):
    from opentrons import robot
    from opentrons.instruments import pipette
    robot.reset()
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

    monkeypatch.setattr(robot, 'pause', mock_pause)
    monkeypatch.setattr(robot, 'resume', mock_resume)
    monkeypatch.setattr(pipette, '_sleep', mock_sleep)

    p300.delay(seconds=4, minutes=1)

    assert 'pause' in cmd
    assert 'sleep 64.0' in cmd
    assert 'resume' in cmd


def test_drop_tip_in_trash(virtual_smoothie_env, monkeypatch):
    from opentrons import robot, labware
    from opentrons.instruments.pipette import Pipette
    robot.reset()
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


def test_fallback_config_file():
    from opentrons.instruments.pipette_config import \
        _create_config_from_dict, fallback_configs

    pipette_dict = {
        'ulPerMm': 123,
        'tipLength': 321,
        'channels': 4
    }

    for model, config in fallback_configs.items():
        new_config = _create_config_from_dict(pipette_dict, model)
        assert new_config.ul_per_mm == 123
        assert new_config.tip_length == 321
        assert new_config.channels == 4
        assert new_config.name == config.name
        assert new_config.pick_up_current == config.pick_up_current
        assert new_config.plunger_positions == config.plunger_positions


def test_json_and_fallback_configs_match():
    from opentrons.instruments.pipette_config import \
        select_config, fallback_configs

    for model, config_fallback in fallback_configs.items():
        config_from_json = select_config(model)
        assert config_from_json == config_fallback
