from typing import Dict, Iterable, List

import opentrons.types

from opentrons import protocol_engine as pe
from opentrons.protocols import models


class CommandTranslatorError(Exception):
    pass


PECommands = Iterable[pe.commands.CommandRequestType]


class CommandTranslator:
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def __init__(self) -> None:
        """Construct a command translator"""
        pass

    def translate(self, protocol: models.JsonProtocol) -> PECommands:
        """Return all Protocol Engine commands required to run the given protocol."""
        result: List[pe.commands.CommandRequestType] = []

        for pipette_id, pipette in protocol.pipettes.items():
            result += [self._translate_load_pipette(pipette_id, pipette)]

        for definition_id, definition in protocol.labwareDefinitions.items():
            result += [self._translate_add_labware_definition(definition)]

        for labware_id, labware in protocol.labware.items():
            result += [
                self._translate_load_labware(
                    labware_id, labware, protocol.labwareDefinitions
                )
            ]

        for command in protocol.commands:
            result += self._translate_command(command)

        return result

    def _translate_command(
            self,
            command: models.json_protocol.AllCommands) -> PECommands:
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

    def _translate_add_labware_definition(
            self,
            labware_definition: models.LabwareDefinition
            ) -> pe.commands.AddLabwareDefinitionRequest:
        return pe.commands.AddLabwareDefinitionRequest(definition=labware_definition)

    def _translate_load_labware(
            self,
            labware_id: str,
            labware: models.json_protocol.Labware,
            labware_definitions: Dict[str, models.LabwareDefinition]
            ) -> pe.commands.LoadLabwareRequest:
        """
        Args:
            labware_id:
                The ID that the JSON protocol's commands will use to refer to this
                labware placement.
            labware:
                The JSON protocol's details about this labware placement, including
                which deck slot it should go in, and a pointer to a labware definition.
            labware_definitions:
                The JSON protocol's collection of labware definitions.
        """
        definition = labware_definitions[labware.definitionId]
        return pe.commands.LoadLabwareRequest(
            location=pe.DeckSlotLocation(
                slot=opentrons.types.DeckSlotName.from_primitive(labware.slot)
            ),
            loadName=definition.parameters.loadName,
            namespace=definition.namespace,
            version=definition.version,
            labwareId=labware_id
        )

    def _translate_load_pipette(
            self,
            pipette_id: str,
            pipette: models.json_protocol.Pipettes) -> pe.commands.LoadPipetteRequest:
        return pe.commands.LoadPipetteRequest(
            pipetteName=pe.PipetteName(pipette.name),
            mount=opentrons.types.MountType(pipette.mount),
            pipetteId=pipette_id
        )

    def _aspirate(
            self,
            command: models.json_protocol.LiquidCommand) -> PECommands:
        """
        Translate an aspirate JSON command to a protocol engine aspirate request.

        Args:
            command: JSON protocol aspirate command

        Returns: AspirateRequest

        """
        # TODO (al, 2021-04-26): incoming pipette and labware ids are
        #  assigned by PD. Are they the same as Protocol Engine's?
        return [
            pe.commands.AspirateRequest(
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
            command: models.json_protocol.LiquidCommand) -> PECommands:
        """
        Translate a dispense JSON command to a protocol engine dispense request.

        Args:
            command: JSON protocol dispense command

        Returns: DispenseRequest
        """
        return [
            pe.commands.DispenseRequest(
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
            command: models.json_protocol.LiquidCommand) -> PECommands:
        raise NotImplementedError()

    def _blowout(
            self,
            command: models.json_protocol.BlowoutCommand) -> PECommands:
        raise NotImplementedError()

    def _touch_tip(
            self,
            command: models.json_protocol.TouchTipCommand) -> PECommands:
        raise NotImplementedError()

    def _pick_up(
            self,
            command: models.json_protocol.PickUpDropTipCommand) -> PECommands:
        """
        Translate a pick_up_tip JSON command to a protocol engine pick_up_tip request.

        Args:
            command: JSON protocol PickUpTip command

        Returns: PickUpTipRequest
        """
        return [
            pe.commands.PickUpTipRequest(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well
            )
        ]

    def _drop_tip(
            self,
            command: models.json_protocol.PickUpDropTipCommand) -> PECommands:
        """
        Translate a drop tip JSON command to a protocol engine drop tip request.

        Args:
            command: JSON protocol drop tip command

        Returns: DropTipRequest

        """
        return [
            pe.commands.DropTipRequest(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well
            )
        ]

    def _move_to_slot(
            self,
            command: models.json_protocol.MoveToSlotCommand) -> PECommands:
        raise NotImplementedError()

    def _delay(
            self,
            command: models.json_protocol.DelayCommand) -> PECommands:
        raise NotImplementedError()

    def _magnetic_module_engage(
            self,
            command: models.json_protocol.MagneticModuleEngageCommand) -> PECommands:
        raise NotImplementedError()

    def _magnetic_module_disengage(
            self,
            command: models.json_protocol.MagneticModuleDisengageCommand) -> PECommands:
        raise NotImplementedError()

    def _temperature_module_set_target(
            self,
            command: models.json_protocol.TemperatureModuleSetTargetCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _temperature_module_await_temperature(
            self,
            command: models.json_protocol.TemperatureModuleAwaitTemperatureCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _temperature_module_deactivate(
            self,
            command: models.json_protocol.TemperatureModuleDeactivateCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_set_target_block_temperature(
            self,
            command: models.json_protocol.ThermocyclerSetTargetBlockTemperatureCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_set_target_lid_temperature(
            self,
            command: models.json_protocol.ThermocyclerSetTargetLidTemperatureCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_await_block_temperature(
            self,
            command: models.json_protocol.ThermocyclerAwaitBlockTemperatureCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_await_lid_temperature(
            self,
            command: models.json_protocol.ThermocyclerAwaitLidTemperatureCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_deactivate_block(
            self,
            command: models.json_protocol.ThermocyclerDeactivateBlockCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_deactivate_lid(
            self,
            command: models.json_protocol.ThermocyclerDeactivateLidCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_open_lid(
            self,
            command: models.json_protocol.ThermocyclerOpenLidCommand) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_close_lid(
            self,
            command: models.json_protocol.ThermocyclerCloseLidCommand) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_run_profile(
            self,
            command: models.json_protocol.ThermocyclerRunProfile) -> PECommands:
        raise NotImplementedError()

    def _thermocycler_await_profile_complete(
            self,
            command: models.json_protocol.ThermocyclerAwaitProfileCompleteCommand
            ) -> PECommands:
        raise NotImplementedError()

    def _move_to_well(
            self,
            command: models.json_protocol.MoveToWellCommand) -> PECommands:
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
