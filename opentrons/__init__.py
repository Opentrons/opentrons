from opentrons.robot.robot import Robot
from opentrons.robot.command import Command

__all__ = [Robot, Command]

from ._version import get_versions
__version__ = get_versions()['version']
del get_versions
