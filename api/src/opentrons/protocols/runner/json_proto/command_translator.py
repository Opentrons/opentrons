from typing import Iterable

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
        raise NotImplementedError()

    def _aspirate(
            self,
            command: models.LiquidCommand) -> ReturnType:
        raise NotImplementedError()

    def _dispense(
            self,
            command: models.LiquidCommand) -> ReturnType:
        raise NotImplementedError()

    def _air_gap(
            self,
            command: models.LiquidCommand) -> ReturnType:
        raise NotImplementedError()

    def _blowout(
            self,
            command: models.BlowoutCommand) -> ReturnType:
        raise NotImplementedError()

    def _touch_tip(
            self,
            command: models.TouchTipCommand) -> ReturnType:
        raise NotImplementedError()

    def _pick_up(
            self,
            command: models.PickUpDropTipCommand) -> ReturnType:
        raise NotImplementedError()

    def _drop_tip(
            self,
            command: models.PickUpDropTipCommand) -> ReturnType:
        raise NotImplementedError()

    def _move_to_slot(
            self,
            command: models.MoveToSlotCommand) -> ReturnType:
        raise NotImplementedError()

    def _delay(
            self,
            command: models.DelayCommand) -> ReturnType:
        raise NotImplementedError()

    def _magnetic_module_engage(
            self, command: models.MagneticModuleEngageCommand) -> ReturnType:
        raise NotImplementedError()

    def _magnetic_module_disengage(
            self,
            command: models.MagneticModuleDisengageCommand) -> ReturnType:
        raise NotImplementedError()

    def _temperature_module_set_target(
            self,
            command: models.TemperatureModuleSetTargetCommand) -> ReturnType:
        raise NotImplementedError()

    def _temperature_module_await_temperature(
            self,
            command: models.TemperatureModuleAwaitTemperatureCommand) -> ReturnType:
        raise NotImplementedError()

    def _temperature_module_deactivate(
            self,
            command: models.TemperatureModuleDeactivateCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_set_target_block_temperature(
            self,
            command: models.ThermocyclerSetTargetBlockTemperatureCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_set_target_lid_temperature(
            self,
            command: models.ThermocyclerSetTargetLidTemperatureCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_await_block_temperature(
            self,
            command: models.ThermocyclerAwaitBlockTemperatureCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_await_lid_temperature(
            self,
            command: models.ThermocyclerAwaitLidTemperatureCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_deactivate_block(
            self,
            command: models.ThermocyclerDeactivateBlockCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_deactivate_lid(
            self,
            command: models.ThermocyclerDeactivateLidCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_open_lid(
            self,
            command: models.ThermocyclerOpenLidCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_close_lid(
            self,
            command: models.ThermocyclerCloseLidCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_run_profile(
            self,
            command: models.ThermocyclerRunProfile) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_await_profile_complete(
            self,
            command: models.ThermocyclerAwaitProfileCompleteCommand) -> ReturnType:
        raise NotImplementedError()

    def _move_to_well(
            self,
            command: models.MoveToWellCommand) -> ReturnType:
        raise NotImplementedError()
