from typing import Callable

from opentrons.protocol_engine import StateView
from opentrons.protocol_engine.commands import CommandRequestType
from opentrons.protocols.runner.json_proto.models import json_protocol as models

from .abstract_command_handler import AbstractCommandHandler


OnTranslatedCallback = Callable[[CommandRequestType], None]


class CommandTranslator(AbstractCommandHandler):
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def __init__(
            self,
            state_view: StateView,
            on_translated: OnTranslatedCallback) -> None:
        """
        Construct a command translator

        Args:
            state_view: The protocol engine state view.
            on_translated: Function called with a translated command.
        """
        self._state_view = state_view
        self._on_translated = on_translated

    def handle_aspirate(self, command: models.LiquidCommand) -> None:
        pass

    def handle_dispense(self, command: models.LiquidCommand) -> None:
        pass

    def handle_air_gap(self, command: models.LiquidCommand) -> None:
        pass

    def handle_blowout(self, command: models.BlowoutCommand) -> None:
        pass

    def handle_touch_tip(self, command: models.TouchTipCommand) -> None:
        pass

    def handle_pick_up(self, command: models.PickUpDropTipCommand) -> None:
        pass

    def handle_drop_tip(self, command: models.PickUpDropTipCommand) -> None:
        pass

    def handle_move_to_slot(self, command: models.MoveToSlotCommand) -> None:
        pass

    def handle_delay(self, command: models.DelayCommand) -> None:
        pass

    def handle_magnetic_module_engage(
            self, command: models.MagneticModuleEngageCommand) -> None:
        pass

    def handle_magnetic_module_disengage(
            self, command: models.MagneticModuleDisengageCommand) -> None:
        pass

    def handle_temperature_module_set_target(
            self, command: models.TemperatureModuleSetTargetCommand) -> None:
        pass

    def handle_temperature_module_await_temperature(
            self, command: models.TemperatureModuleAwaitTemperatureCommand) -> None:
        pass

    def handle_temperature_module_deactivate(
            self, command: models.TemperatureModuleDeactivateCommand) -> None:
        pass

    def handle_thermocycler_set_target_block_temperature(
            self,
            command: models.ThermocyclerSetTargetBlockTemperatureCommand) -> None:
        pass

    def handle_thermocycler_set_target_lid_temperature(
            self,
            command: models.ThermocyclerSetTargetLidTemperatureCommand) -> None:
        pass

    def handle_thermocycler_await_block_temperature(
            self, command: models.ThermocyclerAwaitBlockTemperatureCommand) -> None:
        pass

    def handle_thermocycler_await_lid_temperature(
            self, command: models.ThermocyclerAwaitLidTemperatureCommand) -> None:
        pass

    def handle_thermocycler_deactivate_block(
            self, command: models.ThermocyclerDeactivateBlockCommand) -> None:
        pass

    def handle_thermocycler_deactivate_lid(
            self, command: models.ThermocyclerDeactivateLidCommand) -> None:
        pass

    def handle_thermocycler_open_lid(
            self, command: models.ThermocyclerOpenLidCommand) -> None:
        pass

    def handle_thermocycler_close_lid(
            self, command: models.ThermocyclerCloseLidCommand) -> None:
        pass

    def handle_thermocycler_run_profile(
            self, command: models.ThermocyclerRunProfile) -> None:
        pass

    def handle_thermocycler_await_profile_complete(
            self, command: models.ThermocyclerAwaitProfileCompleteCommand) -> None:
        pass

    def handle_move_to_well(self, command: models.MoveToWellCommand) -> None:
        pass
