import sys

from opentrons.robot.robot import Robot
# from opentrons.robot.command import Command
from opentrons import instruments as inst, containers as cnt

from ._version import get_versions


version = sys.version_info[0:2]
if version < (3, 5):
    raise RuntimeError(
        'opentrons requires Python 3.5 or above, this is {0}.{1}'.format(
            version[0], version[1]))

robot = Robot()


class ContainersWrapper(object):
    def __init__(self, robot):
        self.robot = robot

    def load(self, *args, **kwargs):
        return cnt.load(self.robot, *args, **kwargs)


class InstrumentsWrapper(object):
    def __init__(self, robot):
        self.robot = robot

    def Pipette(self, *args, **kwargs):
        return inst.Pipette(self.robot, *args, **kwargs)

    def MagBead(self, name):
        pass


instruments = InstrumentsWrapper(robot)
containers = ContainersWrapper(robot)

# __all__ = [Robot, Command, robot]
__all__ = [containers, instruments, robot]


__version__ = get_versions()['version']
del get_versions
