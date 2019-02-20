from . import (robot as _robot_module,
               instruments as inst,
               containers as cnt,
               modules)
from opentrons.config import pipette_config

# Ignore the type here because well, this is exactly why this is the legacy_api
robot = _robot_module.Robot()  # type: ignore
modules.provide_singleton(robot)


def reset():
    robot.reset()
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

    def _pipette_details(self, mount, name_or_model):
        pipette_model_version = self.retrieve_version_number(
            mount, name_or_model)
        attached = self.robot.get_attached_pipettes()
        if attached[mount]['model'] == pipette_model_version\
           and attached[mount]['id']\
           and attached[mount]['id'] != 'uncommissioned':
            pip_id = attached[mount]['id']
        else:
            pip_id = None
        return (pipette_model_version, pip_id)

    def P10_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p10_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P10_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p10_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P50_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p50_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P50_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p50_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P300_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p300_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P300_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p300_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P1000_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p1000_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def pipette_by_name(
            self,
            mount,
            name_or_model,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        pipette_model_version, pip_id = self._pipette_details(
            mount, name_or_model)
        config = pipette_config.load(pipette_model_version, pip_id)

        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            name=pipette_model_version,
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
            name,
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
            name=name,
            trash_container=trash_container,
            tip_racks=tip_racks,
            channels=config.channels,
            aspirate_flow_rate=config.aspirate_flow_rate,
            dispense_flow_rate=config.dispense_flow_rate,
            min_volume=config.min_volume,
            max_volume=config.max_volume,
            plunger_current=config.plunger_current,
            drop_tip_current=config.drop_tip_current,
            drop_tip_speed=config.drop_tip_speed,
            plunger_positions=config.plunger_positions.copy(),
            ul_per_mm=config.ul_per_mm,
            pick_up_current=config.pick_up_current,
            pick_up_distance=config.pick_up_distance,
            quirks=config.quirks,
            fallback_tip_length=config.tip_length)  # TODO move to labware

        return p

    def retrieve_version_number(self, mount, expected_model_substring):
        if pipette_config.HAS_MODEL_RE.match(expected_model_substring):
            return expected_model_substring

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
modules.provide_labware(labware)


__all__ = ['containers', 'instruments', 'labware', 'robot', 'reset', 'modules']
