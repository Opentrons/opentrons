from dataclasses import replace
import logging
from . import (robot as _robot_module,
               instruments as inst,
               containers as cnt,
               modules)
from opentrons.config import pipette_config

log = logging.getLogger(__name__)
# Ignore the type here because well, this is exactly why this is the legacy_api
robot = _robot_module.Robot()  # type: ignore
modules.provide_singleton(robot)

LOG = logging.getLogger(__name__)


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

    def load(
            self, container_name, slot, label=None, share=False, version=None):
        try:
            return cnt.load(
                self.robot, container_name, slot, label, share, version)
        except FileNotFoundError:
            LOG.exception(f"Exception opening labware {container_name}")
            raise


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
        if attached[mount]['id'] and attached[mount]['id'] != 'uncommissioned':
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
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p10_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P10_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p10_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P20_Single_GEN2(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p20_single_gen2',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P20_Multi_GEN2(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p20_multi_gen2',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P50_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p50_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P50_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p50_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P300_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p300_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P300_Single_GEN2(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p300_single_gen2',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P300_Multi_GEN2(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p300_multi_gen2',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P300_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p300_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P1000_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p1000_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def P1000_Single_GEN2(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        return self.pipette_by_name(mount, 'p1000_single_gen2',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume,
                                    blow_out_flow_rate)

    def pipette_by_name(
            self,
            mount,
            name_or_model,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None):
        pipette_model_version, pip_id = self._pipette_details(
            mount, name_or_model)
        config = pipette_config.load(pipette_model_version, pip_id)
        original_name = name_or_model
        if pip_id and name_or_model in config.back_compat_names:
            log.warning(
                f"Using a deprecated constructor for {pipette_model_version}")
            constructor_config = pipette_config.name_config()[name_or_model]
            config = replace(
                config,
                min_volume=constructor_config['minVolume'],
                max_volume=constructor_config['maxVolume'])
            name_or_model = config.name
        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            name=name_or_model,
            model=pipette_model_version,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume,
            blow_out_flow_rate=blow_out_flow_rate,
            requested_as=original_name)

    def _create_pipette_from_config(
            self,
            config,
            mount,
            name,
            model=None,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None,
            blow_out_flow_rate=None,
            requested_as=None):

        if aspirate_flow_rate is not None:
            config = replace(config, aspirate_flow_rate=aspirate_flow_rate)
        if dispense_flow_rate is not None:
            config = replace(config, dispense_flow_rate=dispense_flow_rate)
        if blow_out_flow_rate is not None:
            config = replace(config, blow_out_flow_rate=blow_out_flow_rate)

        if min_volume is not None:
            config = replace(config, min_volume=min_volume)
        if max_volume is not None:
            config = replace(config, max_volume=max_volume)
        plunger_positions = {
            'top': config.top,
            'bottom': config.bottom,
            'blow_out': config.blow_out,
            'drop_tip': config.drop_tip}

        p = self.Pipette(
            model_offset=config.model_offset,
            mount=mount,
            name=name,
            model=model,
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
            plunger_positions=plunger_positions,
            ul_per_mm=config.ul_per_mm,
            pick_up_current=config.pick_up_current,
            pick_up_distance=config.pick_up_distance,
            pick_up_increment=config.pick_up_increment,
            pick_up_presses=config.pick_up_presses,
            pick_up_speed=config.pick_up_speed,
            return_tip_height=config.return_tip_height,
            quirks=config.quirks,
            fallback_tip_length=config.tip_length,  # TODO move to labware
            blow_out_flow_rate=config.blow_out_flow_rate,
            requested_as=requested_as)

        return p

    def retrieve_version_number(self, mount, expected_model_substring):
        attached_model = robot.get_attached_pipettes()[mount]['model']
        try:
            attached_model_config = pipette_config.configs[attached_model]
        except KeyError:
            return list(filter(
                lambda m: m.split('_v')[0] in expected_model_substring,
                pipette_config.config_models))[0]
        back_compat_names = attached_model_config.get('backCompatNames')
        if attached_model_config.get('name') == expected_model_substring:
            return attached_model
        elif back_compat_names and \
                expected_model_substring in back_compat_names:
            return attached_model
        else:
            # In the case that the expected model substring does not equal
            # attached model name or back_compat_names, then take the expected
            # model substring and create a fallback model name.
            if 'gen2' in expected_model_substring:
                return expected_model_substring.split('_gen2')[0] + '_v2.0'
            return expected_model_substring.split('_v')[0] + '_v1'


instruments = InstrumentsWrapper(robot)
containers = ContainersWrapper(robot)
labware = ContainersWrapper(robot)
modules.provide_labware(labware)


__all__ = ['containers', 'instruments', 'labware', 'robot', 'reset', 'modules']
