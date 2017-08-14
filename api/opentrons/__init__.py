import csv  # Needed for customers
import sys

from opentrons.robot.robot import Robot
from opentrons import instruments as inst, containers as cnt

from ._version import get_versions


version = sys.version_info[0:2]
if version < (3, 5):
    raise RuntimeError(
        'opentrons requires Python 3.5 or above, this is {0}.{1}'.format(
            version[0], version[1]))


robot = Robot()


def reset():
    global robot
    robot = Robot()
    return robot


class ContainersWrapper(object):
    def __init__(self, robot):
        self.robot = robot

    def create(self, *args, **kwargs):
        return cnt.create(*args, **kwargs)

    def list(self, *args, **kwargs):
        return cnt.list(*args, **kwargs)

    def load(self, *args, **kwargs):
        return cnt.load(self.robot, *args, **kwargs)


class InstrumentsWrapper(object):
    def __init__(self, robot):
        self.robot = robot

    def Pipette(self, *args, **kwargs):
        return inst.Pipette(self.robot, *args, **kwargs)

    def Magbead(self, *args, **kwargs):
        return inst.Magbead(self.robot, *args, **kwargs)


instruments = InstrumentsWrapper(robot)
containers = ContainersWrapper(robot)

__all__ = [containers, csv, instruments, robot, reset]


__version__ = get_versions()['version']
del get_versions
