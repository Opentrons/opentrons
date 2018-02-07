import sys

from opentrons.robot.robot import Robot
from opentrons.instruments import pipette_config
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

    def P10_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None):

        config = pipette_config.load('p10_single')

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate)

    def P10_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None):

        config = pipette_config.load('p10_multi')

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate)

    def P300_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None):

        config = pipette_config.load('p300_single')

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate)

    def P300_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None):

        config = pipette_config.load('p300_multi')

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate)

    def Magbead(self, *args, **kwargs):
        return inst.Magbead(self.robot, *args, **kwargs)

    def TemperaturePlate(self,  *args, **kwargs):
        return inst.TemperaturePlate(self.robot, *args, **kwargs)

    def _create_pipette_from_config(
            self,
            config,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None):

        p = self.Pipette(
            mount=mount,
            name=config.name,
            trash_container=trash_container,
            tip_racks=tip_racks,
            channels=config.channels,
            ul_per_mm=config.ul_per_mm,
            aspirate_flow_rate=config.aspirate_flow_rate,
            dispense_flow_rate=config.dispense_flow_rate)

        p.plunger_positions = config.plunger_positions.copy()
        p.set_pick_up_current(config.pick_up_current)
        return p


instruments = InstrumentsWrapper(robot)
containers = ContainersWrapper(robot)

__all__ = [containers, instruments, robot, reset, __version__]
