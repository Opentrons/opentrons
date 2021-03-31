from typing import Dict, Iterable

from opentrons.protocol_engine import StateView
from opentrons.protocol_engine.commands import CommandRequestType
from opentrons.protocols.runner.json_proto.models import json_protocol as models


class CommandTranslatorError(Exception):
    pass


ReturnType = Iterable[CommandRequestType]


class CommandTranslator:
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def __init__(
            self,
            state_view: StateView) -> None:
        """
        Construct a command translator

        Args:
            state_view: The protocol engine state view.
        """
        self._state_view = state_view

    def translate(self, command: models.AllCommands) -> ReturnType:
        """
        Translate a PD/JSON protocol to Protocol Engine commands.

        Args:
            command: The PD/JSON command to translate

        Returns:
            A collection of Protocol Engine command requests.

        """
        try:
            h = CommandTranslator._COMMAND_TO_NAME[command.command]
            return getattr(self, h)(command)
        except KeyError:
            raise CommandTranslatorError(
                f"'{command.command}' is not recognized.")
        except AttributeError:
            raise CommandTranslatorError(
                f"Cannot find handler for '{command.command}'.")

    def _aspirate(
            self,
            command: models.LiquidCommand) -> ReturnType:
        pass

    def _dispense(
            self,
            command: models.LiquidCommand) -> ReturnType:
        pass

    def _air_gap(
            self,
            command: models.LiquidCommand) -> ReturnType:
        pass

    def _blowout(
            self,
            command: models.BlowoutCommand) -> ReturnType:
        pass

    def _touch_tip(
            self,
            command: models.TouchTipCommand) -> ReturnType:
        pass

    def _pick_up(
            self,
            command: models.PickUpDropTipCommand) -> ReturnType:
        pass

    def _drop_tip(
            self,
            command: models.PickUpDropTipCommand) -> ReturnType:
        pass

    def _move_to_slot(
            self,
            command: models.MoveToSlotCommand) -> ReturnType:
        pass

    def _delay(
            self,
            command: models.DelayCommand) -> ReturnType:
        pass

    def _magnetic_module_engage(
            self, command: models.MagneticModuleEngageCommand) -> ReturnType:
        pass

    def _magnetic_module_disengage(
            self,
            command: models.MagneticModuleDisengageCommand) -> ReturnType:
        pass

    def _temperature_module_set_target(
            self,
            command: models.TemperatureModuleSetTargetCommand) -> ReturnType:
        pass

    def _temperature_module_await_temperature(
            self,
            command: models.TemperatureModuleAwaitTemperatureCommand) -> ReturnType:
        pass

    def _temperature_module_deactivate(
            self,
            command: models.TemperatureModuleDeactivateCommand) -> ReturnType:
        pass

    def _thermocycler_set_target_block_temperature(
            self,
            command: models.ThermocyclerSetTargetBlockTemperatureCommand) -> ReturnType:
        pass

    def _thermocycler_set_target_lid_temperature(
            self,
            command: models.ThermocyclerSetTargetLidTemperatureCommand) -> ReturnType:
        pass

    def _thermocycler_await_block_temperature(
            self,
            command: models.ThermocyclerAwaitBlockTemperatureCommand) -> ReturnType:
        pass

    def _thermocycler_await_lid_temperature(
            self,
            command: models.ThermocyclerAwaitLidTemperatureCommand) -> ReturnType:
        pass

    def _thermocycler_deactivate_block(
            self,
            command: models.ThermocyclerDeactivateBlockCommand) -> ReturnType:
        pass

    def _thermocycler_deactivate_lid(
            self,
            command: models.ThermocyclerDeactivateLidCommand) -> ReturnType:
        pass

    def _thermocycler_open_lid(
            self,
            command: models.ThermocyclerOpenLidCommand) -> ReturnType:
        pass

    def _thermocycler_close_lid(
            self,
            command: models.ThermocyclerCloseLidCommand) -> ReturnType:
        pass

    def _thermocycler_run_profile(
            self,
            command: models.ThermocyclerRunProfile) -> ReturnType:
        pass

    def _thermocycler_await_profile_complete(
            self,
            command: models.ThermocyclerAwaitProfileCompleteCommand) -> ReturnType:
        pass

    def _move_to_well(
            self,
            command: models.MoveToWellCommand) -> ReturnType:
        pass

    _COMMAND_TO_NAME: Dict[str, str] = {
        models.CommandMoveToWell:
            _move_to_well.__name__,
        models.CommandThermocyclerAwaitProfile:
            _thermocycler_await_profile_complete.__name__,
        models.CommandThermocyclerRunProfile:
            _thermocycler_run_profile.__name__,
        models.CommandThermocyclerCloseLid:
            _thermocycler_close_lid.__name__,
        models.CommandThermocyclerOpenLid:
            _thermocycler_open_lid.__name__,
        models.CommandThermocyclerDeactivateLid:
            _thermocycler_deactivate_lid.__name__,
        models.CommandThermocyclerDeactivateBlock:
            _thermocycler_deactivate_block.__name__,
        models.CommandThermocyclerSetTargetLid:
            _thermocycler_set_target_lid_temperature.__name__,
        models.CommandThermocyclerAwaitBlockTemperature:
            _thermocycler_await_block_temperature.__name__,
        models.CommandThermocyclerAwaitLidTemperature:
            _thermocycler_await_lid_temperature.__name__,
        models.CommandThermocyclerSetTargetBlock:
            _thermocycler_set_target_block_temperature.__name__,
        models.CommandTemperatureModuleDeactivate:
            _temperature_module_deactivate.__name__,
        models.CommandTemperatureModuleAwait:
            _temperature_module_await_temperature.__name__,
        models.CommandTemperatureModuleSetTarget:
            _temperature_module_set_target.__name__,
        models.CommandMagneticModuleDisengage:
            _magnetic_module_disengage.__name__,
        models.CommandMagneticModuleEngage:
            _magnetic_module_engage.__name__,
        models.CommandDelay:
            _delay.__name__,
        models.CommandMoveToSlot:
            _move_to_slot.__name__,
        models.CommandDropTip:
            _drop_tip.__name__,
        models.CommandPickUpTip:
            _pick_up.__name__,
        models.CommandTouchTip:
            _touch_tip.__name__,
        models.CommandBlowout:
            _blowout.__name__,
        models.CommandAirGap:
            _air_gap.__name__,
        models.CommandDispense:
            _dispense.__name__,
        models.CommandAspirate:
            _aspirate.__name__,
    }
