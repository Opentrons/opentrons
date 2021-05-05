from typing import Dict, Iterable

from opentrons.protocol_engine import WellLocation, WellOrigin
from opentrons.protocol_engine.commands import (
    CommandRequestType, AspirateRequest, DispenseRequest,
    PickUpTipRequest, DropTipRequest
)
from opentrons.protocols.models import json_protocol as models


class CommandTranslatorError(Exception):
    pass


ReturnType = Iterable[CommandRequestType]


class CommandTranslator:
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def __init__(self) -> None:
        """Construct a command translator"""
        pass

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
        """
        Translate an aspirate JSON command to a protocol engine aspirate request.

        Args:
            command: JSON protocol aspirate command

        Returns: AspirateRequest

        """
        # TODO (al, 2021-04-26): incoming pipette and labware ids are
        #  assigned by PD. Are they the same as Protocol Engine's?
        return [
            AspirateRequest(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well,
                volume=command.params.volume,
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=(0, 0, command.params.offsetFromBottomMm)
                )
            )
        ]

    def _dispense(
            self,
            command: models.LiquidCommand) -> ReturnType:
        """
        Translate a dispense JSON command to a protocol engine dispense request.

        Args:
            command: JSON protocol dispense command

        Returns: DispenseRequest
        """
        return [
            DispenseRequest(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well,
                volume=command.params.volume,
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=(0, 0, command.params.offsetFromBottomMm)
                )
            )
        ]

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
        """
        Translate a pick_up_tip JSON command to a protocol engine pick_up_tip request.

        Args:
            command: JSON protocol PickUpTip command

        Returns: PickUpTipRequest
        """
        return [
            PickUpTipRequest(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well
            )
        ]

    def _drop_tip(
            self,
            command: models.PickUpDropTipCommand) -> ReturnType:
        """
        Translate a drop tip JSON command to a protocol engine drop tip request.

        Args:
            command: JSON protocol drop tip command

        Returns: DropTipRequest

        """
        return [
            DropTipRequest(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well
            )
        ]

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
