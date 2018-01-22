from opentrons.containers import load as containers_load
from opentrons.instruments import pipette
from opentrons.trackers import pose_tracker
from numpy import isclose


def test_new_containers(robot):
    trash_box = containers_load(robot, 'trash-box', 'A1')
    tip_rack = containers_load(robot, 'tiprack-200ul', 'C1')
    wheaton_vial_rack = containers_load(robot, 'wheaton_vial_rack', 'A2')
    tube_rack_80well = containers_load(robot, 'tube-rack-80well', 'A3')
    T75_flask = containers_load(robot, 'T75-flask', 'B1')
    T25_flask = containers_load(robot, 'T25-flask', 'B2')
    p200 = pipette.Pipette(
        robot,
        mount='right',
        tip_racks=[tip_rack],
        name='test-pipette'
    )

    p200.pick_up_tip()
    p200.aspirate(100, wheaton_vial_rack[0]).dispense(trash_box)
    p200.aspirate(100, tube_rack_80well[0]).dispense(trash_box)
    p200.aspirate(100, T75_flask[0]).dispense(trash_box)
    p200.aspirate(100, T25_flask[0]).dispense(trash_box)


def test_fixed_trash(robot, dummy_db):
    p200 = pipette.Pipette(
        robot, mount='right', name='test-pipette'
    )
    trash = containers_load(robot, 'fixed-trash', 'C4')
    p200.move_to(trash[0])
    assert isclose(
            pose_tracker.absolute(robot.poses, p200),
            (345.0, 351.5, 110.0)).all()
