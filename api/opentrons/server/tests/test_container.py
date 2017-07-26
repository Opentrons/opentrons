import os

from opentrons.server import robot_container

protocol_text = None
protocol_file = os.path.join(
        os.path.dirname(__file__), 'data', 'dinosaur.py')

with open(protocol_file) as file:
    protocol_text = ''.join(list(file))


def test_load_from_text():
    rc = robot_container.RobotContainer()
    robot = rc.load_protocol(protocol_text)
    assert len(robot.commands()) == 101


# TODO: How do we treat _globals and _locals between the runs?
def test_load_from_file():
    rc = robot_container.RobotContainer()
    robot = rc.load_protocol_file(protocol_file)
    # assert len(robot.commands()) == 101
