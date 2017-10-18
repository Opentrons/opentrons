import pytest

from opentrons.util import calibration_functions as cf
from opentrons.instruments import Pipette
from opentrons.containers import load as containers_load
from opentrons.trackers.pose_tracker import Pose, PoseTracker
from opentrons.robot.robot import Robot
from opentrons.util.vector import Vector

from numpy import array, isclose


@pytest.fixture
def robot():
    robot = Robot()
    robot._driver.home('za')
    robot._driver.home('bcx')
    robot._driver.home()
    return robot


@pytest.fixture
def pose_tracker(robot):
    containers_load(robot, '96-flat', 'A1')
    Pipette(robot, mount='left')
    return robot.pose_tracker


@pytest.fixture
def p200(robot):
    return Pipette(robot, mount='right')


@pytest.fixture
def plate(robot):
    return containers_load(robot, '96-flat', 'A1')


def test_add_container_to_deck(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate in robot.pose_tracker


# def test_calibrate_plate(robot, tmpdir):
#     # Load container | Test positions of container and wells
#     plate = containers_load(robot, '96-flat', 'A1')
#     assert robot.pose_tracker[plate].position == Vector(14.34, 11.24, 0.0)
#     assert robot.pose_tracker[plate[2]].position == Vector(14.34, 24.34, 10.5)
#     assert robot.pose_tracker[plate[5]].position == Vector(66.24, 24.34, 10.5)

#     cf.calibrate_container_with_delta(
#         plate, robot.pose_tracker, 1, 3, 4, True
#     )
#     assert robot.pose_tracker[plate].position == Vector(22.24, 27.34, 4.0)
#     assert robot.pose_tracker[plate[2]].position == Vector(40.24, 27.34, 14.5)
#     assert robot.pose_tracker[plate[5]].position == Vector(67.24, 27.34, 14.5)


def test_add_pipette(robot):
    p200 = Pipette(robot, mount='left')
    assert p200 in robot.pose_tracker


# def test_max_z(robot):
#     containers_load(robot, '96-flat', 'A1')
#     deck = robot._deck
#     assert robot.pose_tracker.max_z_in_subtree(deck) == 10.5

#     plate = containers_load(robot, 'small_vial_rack_16x45', 'B1')
#     assert robot.pose_tracker.max_z_in_subtree(deck) == 45

#     robot.pose_tracker.translate_object(plate, 0, 0, 1)
#     assert robot.pose_tracker.max_z_in_subtree(deck) == 46


def test_get_object_children(robot):
    plate = containers_load(robot, '96-flat', 'B2')
    children = robot.pose_tracker.get_object_children(plate)
    children == plate.get_children_list()


def test_pose_equality():
    pose1 = Pose(5, 10, 20)
    pose2 = Pose(1, 2, 3)
    assert not pose1 == pose2

    pose3 = pose2 * [4, 8, 17, 1]
    assert pose1 == pose3


def test_get_objects_in_subtree(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    EXPECTED_SUBTREE = [plate] +\
                       [well for well in plate] +\
                       [robot._deck] +\
                       [slot for slot in robot._deck]
    deck_subtree = robot.pose_tracker.get_objects_in_subtree(robot._deck)
    assert len(deck_subtree) == len(EXPECTED_SUBTREE)
    assert set(deck_subtree) - set(EXPECTED_SUBTREE) == set()

    trough = containers_load(robot, 'trough-12row', 'B1')
    EXPECTED_SUBTREE += [trough] + [well for well in trough]
    deck_subtree = robot.pose_tracker.get_objects_in_subtree(robot._deck)
    assert len(deck_subtree) == len(EXPECTED_SUBTREE)
    assert set(deck_subtree) - set(EXPECTED_SUBTREE) == set()


def test_faulty_set(pose_tracker, robot):
    with pytest.raises(TypeError):
        pose_tracker[robot._deck] = 10


def test_faulty_access(pose_tracker):
    p300 = Pipette(Robot(), mount='left')
    with pytest.raises(KeyError):
        pose_tracker[p300]


def test_basics(pose_tracker):
    tracker = PoseTracker()
    transform = array([
        [1, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 3, 0],
        [0, 0, 0, 1]
    ])

    tracker.create_root_object('root1', 0, 0, 0, transform=transform)
    tracker.track_object('root1', 'child1-1', 11, 12, 13)
    assert tracker['child1-1'].position == (11.0, 24.0, 39.0)
    assert tracker.relative_object_position(
                'root1',
                'child1-1'
            ) == (11.0, 6.0, 4.333333333333333)
    assert tracker.relative_object_position(
                'child1-1',
                'root1'
            ) == (-11.0, -6.0, -4.333333333333333)


def test_relative_object_position():
    tracker = PoseTracker()
    tracker.create_root_object('root1', 0, 0, 0)
    tracker.track_object('root1', 'child1-1', 10, 11, 12)
    res1 = tracker.relative_object_position('child1-1', 'root1')
    assert res1 == (-10, -11, -12)

    tracker.create_root_object('root2', 1, 2, 3)
    res2 = tracker.relative_object_position('root1', 'root2')
    assert res2 == (1.0, 2.0, 3.0)

    transform = array([
        [1, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 3, 0],
        [0, 0, 0, 1]
    ])
    tracker.track_object('root2', 'child2-1', 10, 11, 12, transform=transform)

    tracker.track_object('child2-1', 'child2-1-1', 1, 1, 1)
    res3 = tracker.relative_object_position('child2-1', 'child2-1-1')
    assert res3 == (1.0, 0.5, 0.33333333333333304)

    res4 = tracker.relative_object_position('root2', 'child2-1-1')
    assert res4 == (11.0, 6.0, 4.333333333333333)


def test_robot_relative_object_position(plate, p200, robot):
    p200.move_to(plate[0])
    rel_pos = robot.pose_tracker.relative_object_position(p200, plate[0])
    assert isclose(rel_pos, (0.0, 0.0, 0.0)).all()


def test_get_object_ancestors(robot, plate):
    ps = robot.pose_tracker  # type: PoseTracker
    ancestors = ps._get_transform_sequence(plate[2])  # find ancestor posess of arbitrary well
    objects = ['world', robot._deck, robot._deck['A1'], plate, plate[2]]
    assert ancestors == [ps.relative(o) for o in objects]
