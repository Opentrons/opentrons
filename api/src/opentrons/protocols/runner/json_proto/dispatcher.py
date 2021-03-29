from typing import Dict

from opentrons.protocols.runner.json_proto.abstract_command_handler import \
    AbstractCommandHandler
from opentrons.protocols.runner.json_proto.models import json_protocol as models


class DispatchError(Exception):
    pass


def dispatch(command: models.AllCommands, handler: AbstractCommandHandler) -> None:
    """
    Dispactch command to its handler.

    Args:
        command: A json protocol command
        handler: An AbstractCommandHandler to handle commands.

    Returns:
        None

    """
    try:
        h = _command_to_method_name[command.command]
        getattr(handler, h)(command)
    except KeyError:
        raise DispatchError(f"'{command.command}' is not recognized.")
    except AttributeError:
        raise DispatchError(f"Cannot find handler for '{command.command}'.")


_command_to_method_name: Dict[str, str] = {
    models.CommandMoveToWell:
        AbstractCommandHandler.handle_move_to_well.__name__,
    models.CommandThermocyclerAwaitProfile:
        AbstractCommandHandler.handle_thermocycler_await_profile_complete.__name__,
    models.CommandThermocyclerRunProfile:
        AbstractCommandHandler.handle_thermocycler_run_profile.__name__,
    models.CommandThermocyclerCloseLid:
        AbstractCommandHandler.handle_thermocycler_close_lid.__name__,
    models.CommandThermocyclerOpenLid:
        AbstractCommandHandler.handle_thermocycler_open_lid.__name__,
    models.CommandThermocyclerDeactivateLid:
        AbstractCommandHandler.handle_thermocycler_deactivate_lid.__name__,
    models.CommandThermocyclerDeactivateBlock:
        AbstractCommandHandler.handle_thermocycler_deactivate_block.__name__,
    models.CommandThermocyclerSetTargetLid:
        AbstractCommandHandler.handle_thermocycler_set_target_lid_temperature.__name__,
    models.CommandThermocyclerAwaitBlockTemperature:
        AbstractCommandHandler.handle_thermocycler_await_block_temperature.__name__,
    models.CommandThermocyclerAwaitLidTemperature:
        AbstractCommandHandler.handle_thermocycler_await_lid_temperature.__name__,
    models.CommandThermocyclerSetTargetBlock:
        AbstractCommandHandler.handle_thermocycler_set_target_block_temperature.__name__,
    models.CommandTemperatureModuleDeactivate:
        AbstractCommandHandler.handle_temperature_module_deactivate.__name__,
    models.CommandTemperatureModuleAwait:
        AbstractCommandHandler.handle_temperature_module_await_temperature.__name__,
    models.CommandTemperatureModuleSetTarget:
        AbstractCommandHandler.handle_temperature_module_set_target.__name__,
    models.CommandMagneticModuleDisengage:
        AbstractCommandHandler.handle_magnetic_module_disengage.__name__,
    models.CommandMagneticModuleEngage:
        AbstractCommandHandler.handle_magnetic_module_engage.__name__,
    models.CommandDelay:
        AbstractCommandHandler.handle_delay.__name__,
    models.CommandMoveToSlot:
        AbstractCommandHandler.handle_move_to_slot.__name__,
    models.CommandDropTip:
        AbstractCommandHandler.handle_drop_tip.__name__,
    models.CommandPickUpTip:
        AbstractCommandHandler.handle_pick_up.__name__,
    models.CommandTouchTip:
        AbstractCommandHandler.handle_touch_tip.__name__,
    models.CommandBlowout:
        AbstractCommandHandler.handle_blowout.__name__,
    models.CommandAirGap:
        AbstractCommandHandler.handle_air_gap.__name__,
    models.CommandDispense:
        AbstractCommandHandler.handle_dispense.__name__,
    models.CommandAspirate:
        AbstractCommandHandler.handle_aspirate.__name__,
}