from opentrons.robot.robot import Robot
from opentrons.robot.command import Command

robot = Robot()

__all__ = [Robot, Command, robot]

from ._version import get_versions
__version__ = get_versions()['version']
del get_versions
