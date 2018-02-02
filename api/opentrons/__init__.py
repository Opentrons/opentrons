import sys

from opentrons.robot.robot import Robot
from opentrons import instruments as inst, containers as cnt
from opentrons.data_storage import database_migration
from opentrons._version import __version__

version = sys.version_info[0:2]
if version < (3, 5):
    raise RuntimeError(
        'opentrons requires Python 3.5 or above, this is {0}.{1}'.format(
            version[0], version[1]))

database_migration.check_version_and_perform_necessary_migrations()
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

    def P10_Single(self, *args, **kwargs):
        kwargs.update({
            'channels': 1,
            'ul_per_mm': 0.617  # TODO (andy): should come from config
        })
        p = inst.Pipette(self.robot, *args, **kwargs)

        # TODO (andy): should come from config
        p.plunger_positions['top'] = 18
        p.plunger_positions['bottom'] = 2
        p.plunger_positions['blow_out'] = 0
        p.plunger_positions['drop_tip'] = -6
        p.set_pick_up_current(0.1)
        return p

    def P10_Multi(self, *args, **kwargs):
        kwargs.update({
            'channels': 8,
            'ul_per_mm': 0.617  # TODO (andy): should come from config
        })
        p = inst.Pipette(self.robot, *args, **kwargs)

        # TODO (andy): should come from config
        p.plunger_positions['top'] = 18
        p.plunger_positions['bottom'] = 2
        p.plunger_positions['blow_out'] = 0
        p.plunger_positions['drop_tip'] = -6
        p.set_pick_up_current(0.3)
        return p

    def P300_Single(self, *args, **kwargs):
        kwargs.update({
            'channels': 1,
            'ul_per_mm': 18.51  # TODO (andy): should come from config
        })
        p = inst.Pipette(self.robot, *args, **kwargs)

        # TODO (andy): should come from config
        p.plunger_positions['top'] = 18
        p.plunger_positions['bottom'] = 0
        p.plunger_positions['blow_out'] = -2
        p.plunger_positions['drop_tip'] = -3.5
        p.set_pick_up_current(0.1)
        return p

    def P300_Multi(self, *args, **kwargs):
        kwargs.update({
            'channels': 8,
            'ul_per_mm': 18.51  # TODO (andy): should come from config
        })
        p = inst.Pipette(self.robot, *args, **kwargs)
        p.plunger_positions['top'] = 18
        p.plunger_positions['bottom'] = 0
        p.plunger_positions['blow_out'] = -2
        p.plunger_positions['drop_tip'] = -5
        p.set_pick_up_current(0.3)  # TODO (andy): should come from config
        return p

    def Magbead(self, *args, **kwargs):
        return inst.Magbead(self.robot, *args, **kwargs)

    def TemperaturePlate(self,  *args, **kwargs):
        return inst.TemperaturePlate(self.robot, *args, **kwargs)


instruments = InstrumentsWrapper(robot)
containers = ContainersWrapper(robot)

__all__ = [containers, instruments, robot, reset, __version__]
