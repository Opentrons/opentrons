from opentrons.containers import load as containers_load
from opentrons import instruments, robot
from opentrons.trackers import pose_tracker
from numpy import isclose


def test_new_containers():
    robot.reset()
    trash_box = containers_load(robot, 'trash-box', '1')
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    wheaton_vial_rack = containers_load(robot, 'wheaton_vial_rack', '4')
    tube_rack_80well = containers_load(robot, 'tube-rack-80well', '7')
    T75_flask = containers_load(robot, 'T75-flask', '2')
    T25_flask = containers_load(robot, 'T25-flask', '5')
    p300 = instruments.P300_Single(mount='right', tip_racks=[tip_rack])

    p300.pick_up_tip()
    p300.aspirate(100, wheaton_vial_rack[0]).dispense(trash_box)
    p300.aspirate(100, tube_rack_80well[0]).dispense(trash_box)
    p300.aspirate(100, T75_flask[0]).dispense(trash_box)
    p300.aspirate(100, T25_flask[0]).dispense(trash_box)
    # Note: test does not contain explicit assertions--checks whether or not an
    # example protocol raises exceptions. Consider revising/replacing


def test_fixed_trash():
    robot.reset()
    p300 = instruments.P300_Single(mount='right')

    p300.move_to(p300.trash_container)
    assert isclose(
            pose_tracker.absolute(robot.poses, p300),
            (345.0, 351.5, 85.0)).all()
