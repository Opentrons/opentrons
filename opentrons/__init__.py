import sys

from opentrons.robot.robot import Robot
from opentrons.robot.command import Command

from ._version import get_versions


version = sys.version_info[0:2]
if version < (3, 5):
    raise RuntimeError(
        'opentrons requires Python 3.5 or above, this is {0}.{1}'.format(
            version[0], version[1]))

robot = Robot()

__all__ = [Robot, Command, robot]


__version__ = get_versions()['version']
del get_versions
