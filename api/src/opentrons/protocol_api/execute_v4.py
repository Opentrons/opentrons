import logging
from typing import Any, Dict

from .contexts import ProtocolContext, InstrumentContext, ModuleContext
from . import labware
from .execute_v3 import _delay, _blowout, _pick_up_tip, _drop_tip, _aspirate, \
    _dispense, _touch_tip, _move_to_slot

MODULE_LOG = logging.getLogger(__name__)


def _engage_magnet(modules, params):
    pass


def _disengage_magnet(modules, params):
    pass


def _temperature_module_set_temp(modules, params):
    pass


def _temperature_module_deactivate(modules, params):
    pass


def _temperature_module_await_temp(modules, params):
    pass


dispatcher_map: Dict[Any, Any] = {
    "delay": _delay,
    "blowout": _blowout,
    "pickUpTip": _pick_up_tip,
    "dropTip": _drop_tip,
    "aspirate": _aspirate,
    "dispense": _dispense,
    "touchTip": _touch_tip,
    "moveToSlot": _move_to_slot,
    "magneticModule/engageMagnet": _engage_magnet,
    "magneticModule/disengageMagnet": _disengage_magnet,
    "temperatureModule/setTargetTemperature": _temperature_module_set_temp,
    "temperatureModule/deactivate": _temperature_module_deactivate,
    "temperatureModule/awaitTemperature": _temperature_module_await_temp
}


def dispatch_json(context: ProtocolContext,
                  protocol_data: Dict[Any, Any],
                  instruments: Dict[str, InstrumentContext],
                  loaded_labware: Dict[str, labware.Labware],
                  modules: Dict[str, ModuleContext]) -> None:
    commands = protocol_data['commands']

    pipette_command_list = [
        "blowout",
        "pickUpTip",
        "dropTip",
        "aspirate",
        "dispense",
        "touchTip",
    ]

    module_command_list = [
        "magneticModule/engageMagnet",
        "magneticModule/disengageMagnet",
        "temperatureModule/setTargetTemperature",
        "temperatureModule/deactivate",
        "temperatureModule/awaitTemperature"
    ]

    for command_item in commands:
        command_type = command_item['command']
        params = command_item['params']

        # different `_command` helpers take different args
        if command_type in pipette_command_list:
            dispatcher_map[command_type](
                instruments, loaded_labware, params)
        elif command_type == 'delay':
            dispatcher_map[command_type](context, params)
        elif command_type == 'moveToSlot':
            dispatcher_map[command_type](
                context, instruments, params)
        elif command_type in module_command_list:
            dispatcher_map[command_type](
                modules, params
            )
        else:
            raise RuntimeError(
                "Unsupported command type {}".format(command_type))
