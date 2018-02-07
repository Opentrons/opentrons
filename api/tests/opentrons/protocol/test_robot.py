import pytest

from opentrons.containers import load as containers_load
from opentrons.instruments import pipette
from opentrons.robot.robot import Robot
from opentrons.trackers import pose_tracker
from opentrons.util import vector
from numpy import isclose
from unittest import mock

SMOOTHIE_VERSION = 'edge-1c222d9NOMSD'


@pytest.fixture
def robot(virtual_smoothie_env):
    robot = Robot()
    robot.reset()
    robot.connect(options={'firmware': SMOOTHIE_VERSION})
    robot.home(enqueue=False)

    return robot


def test_pos_tracker_persistance(robot):
    p200 = pipette.Pipette(
        robot, mount='left', name='my-fancy-pancy-pipette'
    )
    plate = containers_load(robot, 'trough-12row', '5')
    # TODO(artyom, 20171030): re-visit once z-value is back into container data
    assert robot.max_placeable_height_on_deck(plate) == 40.0

    robot.poses = p200._move(robot.poses, x=10, y=10, z=10)
    robot.calibrate_container_with_instrument(plate, p200, save=False)

    # TODO(artyom, 20171030): re-visit once z-value is back into container data
    assert robot.max_placeable_height_on_deck(plate) == 10.0


def test_calibrated_max_z(robot):

    pipette.Pipette(
        robot, mount='left', name='my-fancy-pancy-pipette'
    )
    assert robot.max_deck_height() == 63
    # plate = containers_load(robot, '96-flat', '1')
    # TODO(artyom, 20171030): re-visit once z-value is back into container data
    # assert robot.max_deck_height() == 10.5

    # robot.move_head(x=10, y=10)
    # robot.calibrate_container_with_instrument(plate, p200, save=False)

    # TODO(artyom, 20171030): re-visit once z-value is back into container data
    # assert robot.max_deck_height() == 10.5


def test_get_serial_ports_list(robot, monkeypatch):
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')
    assert 'Virtual Smoothie' not in robot.get_serial_ports_list()
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    assert 'Virtual Smoothie' in robot.get_serial_ports_list()


# TODO(artyom, 20171030): confirm desired behavior and remove if needed
# def test_firmware_verson(robot):
#     assert SMOOTHIE_VERSION == robot._driver.firmware_version


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


def test_comment(robot):
    robot.clear_commands()
    robot.comment('hello')
    assert robot.commands() == ['hello']


# TODO(artyom, 20171030): confirm desired behavior and remove if needed
# def test_home_after_disconnect(robot):
#     robot._driver.connection = None

#     with pytest.raises(RuntimeError):
#         robot.home()


def test_create_arc(robot):
    from opentrons.robot.robot import TIP_CLEARANCE

    p200 = pipette.Pipette(
        robot, mount='left', name='my-fancy-pancy-pipette'
    )
    plate = containers_load(robot, '96-flat', '1')
    plate2 = containers_load(robot, '96-flat', '2')
    robot.poses = p200._move(robot.poses, x=10, y=10, z=10)
    robot.calibrate_container_with_instrument(plate, p200, save=False)

    res = robot._create_arc((0, 0, 0), plate[0])
    # TODO(artyom 20171030): confirm expected values are correct after merging
    # calibration work
    expected = [
        {'z': robot.max_deck_height() + TIP_CLEARANCE},
        {'x': 0, 'y': 0},
        {'z': 0}
    ]
    assert res == expected

    robot.poses = p200._move(robot.poses, x=10, y=10, z=100)
    robot.calibrate_container_with_instrument(
        plate2, p200, save=False
    )
    res = robot._create_arc((0, 0, 0), plate2[0])

    # TODO(artyom 20171030): confirm expected values are correct after merging
    # calibration work
    expected = [
        {'z': robot.max_deck_height() + TIP_CLEARANCE},
        {'x': 0, 'y': 0},
        {'z': 0}
    ]
    assert res == expected


# TODO(artyom, 20171030): the new driver doesn't have this functionality
# def test_disconnect(robot):
#     robot.disconnect()
#     assert not robot.is_connected


# TODO(artyom, 20171030): the new driver doesn't have this functionality
# consider removing the test
# def test_get_connected_port(robot):
#     res = robot.get_connected_port()
#     assert res == drivers.VIRTUAL_SMOOTHIE_PORT


def test_robot_move_to(robot):
    p200 = pipette.Pipette(robot, mount='right', name='pipette')
    robot.move_to(instrument=p200, location=(robot._deck, (100, 0, 0)))
    assert isclose(
        pose_tracker.absolute(
            robot.poses,
            p200),
        (100, 0, 0)
    ).all()


def test_move_head(robot):
    robot.move_head(x=100, y=0)
    assert isclose(
        pose_tracker.absolute(
            robot.poses,
            robot.gantry)[:2],
        (100, 0, 0)[:2]
    ).all()


# TODO(artyom 20171030): revise tracking status of homed axis
def test_home(robot):
    robot.disconnect()
    robot.connect()

    # Check that all axes are marked as not homed
    assert robot.axis_homed == {
        'x': False, 'y': False, 'z': False, 'a': False, 'b': False
    }

    # robot.clear_commands()
    # Home X & Y axes
    robot.home('xa')
    # self.assertDictEqual(robot.axis_homed, {
    #     'x': False, 'y': False, 'z': False, 'a': False, 'b': False
    # })

    # Verify X & Y axes are marked as homed
    # assert robot.axis_homed == {
    #     'x': True, 'y': False, 'z': False, 'a': True, 'b': False
    # }

    # # Home all axes
    # robot.home()

    # # Verify all axes are marked as homed
    # self.assertDictEqual(robot.axis_homed, {
    #     'x': True, 'y': True, 'z': True, 'a': True, 'b': True
    # })


# TODO(artyom, 20171030): revisit this test after
# diagnostics has been scoped and planned
# def test_versions(robot):
#     res = robot.versions()
#     expected = {
#         'config': {
#             'version': 'v2.0.0',
#             'compatible': True
#         },
#         'firmware': {
#             'version': self.smoothie_version,
#             'compatible': True
#         },
#         'ot_version': {
#             'version': 'one_pro_plus',
#             'compatible': True
#         }
#     }
#     assert res == expected

# TODO(artyom, 20171030): revisit this test after
# diagnostics has been scoped and planned
# def test_diagnostics(robot):
#     res = robot.diagnostics()
#     expected = {
#         'axis_homed': {
#             'x': True, 'y': True, 'z': True, 'a': True, 'b': True
#         },
#         'switches': {
#             'x': False,
#             'y': False,
#             'z': False,
#             'a': False,
#             'b': False
#         },
#         'steps_per_mm': {
#             'x': 80.0,
#             'y': 80.0
#         }
#     }
#     self.assertDictEqual(res, expected)

#     robot.disconnect()
#     robot.connect()
#     self.assertRaises(RuntimeWarning, robot.move_head, x=-199)
#     res = robot.diagnostics()
#     expected = {
#         'axis_homed': {
#             'x': False, 'y': False, 'z': False, 'a': False, 'b': False
#         },
#         'switches': {
#             'x': True,
#             'y': False,
#             'z': False,
#             'a': False,
#             'b': False
#         },
#         'steps_per_mm': {
#             'x': 80.0,
#             'y': 80.0
#         }
#     }
#     self.assertDictEqual(res, expected)

#     robot.home('x', enqueue=False)
#     res = robot.diagnostics()
#     expected = {
#         'axis_homed': {
#             'x': True, 'y': False, 'z': False, 'a': False, 'b': False
#         },
#         'switches': {
#             'x': False,
#             'y': False,
#             'z': False,
#             'a': False,
#             'b': False
#         },
#         'steps_per_mm': {
#             'x': 80.0,
#             'y': 80.0
#         }
#     }
#     assert res == expected


def test_get_motor_caching(robot):
    a_motor = robot.get_motor('a')
    assert a_motor == robot.get_motor('a')

    b_motor = robot.get_motor('b')
    assert b_motor == robot.get_motor('b')


def test_get_mosfet_caching(robot):
    m0 = robot.get_mosfet(0)
    assert m0 == robot.get_mosfet(0)
    m1 = robot.get_mosfet(1)
    assert m1 == robot.get_mosfet(1)


def test_drop_tip_default_trash(robot):
    tiprack = containers_load(robot, 'tiprack-200ul', '1')
    pip = pipette.Pipette(
        robot, name='P300', mount='right', tip_racks=[tiprack])

    trash_loc = vector.Vector([80.00, 80.00, 58.00])

    pip.pick_up_tip()

    with mock.patch.object(robot, 'move_to') as move_to:  # NOQA
        pip.drop_tip()

        move_to.assert_called_with(
            (robot.fixed_trash[0], trash_loc),
            instrument=pip,
            low_current_z=False,
            strategy='arc')
