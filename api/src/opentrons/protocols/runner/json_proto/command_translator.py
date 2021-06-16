from typing import Dict, Iterable

import opentrons.types

from opentrons import protocol_engine as pe

# To do: Collapse imports
from opentrons.protocol_engine.commands import (
    CommandRequestType,
    AddLabwareDefinitionRequest,
    LoadLabwareRequest,
    AspirateRequest,
    DispenseRequest,
    PickUpTipRequest,
    DropTipRequest
)

from opentrons.protocols import models
from opentrons.protocols.models import JsonProtocol
from opentrons.protocols.models.labware_definition import LabwareDefinition


class CommandTranslatorError(Exception):
    pass


ReturnType = Iterable[CommandRequestType]


class CommandTranslator:
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def __init__(self) -> None:
        """Construct a command translator"""
        pass

    def translate(self, protocol: JsonProtocol) -> ReturnType:
        result = []
        for labware_uri, labware_definition in protocol.labwareDefinitions.items():
            result += [self._translate_labware_definition(labware_definition)]
        for pd_labware_id, labware in protocol.labware.items():
            # To do: Rename pd_labware_id
            result += [self._translate_labware(
                pd_labware_id, labware, protocol.labwareDefinitions
            )]

        return result

    def _translate_command(
            self,
            command: models.json_protocol.AllCommands) -> ReturnType:
        """
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

    def _translate_labware_definition(self, labware_definition: LabwareDefinition):
        return AddLabwareDefinitionRequest(definition=labware_definition)

    def _translate_labware(
            self,
            labware_id_to_translate: str,
            labware_to_translate: models.json_protocol.Labware,
            labware_definitions: Dict[str, LabwareDefinition]
    ):  # To do: Type
        definition = labware_definitions[labware_to_translate.definitionId]
        load_name = definition.parameters.loadName
        return LoadLabwareRequest(
            location=pe.DeckSlotLocation(
                # To do: Is this right?
                slot=opentrons.types.DeckSlotName.from_primitive(
                    labware_to_translate.slot
                )
            ),
            loadName=load_name,
            namespace=definition.namespace,
            version=definition.version,
            labwareId=labware_id_to_translate
        )

    def _aspirate(
            self,
            command: models.json_protocol.LiquidCommand) -> ReturnType:
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
                wellLocation=pe.WellLocation(
                    origin=pe.WellOrigin.BOTTOM,
                    offset=(0, 0, command.params.offsetFromBottomMm)
                )
            )
        ]

    def _dispense(
            self,
            command: models.json_protocol.LiquidCommand) -> ReturnType:
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
                wellLocation=pe.WellLocation(
                    origin=pe.WellOrigin.BOTTOM,
                    offset=(0, 0, command.params.offsetFromBottomMm)
                )
            )
        ]

    def _air_gap(
            self,
            command: models.json_protocol.LiquidCommand) -> ReturnType:
        raise NotImplementedError()

    def _blowout(
            self,
            command: models.json_protocol.BlowoutCommand) -> ReturnType:
        raise NotImplementedError()

    def _touch_tip(
            self,
            command: models.json_protocol.TouchTipCommand) -> ReturnType:
        raise NotImplementedError()

    def _pick_up(
            self,
            command: models.json_protocol.PickUpDropTipCommand) -> ReturnType:
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
            command: models.json_protocol.PickUpDropTipCommand) -> ReturnType:
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
            command: models.json_protocol.MoveToSlotCommand) -> ReturnType:
        raise NotImplementedError()

    def _delay(
            self,
            command: models.json_protocol.DelayCommand) -> ReturnType:
        raise NotImplementedError()

    def _magnetic_module_engage(
            self,
            command: models.json_protocol.MagneticModuleEngageCommand) -> ReturnType:
        raise NotImplementedError()

    def _magnetic_module_disengage(
            self,
            command: models.json_protocol.MagneticModuleDisengageCommand) -> ReturnType:
        raise NotImplementedError()

    def _temperature_module_set_target(
            self,
            command: models.json_protocol.TemperatureModuleSetTargetCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _temperature_module_await_temperature(
            self,
            command: models.json_protocol.TemperatureModuleAwaitTemperatureCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _temperature_module_deactivate(
            self,
            command: models.json_protocol.TemperatureModuleDeactivateCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_set_target_block_temperature(
            self,
            command: models.json_protocol.ThermocyclerSetTargetBlockTemperatureCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_set_target_lid_temperature(
            self,
            command: models.json_protocol.ThermocyclerSetTargetLidTemperatureCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_await_block_temperature(
            self,
            command: models.json_protocol.ThermocyclerAwaitBlockTemperatureCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_await_lid_temperature(
            self,
            command: models.json_protocol.ThermocyclerAwaitLidTemperatureCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_deactivate_block(
            self,
            command: models.json_protocol.ThermocyclerDeactivateBlockCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_deactivate_lid(
            self,
            command: models.json_protocol.ThermocyclerDeactivateLidCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_open_lid(
            self,
            command: models.json_protocol.ThermocyclerOpenLidCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_close_lid(
            self,
            command: models.json_protocol.ThermocyclerCloseLidCommand) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_run_profile(
            self,
            command: models.json_protocol.ThermocyclerRunProfile) -> ReturnType:
        raise NotImplementedError()

    def _thermocycler_await_profile_complete(
            self,
            command: models.json_protocol.ThermocyclerAwaitProfileCompleteCommand
            ) -> ReturnType:
        raise NotImplementedError()

    def _move_to_well(
            self,
            command: models.json_protocol.MoveToWellCommand) -> ReturnType:
        raise NotImplementedError()

    _COMMAND_TO_NAME: Dict[str, str] = {
        models.json_protocol.CommandMoveToWell:
            _move_to_well.__name__,
        models.json_protocol.CommandThermocyclerAwaitProfile:
            _thermocycler_await_profile_complete.__name__,
        models.json_protocol.CommandThermocyclerRunProfile:
            _thermocycler_run_profile.__name__,
        models.json_protocol.CommandThermocyclerCloseLid:
            _thermocycler_close_lid.__name__,
        models.json_protocol.CommandThermocyclerOpenLid:
            _thermocycler_open_lid.__name__,
        models.json_protocol.CommandThermocyclerDeactivateLid:
            _thermocycler_deactivate_lid.__name__,
        models.json_protocol.CommandThermocyclerDeactivateBlock:
            _thermocycler_deactivate_block.__name__,
        models.json_protocol.CommandThermocyclerSetTargetLid:
            _thermocycler_set_target_lid_temperature.__name__,
        models.json_protocol.CommandThermocyclerAwaitBlockTemperature:
            _thermocycler_await_block_temperature.__name__,
        models.json_protocol.CommandThermocyclerAwaitLidTemperature:
            _thermocycler_await_lid_temperature.__name__,
        models.json_protocol.CommandThermocyclerSetTargetBlock:
            _thermocycler_set_target_block_temperature.__name__,
        models.json_protocol.CommandTemperatureModuleDeactivate:
            _temperature_module_deactivate.__name__,
        models.json_protocol.CommandTemperatureModuleAwait:
            _temperature_module_await_temperature.__name__,
        models.json_protocol.CommandTemperatureModuleSetTarget:
            _temperature_module_set_target.__name__,
        models.json_protocol.CommandMagneticModuleDisengage:
            _magnetic_module_disengage.__name__,
        models.json_protocol.CommandMagneticModuleEngage:
            _magnetic_module_engage.__name__,
        models.json_protocol.CommandDelay:
            _delay.__name__,
        models.json_protocol.CommandMoveToSlot:
            _move_to_slot.__name__,
        models.json_protocol.CommandDropTip:
            _drop_tip.__name__,
        models.json_protocol.CommandPickUpTip:
            _pick_up.__name__,
        models.json_protocol.CommandTouchTip:
            _touch_tip.__name__,
        models.json_protocol.CommandBlowout:
            _blowout.__name__,
        models.json_protocol.CommandAirGap:
            _air_gap.__name__,
        models.json_protocol.CommandDispense:
            _dispense.__name__,
        models.json_protocol.CommandAspirate:
            _aspirate.__name__,
    }
