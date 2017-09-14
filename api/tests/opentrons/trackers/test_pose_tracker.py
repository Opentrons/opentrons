from opentrons.util import calibration_functions as cf
from opentrons.instruments import Pipette
from opentrons.containers import load as containers_load
from opentrons.util.testing.util import approx
from opentrons.trackers.pose_tracker import Pose


def test_add_container_to_deck(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate in robot.pose_tracker


def test_calibrate_plate(robot, tmpdir):
    # Load container | Test positions of container and wells
    plate = containers_load(robot, '96-flat', 'A1')
    assert approx(robot.pose_tracker[plate].position) == 45
    assert approx(robot.pose_tracker[plate].position) == approx(
        (21.24, 24.34, 0.0)
    )
    assert approx(robot.pose_tracker[plate[2]].position) == approx(
        (39.24, 24.34, 10.5)
    )
    assert approx(robot.pose_tracker[plate[5]].position) == approx(
        (66.24, 24.34, 10.5)
    )
    # Calibrate container with delta | Test is position was correctly adjusted
    cf.calibrate_container_with_delta(
        plate, robot.pose_tracker, 1, 3, 4, True
    )
    assert approx(robot.pose_tracker[plate].position) == approx(
        (22.24, 27.34, 4.0)
    )
    assert approx(robot.pose_tracker[plate[2]].position) == approx(
        (40.24, 27.34, 14.5)
    )
    assert approx(robot.pose_tracker[plate[5]].position) == approx(
        (67.24, 27.34, 14.5)
    )


def test_add_pipette(robot):
    p200 = Pipette(robot, 'a')
    assert p200 in robot.pose_tracker


def test_pipette_movement(robot):
    p200 = Pipette(robot, 'a')
    plate = containers_load(robot, '96-flat', 'A1')
    p200.move_to(plate[2])
    assert approx(robot.pose_tracker[p200].position) == approx(
        (39.24, 24.34, 10.5)
    )


def test_max_z(robot):
    containers_load(robot, '96-flat', 'A1')
    deck = robot._deck
    assert robot.pose_tracker.max_z_in_subtree(deck) == 10.5

    plate = containers_load(robot, 'small_vial_rack_16x45', 'B1')
    assert robot.pose_tracker.max_z_in_subtree(deck) == 45

    robot.pose_tracker.translate_object(plate, 0, 0, 1)
    assert robot.pose_tracker.max_z_in_subtree(deck) == 46


def test_get_object_children(robot):
    plate = containers_load(robot, '96-flat', 'B2')
    children = robot.pose_tracker.get_object_children(plate)
    children == plate.get_children_list()


def test_tree_printing(robot):
    containers_load(robot, 'trough-12row', 'B2')
    print_output = robot.pose_tracker.__str__()
    EXPECTED_OUTPUT = "\n\n'head'" \
               "\n\n\n<Deck>" \
               "\n\t<Deck><Slot A1>" \
               "\n\t<Deck><Slot A2>" \
               "\n\t<Deck><Slot A3>" \
               "\n\t<Deck><Slot B1>" \
               "\n\t<Deck><Slot B2>" \
               "\n\t\t<Deck><Slot B2><Container trough-12row>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A1>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A2>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A3>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A4>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A5>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A6>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A7>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A8>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A9>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A10>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A11>" \
               "\n\t\t\t<Deck><Slot B2><Container trough-12row><Well A12>" \
               "\n\t<Deck><Slot B3>" \
               "\n\t<Deck><Slot C1>" \
               "\n\t<Deck><Slot C2>" \
               "\n\t<Deck><Slot C3>" \
               "\n\t<Deck><Slot D1>" \
               "\n\t<Deck><Slot D2>" \
               "\n\t<Deck><Slot D3>" \
               "\n\t<Deck><Slot E1>" \
               "\n\t<Deck><Slot E2>" \
               "\n\t<Deck><Slot E3>\n"

    assert print_output == EXPECTED_OUTPUT


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


def test_clear_tracker(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate in robot.pose_tracker

    p200 = Pipette(robot, 'a')
    assert p200 in robot.pose_tracker

    p200.move_to(plate[2])
    assert approx(robot.pose_tracker[p200].position) == approx(
        (39.24, 24.34, 10.5)
    )

    robot.pose_tracker.clear()
    assert plate not in robot.pose_tracker
    assert p200 not in robot.pose_tracker
