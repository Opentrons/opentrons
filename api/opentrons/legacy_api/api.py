from . import robot, instruments as inst, containers as cnt
from .instruments import pipette_config

# Ignore the type here because well, this is exactly why this is the legacy_api
robot = robot.Robot()  # type: ignore


def reset():
    global robot
    robot = robot.Robot()
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
        """
        Deprecated -- do not use this constructor directly. Use the model-
        specific constructors available in this module.
        """
        return inst.Pipette(self.robot, *args, **kwargs)

    def P10_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p10_single')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume)

    def P10_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p10_multi')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume)

    def P50_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p50_single')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume)

    def P50_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p50_multi')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume)

    def P300_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p300_single')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume)

    def P300_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p300_multi')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume)

    def P1000_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        pipette_model_version = self._retrieve_version_number(
            mount, 'p1000_single')
        config = pipette_config.load(pipette_model_version)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume)

    def _create_pipette_from_config(
            self,
            config,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        if aspirate_flow_rate is not None:
            config = config._replace(aspirate_flow_rate=aspirate_flow_rate)
        if dispense_flow_rate is not None:
            config = config._replace(dispense_flow_rate=dispense_flow_rate)

        if min_volume is not None:
            config = config._replace(min_volume=min_volume)
        if max_volume is not None:
            config = config._replace(max_volume=max_volume)

        p = self.Pipette(
            model_offset=config.model_offset,
            mount=mount,
            name=config.name,
            trash_container=trash_container,
            tip_racks=tip_racks,
            channels=config.channels,
            aspirate_flow_rate=config.aspirate_flow_rate,
            dispense_flow_rate=config.dispense_flow_rate,
            min_volume=config.min_volume,
            max_volume=config.max_volume,
            plunger_current=config.plunger_current,
            drop_tip_current=config.drop_tip_current,
            plunger_positions=config.plunger_positions.copy(),
            pick_up_current=config.pick_up_current,
            pick_up_distance=config.pick_up_distance,
            quirks=config.quirks,
            fallback_tip_length=config.tip_length)  # TODO move to labware

        return p

    def _retrieve_version_number(self, mount, expected_model_substring):
        attached_model = robot.get_attached_pipettes()[mount]['model']

        if attached_model and expected_model_substring in attached_model:
            return attached_model
        else:
            # pass a default pipette model-version for when robot is simulating
            # this allows any pipette to be simulated, regardless of what is
            # actually attached/cached on the robot's mounts
            return expected_model_substring + '_v1'  # default to v1


instruments = InstrumentsWrapper(robot)
containers = ContainersWrapper(robot)
labware = ContainersWrapper(robot)

__all__ = ['containers', 'instruments', 'labware', 'robot', 'reset']
