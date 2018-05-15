import sys

from opentrons.robot.robot import Robot
from opentrons.instruments import pipette_config
from opentrons import instruments as inst, containers as cnt
from opentrons.data_storage import database_migration
from opentrons._version import __version__
from opentrons.config import feature_flags as ff

version = sys.version_info[0:2]
if version < (3, 5):
    raise RuntimeError(
        'opentrons requires Python 3.5 or above, this is {0}.{1}'.format(
            version[0], version[1]))

if not ff.split_labware_definitions():
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

        pipette_model_version = self._retrieve_version_number(
            mount, 'p10_single')
        config = pipette_config.load(pipette_model_version)

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

        pipette_model_version = self._retrieve_version_number(
            mount, 'p10_multi')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate)

    def P50_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p50_single')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate)

    def P50_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p50_multi')
        config = pipette_config.load(pipette_model_version)

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

        pipette_model_version = self._retrieve_version_number(
            mount, 'p300_single')
        config = pipette_config.load(pipette_model_version)

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

        pipette_model_version = self._retrieve_version_number(
            mount, 'p300_multi')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate)

    def P1000_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p1000_single')
        config = pipette_config.load(pipette_model_version)

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

        if aspirate_flow_rate:
            config = config._replace(aspirate_flow_rate=aspirate_flow_rate)
        if dispense_flow_rate:
            config = config._replace(dispense_flow_rate=dispense_flow_rate)

        p = self.Pipette(
            model_offset=config.model_offset,
            mount=mount,
            name=config.name,
            trash_container=trash_container,
            tip_racks=tip_racks,
            channels=config.channels,
            ul_per_mm=config.ul_per_mm,
            aspirate_flow_rate=config.aspirate_flow_rate,
            dispense_flow_rate=config.dispense_flow_rate,
            plunger_current=config.plunger_current,
            drop_tip_current=config.drop_tip_current,
            plunger_positions=config.plunger_positions.copy(),
            fallback_tip_length=config.tip_length)  # TODO move to labware

        p.set_pick_up_current(config.pick_up_current)
        return p

    def _retrieve_version_number(self, mount, expected_model):
        # pass a default pipette model-version, for when robot is simulating
        # this allows any pipette to be simulated, regardless of what is
        # actually attached/cached on the robot's mounts
        default_version = expected_model + '_v1'
        pipettes_attached = robot.get_attached_pipettes(
            default={mount: {'model': default_version}})
        found_version = pipettes_attached[mount]['model']
        if not found_version:
            found_version = default_version

        # check that the model string is a substring of the version
        # eg: check that 'p10_single' is inside the found 'p10_single_v13'
        if expected_model not in found_version:
            raise TypeError(
                'Found unexpected Pipette attached: {}'.format(found_version))
        return found_version


instruments = InstrumentsWrapper(robot)
containers = ContainersWrapper(robot)
labware = ContainersWrapper(robot)

__all__ = [containers, instruments, labware, robot, reset, __version__]
