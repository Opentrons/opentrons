import pytest

from numpy import isclose
from unittest import mock

from opentrons.legacy_api.containers import load as containers_load
from opentrons.legacy_api.containers import _look_up_offsets
from opentrons.trackers import pose_tracker
from opentrons.types import Point
from opentrons.util import vector


# TODO: Modify all calls to get a Well to use the `wells` method
# TODO: Modify calls as needed to check absolute position with refactor of
# TODO: pose_tracker
# TODO: Get rid of Vector


@pytest.mark.api1_only
def test_reset(robot, instruments, labware):
    """
    This test may need to be expanded to include various other conditions that
    should be reset.

    :param virtual_smoothie_env: pytest fixture to simulate Smoothie connection
    """
    # Not testing this one--this is needed to clean the robot singleton from
    # other tests. This is an inherent problem with the use of the singleton--
    # it entangles both runtime code and tests in unpredictable ways.

    lw = labware.load('opentrons-tiprack-300ul', '1')
    p = instruments.P300_Single(mount='right', tip_racks=[lw])
    p.pick_up_tip()
    assert p.tip_attached
    robot.reset()
    assert not p.tip_attached


@pytest.mark.api1_only
def test_configurable_mount_offsets(robot, instruments):
    def _test_offset(x, y, z):
        robot.config = robot.config._replace(
            mount_offset=(x, y, z))
        robot.reset()
        left = instruments.P300_Single(mount='left')
        right = instruments.P300_Single(mount='right')
        robot.home()
        left_pos = pose_tracker.absolute(robot.poses, left)
        right_pos = pose_tracker.absolute(robot.poses, right)
        assert left_pos[0] == (right_pos[0] + x)
        assert left_pos[1] == (right_pos[1] + y)
        assert left_pos[2] == (right_pos[2] + z)

    robot.config = robot.config._replace(
        instrument_offset={
            'right': {
                'single': (0.0, 0.0, 0.0),
                'multi': (0.0, 0.0, 0.0)
            },
            'left': {
                'single': (0.0, 0.0, 0.0),
                'multi': (0.0, 0.0, 0.0)
            }
        }
    )
    old_config = robot.config
    _test_offset(-34, 0, 0)
    _test_offset(-32, 0, 0)
    _test_offset(100, 3, 1.234)
    robot.config = old_config


@pytest.mark.api1_only
def test_pos_tracker_persistance(robot, instruments):
    p300 = instruments.P300_Single(mount='left')
    plate = containers_load(robot, 'trough-12row', '5')
    assert robot.max_placeable_height_on_deck(plate) == \
        plate[0].coordinates()[2]

    robot.poses = p300._move(robot.poses, x=10, y=10, z=10)
    robot.calibrate_container_with_instrument(plate, p300, save=False)

    assert robot.max_placeable_height_on_deck(plate) == 10.0


@pytest.mark.api1_only
def test_calibrated_max_z(robot, instruments):
    instruments.P300_Single(mount='left')
    assert robot.max_deck_height() == 82


@pytest.mark.api1_only
def test_get_serial_ports_list(robot, monkeypatch):
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')
    assert 'Virtual Smoothie' not in robot.get_serial_ports_list()
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    assert 'Virtual Smoothie' in robot.get_serial_ports_list()


@pytest.mark.api1_only
def test_add_container(robot):
    c1 = robot.add_container('96-flat', '1')
    trash = robot.fixed_trash
    res = robot.get_containers()
    expected = [c1, trash]
    assert set(res) == set(expected)

    c2 = robot.add_container('96-flat', '4', 'my-special-plate')
    res = robot.get_containers()
    expected = [c1, c2, trash]
    assert set(res) == set(expected)


@pytest.mark.api1_only
def test_comment(robot):
    robot.comment('hello')
    assert robot.commands() == ['hello']


@pytest.mark.api1_only
def test_create_arc(robot, instruments):
    from opentrons.legacy_api.robot.robot import (TIP_CLEARANCE_DECK,
                                                  TIP_CLEARANCE_LABWARE)

    p300 = instruments.P300_Single(mount='left')
    plate = containers_load(robot, '96-flat', '1')
    plate2 = containers_load(robot, '96-flat', '2')

    new_labware_height = 10
    robot.poses = p300._move(robot.poses, x=10, y=10, z=new_labware_height)
    robot.calibrate_container_with_instrument(plate, p300, save=False)

    trash_height = robot.max_placeable_height_on_deck(robot.fixed_trash)
    assert robot.max_deck_height() == trash_height

    res = robot._create_arc(p300, (0, 0, 0), plate[0])
    arc_top = robot.max_deck_height() + TIP_CLEARANCE_DECK
    expected = [
        {'z': arc_top},
        {'x': 0, 'y': 0},
        {'z': 0}
    ]
    assert res == expected

    res = robot._create_arc(p300, (0, 0, 0), plate[1])
    arc_top = robot.max_placeable_height_on_deck(plate) + TIP_CLEARANCE_LABWARE
    expected = [
        {'z': arc_top},
        {'x': 0, 'y': 0},
        {'z': 0}
    ]
    assert res == expected

    new_labware_height = 200
    robot.poses = p300._move(robot.poses, x=10, y=10, z=new_labware_height)
    robot.calibrate_container_with_instrument(plate2, p300, save=False)

    assert robot.max_deck_height() == new_labware_height

    res = robot._create_arc(p300, (0, 0, 0), plate2[0])
    arc_top = p300._max_deck_height()
    expected = [
        {'z': arc_top},
        {'x': 0, 'y': 0},
        {'z': 0}
    ]
    assert res == expected


@pytest.mark.api1_only
def test_robot_move_to(robot, instruments):
    robot.reset()
    robot.home()
    p300 = instruments.P300_Single(mount='right')
    robot.move_to((robot._deck, (100, 0, 0)), p300)
    assert isclose(
        pose_tracker.absolute(
            robot.poses,
            p300),
        (100, 0, 0)
    ).all()


@pytest.mark.api1_only
def test_move_head(robot):
    robot.move_head(x=100, y=0)
    assert isclose(
        pose_tracker.absolute(
            robot.poses,
            robot.gantry)[:2],
        (100, 0, 0)[:2]
    ).all()


@pytest.mark.xfail
def test_drop_tip_default_trash(robot, instruments):
    tiprack = containers_load(robot, 'tiprack-200ul', '1')
    pip = instruments.P300_Single(mount='right', tip_racks=[tiprack])

    trash_loc = vector.Vector([80.00, 80.00, 80.00])

    pip.pick_up_tip()

    with mock.patch.object(robot, 'move_to') as move_to:  # NOQA
        pip.drop_tip()

        move_to.assert_called_with(
            (robot.fixed_trash[0], trash_loc),
            instrument=pip,
            strategy='arc')


@pytest.mark.api1_only
def test_calibrate_labware(robot, instruments, labware, monkeypatch):
    import tempfile
    temp = tempfile.mkdtemp()
    monkeypatch.setenv('USER_DEFN_ROOT', temp)

    plate = labware.load('96-flat', '1')
    pip = instruments.P300_Single(mount='right')

    old_x, old_y, old_z = pose_tracker.absolute(robot.poses, plate[0])

    pip.move_to(plate[0])
    robot.poses = pip._jog(robot.poses, 'x', 1)
    robot.poses = pip._jog(robot.poses, 'y', 2)
    robot.poses = pip._jog(robot.poses, 'z', -3)
    robot.calibrate_container_with_instrument(plate, pip, save=False)
    new_pose = pose_tracker.absolute(robot.poses, plate[0])

    assert isclose(new_pose, (old_x + 1, old_y + 2, old_z - 3)).all()


@pytest.mark.api1_only
def test_calibrate_multiple(robot, instruments, labware, offsets_tempdir):
    # Note: labware_name must be a v2 labware definition
    labware_name = 'agilent_1_reservoir_290ml'

    reservoir1 = labware.load(labware_name, '1')
    reservoir2 = labware.load(labware_name, '2')

    pip = instruments.P300_Single(mount='right')

    old_x1, old_y1, old_z1 = pose_tracker.absolute(robot.poses, reservoir1[0])
    old_x2, old_y2, old_z2 = pose_tracker.absolute(robot.poses, reservoir2[0])

    pip.move_to(reservoir1[0])
    delta_x1, delta_y1, delta_z1 = (1, 2, -3)
    robot.poses = pip._jog(robot.poses, 'x', delta_x1)
    robot.poses = pip._jog(robot.poses, 'y', delta_y1)
    robot.poses = pip._jog(robot.poses, 'z', delta_z1)
    robot.calibrate_container_with_instrument(reservoir1, pip, save=True)

    # Check pose tree, also check data on disk
    new_pose1 = pose_tracker.absolute(robot.poses, reservoir1[0])
    new_pose2 = pose_tracker.absolute(robot.poses, reservoir2[0])

    assert isclose(new_pose1, (
        old_x1 + delta_x1, old_y1 + delta_y1, old_z1 + delta_z1)).all()
    assert isclose(new_pose2, (
        old_x2 + delta_x1, old_y2 + delta_y1, old_z2 + delta_z1)).all()

    lw_hash = reservoir1.properties.get('labware_hash')
    new_offset1 = _look_up_offsets(lw_hash)
    expected1 = Point(delta_x1, delta_y1, delta_z1)
    assert isclose(new_offset1, expected1).all()

    pip.move_to(reservoir2[0])
    robot.poses = pip._jog(robot.poses, 'x', -1 * delta_x1)
    robot.poses = pip._jog(robot.poses, 'y', -1 * delta_y1)
    robot.poses = pip._jog(robot.poses, 'z', -1 * delta_z1)
    robot.calibrate_container_with_instrument(reservoir2, pip, save=True)

    # Check pose tree, also check data on disk
    new_pose1 = pose_tracker.absolute(robot.poses, reservoir1[0])
    new_pose2 = pose_tracker.absolute(robot.poses, reservoir2[0])

    assert isclose(new_pose1, (
        old_x1, old_y1, old_z1)).all()
    assert isclose(new_pose2, (
        old_x2, old_y2, old_z2)).all()

    lw_hash = reservoir1.properties.get('labware_hash')
    new_offset2 = _look_up_offsets(lw_hash)
    expected2 = Point(0, 0, 0)
    assert isclose(new_offset2, expected2).all()


@pytest.mark.api1_only
def test_cache_instruments(robot, monkeypatch):
    # Test that smoothie runtime configs are set at run when
    # cache_instrument_models is called
    fake_pip = {'left': {
                    'model': 'p10_single_v1.3',
                    'id': 'FakePip2',
                    'name': 'p10_single'},
                'right': {
                    'model': 'p300_single_v2.0',
                    'id': 'FakePip',
                    'name': 'p300_single_gen2'}}
    monkeypatch.setattr(robot, 'model_by_mount', fake_pip)

    def fake_func1(value):
        return value

    def fake_func2(mount, value):
        return mount, value

    def fake_read(mount):
        return robot.model_by_mount[mount]['model']
    # With nothing specified at init or expected, we should have nothing
    robot._driver.update_steps_per_mm = mock.Mock(fake_func1)
    robot._driver.update_pipette_config = mock.Mock(fake_func2)
    monkeypatch.setattr(robot._driver, 'read_pipette_model', fake_read)
    robot.cache_instrument_models()
    steps_mm_calls = [mock.call({'B': 768}), mock.call({'C': 3200})]
    pip_config_calls = [
        mock.call('Z', {'home': 220}),
        mock.call('A', {'home': 172.15}),
        mock.call('B', {'max_travel': 30}),
        mock.call('C', {'max_travel': 60})]
    robot._driver.update_steps_per_mm.assert_has_calls(
        steps_mm_calls, any_order=True)
    robot._driver.update_pipette_config.assert_has_calls(
        pip_config_calls, any_order=True)
