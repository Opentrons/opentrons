# import pytest

# from opentrons.util import calibration_functions as cf
# from opentrons.instruments import Pipette
# from opentrons.containers import load as containers_load
# from opentrons.trackers.pose_tracker import Point, add, absolute, translate
# from opentrons.robot.robot import Robot
# from numpy import isclose


# @pytest.fixture
# def poses(robot):
#     containers_load(robot, '96-flat', 'A1')
#     Pipette(robot, mount='left')
#     return robot.poses


# @pytest.fixture
# def p200(robot):
#     return Pipette(robot, mount='right')


# @pytest.fixture
# def plate(robot):
#     return containers_load(robot, '96-flat', 'A1')


# def test_add_container_to_deck(robot):
#     plate = containers_load(robot, '96-flat', 'A1')
#     assert plate in robot.poses


# def test_calibrate_plate(robot, tmpdir):
#     # Load container | Test positions of container and wells
#     plate = containers_load(robot, '96-flat', 'A1')
#     poses = robot.poses
#     assert isclose(poses[plate].transform, translate(Point(21.24, 24.34, 0.0))).all()      # NOQA
#     assert isclose(poses[plate[2]].transform, translate(Point(39.24, 24.34, 10.5))).all()  # NOQA
#     assert isclose(poses[plate[5]].transform, translate(Point(66.24, 24.34, 10.5))).all()  # NOQA

#     cf.calibrate_container_with_delta(
#         plate, robot.pose_tracker, 1, 3, 4, True
#     )
#     assert robot.pose_tracker[plate].position == Vector(22.24, 27.34, 4.0)
#     assert robot.pose_tracker[plate[2]].position == Vector(40.24, 27.34, 14.5)
#     assert robot.pose_tracker[plate[5]].position == Vector(67.24, 27.34, 14.5)


# def test_add_pipette(robot):
#     p200 = Pipette(robot, mount='left')
#     assert p200 in robot.pose_tracker


# def test_pipette_movement(robot):
#     p200 = Pipette(robot, mount='left')
#     plate = containers_load(robot, '96-flat', 'A1')
#     p200.move_to(plate[2])
#     assert robot.pose_tracker[p200].position == Vector(39.24, 24.34, 10.5)


# def test_max_z(robot):
#     containers_load(robot, '96-flat', 'A1')
#     deck = robot._deck
#     assert robot.pose_tracker.max_z_in_subtree(deck) == 10.5

#     plate = containers_load(robot, 'small_vial_rack_16x45', 'B1')
#     assert robot.pose_tracker.max_z_in_subtree(deck) == 45

#     robot.pose_tracker.translate_object(plate, 0, 0, 1)
#     assert robot.pose_tracker.max_z_in_subtree(deck) == 46


# def test_get_object_children(robot):
#     plate = containers_load(robot, '96-flat', 'B2')
#     children = robot.pose_tracker.get_object_children(plate)
#     children == plate.get_children_list()


# def test_get_objects_in_subtree(robot):
#     plate = containers_load(robot, '96-flat', 'A1')
#     EXPECTED_SUBTREE = [plate] +\
#                        [well for well in plate] +\
#                        [robot._deck] +\
#                        [slot for slot in robot._deck]
#     deck_subtree = robot.pose_tracker.get_objects_in_subtree(robot._deck)
#     assert len(deck_subtree) == len(EXPECTED_SUBTREE)
#     assert set(deck_subtree) - set(EXPECTED_SUBTREE) == set()

#     trough = containers_load(robot, 'trough-12row', 'B1')
#     EXPECTED_SUBTREE += [trough] + [well for well in trough]
#     deck_subtree = robot.pose_tracker.get_objects_in_subtree(robot._deck)
#     assert len(deck_subtree) == len(EXPECTED_SUBTREE)
#     assert set(deck_subtree) - set(EXPECTED_SUBTREE) == set()


# def test_faulty_set(poses, robot):
#     with pytest.raises(TypeError):
#         poses[robot._deck] = 10


# def test_faulty_access(poses):
#     p300 = Pipette(Robot(), mount='left')
#     with pytest.raises(KeyError):
#         poses[p300]


# def test_relative_object_position(plate, p200, robot):
#     robot.move_head(x=10, y=30, z=10)
#     rel_pos = robot.pose_tracker.relative_object_position(p200, plate)
#     assert rel_pos == Vector(-11.24, 5.66, 10)


# def test_get_object_ancestors(robot, plate):
#     ps = robot.pose_tracker  # type: PoseTracker
#     ancestors = ps._get_transform_sequence(plate[2])  # find ancestor posess of arbitrary well
#     assert ancestors == [ps[robot._deck], ps[robot._deck['A1']], ps[plate], ps[plate[2]]]
