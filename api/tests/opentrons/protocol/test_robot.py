from opentrons.containers import load as containers_load
from opentrons import robot, instruments
from opentrons.trackers import pose_tracker
from opentrons.util import vector
from numpy import isclose
from unittest import mock


def test_pos_tracker_persistance(virtual_smoothie_env):
    robot.reset()
    p300 = instruments.P300_Single(mount='left')
    plate = containers_load(robot, 'trough-12row', '5')
    # TODO(artyom, 20171030): re-visit once z-value is back into container data
    assert robot.max_placeable_height_on_deck(plate) == 40.0

    robot.poses = p300._move(robot.poses, x=10, y=10, z=10)
    robot.calibrate_container_with_instrument(plate, p300, save=False)

    # TODO(artyom, 20171030): re-visit once z-value is back into container data
    assert robot.max_placeable_height_on_deck(plate) == 10.0


def test_calibrated_max_z(virtual_smoothie_env):
    robot.reset()

    instruments.P300_Single(mount='left')
    assert robot.max_deck_height() == 85


def test_get_serial_ports_list(monkeypatch):
    robot.reset()
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')
    assert 'Virtual Smoothie' not in robot.get_serial_ports_list()
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    assert 'Virtual Smoothie' in robot.get_serial_ports_list()


def test_add_container(virtual_smoothie_env):
    robot.reset()
    c1 = robot.add_container('96-flat', '1')
    trash = robot.fixed_trash
    res = robot.get_containers()
    expected = [c1, trash]
    assert set(res) == set(expected)

    c2 = robot.add_container('96-flat', '4', 'my-special-plate')
    res = robot.get_containers()
    expected = [c1, c2, trash]
    assert set(res) == set(expected)


def test_comment(virtual_smoothie_env):
    robot.reset()
    robot.clear_commands()
    robot.comment('hello')
    assert robot.commands() == ['hello']


def test_create_arc(virtual_smoothie_env):
    from opentrons.robot.robot import TIP_CLEARANCE_DECK, TIP_CLEARANCE_LABWARE
    robot.reset()

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


def test_robot_move_to(virtual_smoothie_env):
    robot.reset()
    robot.home()
    p300 = instruments.P300_Single(mount='right')
    print("before")
    robot.move_to((robot._deck, (100, 0, 0)), p300)
    print("after")
    assert isclose(
        pose_tracker.absolute(
            robot.poses,
            p300),
        (100, 0, 0)
    ).all()


def test_move_head(virtual_smoothie_env):
    robot.reset()
    robot.move_head(x=100, y=0)
    assert isclose(
        pose_tracker.absolute(
            robot.poses,
            robot.gantry)[:2],
        (100, 0, 0)[:2]
    ).all()


def test_get_motor_caching(virtual_smoothie_env):
    robot.reset()
    a_motor = robot.get_motor('a')
    assert a_motor == robot.get_motor('a')

    b_motor = robot.get_motor('b')
    assert b_motor == robot.get_motor('b')


def test_drop_tip_default_trash(virtual_smoothie_env):
    robot.reset()
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
