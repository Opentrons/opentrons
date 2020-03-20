import enum
import logging
from typing import Any, Dict
from .contexts import ProtocolContext, \
    MagneticModuleContext, TemperatureModuleContext, ModuleContext
from .execute_v3 import _delay, _move_to_slot
from .types import LoadedLabware, Instruments, PipetteHandler, \
    MagneticModuleHandler, TemperatureModuleHandler

MODULE_LOG = logging.getLogger(__name__)


def load_labware_from_json_defs(
        ctx: ProtocolContext,
        protocol: Dict[Any, Any],
        modules: Dict[str, ModuleContext]) -> LoadedLabware:
    protocol_labware = protocol['labware']
    definitions = protocol['labwareDefinitions']
    loaded_labware = {}

    for labware_id, props in protocol_labware.items():
        slot = props['slot']
        definition = definitions[props['definitionId']]
        label = props.get('displayName', None)
        if slot in modules:
            loaded_labware[labware_id] = \
                modules[slot].load_labware_from_definition(definition, label)
        else:
            loaded_labware[labware_id] = \
                ctx.load_labware_from_definition(definition, slot, label)

    return loaded_labware


def load_modules_from_json(
        ctx: ProtocolContext,
        protocol: Dict[Any, Any]) -> Dict[str, ModuleContext]:
    module_data = protocol['modules']
    modules_by_id = {}
    for module_id, props in module_data.items():
        model = props['model']
        slot = props['slot']
        instr = ctx.load_module(model, slot)
        modules_by_id[module_id] = instr

    return modules_by_id


def _engage_magnet(module: MagneticModuleContext, params) -> None:
    engage_height = params['engageHeight']
    module.engage(height_from_base=engage_height)


def _disengage_magnet(module: MagneticModuleContext, params) -> None:
    module.disengage()


def _temperature_module_set_temp(module: TemperatureModuleContext,
                                 params) -> None:
    temperature = params['temperature']
    module.start_set_temperature(temperature)


def _temperature_module_deactivate(module: TemperatureModuleContext,
                                   params) -> None:
    module.deactivate()


def _temperature_module_await_temp(module: TemperatureModuleContext,
                                   params) -> None:
    temperature = params['temperature']
    module.await_temperature(temperature)


class JsonCommand(enum.Enum):
    delay = "delay"
    blowout = "blowout"
    pickUpTip = "pickUpTip"
    dropTip = "dropTip"
    aspirate = "aspirate"
    dispense = "dispense"
    touchTip = "touchTip"
    moveToSlot = "moveToSlot"
    magneticModuleEngageMagnet = "magneticModule/engageMagnet"
    magneticModuleDisengageMagnet = "magneticModule/disengageMagnet"
    temperatureModuleSetTargetTemperature = \
        "temperatureModule/setTargetTemperature"
    temperatureModuleDeactivate = \
        "temperatureModule/deactivate"
    temperatureModuleAwaitTemperature = \
        "temperatureModule/awaitTemperature"


def dispatch_json(context: ProtocolContext,
                  protocol_data: Dict[Any, Any],
                  instruments: Instruments,
                  loaded_labware: LoadedLabware,
                  modules: Dict[str, ModuleContext],
                  pipette_command_map: Dict[str, PipetteHandler],
                  magnetic_module_command_map:
                  Dict[str, MagneticModuleHandler],
                  temperature_module_command_map:
                  Dict[str, TemperatureModuleHandler]
                  ) -> None:
    commands = protocol_data['commands']

    for command_item in commands:
        command_type = command_item['command']
        params = command_item['params']

        if command_type in pipette_command_map:
            pipette_command_map[command_type](
                instruments, loaded_labware, params)
        elif command_type in magnetic_module_command_map:
            handleMagnetCommand(
                                params,
                                modules,
                                command_type,
                                magnetic_module_command_map
                                )
        elif command_type in temperature_module_command_map:
            handleTemperatureCommand(params,
                                     modules,
                                     command_type,
                                     temperature_module_command_map
                                     )
        elif command_type == JsonCommand.delay.value:
            _delay(context, params)
        elif command_type == JsonCommand.moveToSlot.value:
            _move_to_slot(context, instruments, params)
        else:
            raise RuntimeError(
                "Unsupported command type {}".format(command_type))


def handleTemperatureCommand(params,
                             modules,
                             command_type,
                             temperature_module_command_map
                             ) -> None:
    module_id = params['module']
    module = modules[module_id]
    if isinstance(module, TemperatureModuleContext):
        temperature_module_command_map[command_type](
            module, params
        )
    else:
        raise RuntimeError(
         "Temperature Module does not match TemperatureModuleContext interface"
         )


def handleMagnetCommand(params,
                        modules,
                        command_type,
                        magnetic_module_command_map
                        ) -> None:
    module_id = params['module']
    module = modules[module_id]
    if isinstance(module, MagneticModuleContext):
        magnetic_module_command_map[command_type](
            module, params
        )
    else:
        raise RuntimeError(
         "Magnetic Module does not match MagneticModuleContext interface"
         )
