"""Translation of JSON protocol commands into ProtocolEngine commands."""
from typing import Dict, List, cast

from opentrons.types import DeckSlotName, MountType
from opentrons.protocols import models
from opentrons.protocol_engine import (
    commands as pe_commands,
    DeckSlotLocation,
    PipetteName,
    WellLocation,
    WellOrigin,
    WellOffset,
)


class CommandTranslatorError(Exception):
    """An error raised to indicate an internal programmer error."""

    pass


class JsonCommandTranslator:
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def translate(
        self,
        protocol: models.JsonProtocol,
    ) -> List[pe_commands.CommandCreate]:
        """Return all Protocol Engine commands required to run the given protocol."""
        result: List[pe_commands.CommandCreate] = []

        for pipette_id, pipette in protocol.pipettes.items():
            result.append(self._translate_load_pipette(pipette_id, pipette))

        for labware_id, labware in protocol.labware.items():
            result.append(
                self._translate_load_labware(
                    labware_id, labware, protocol.labwareDefinitions
                )
            )

        for command in protocol.commands:
            result.append(self._translate_command(command))

        return result

    def _translate_command(
        self,
        command: models.json_protocol.AllCommands,
    ) -> pe_commands.CommandCreate:
        try:
            h = self._COMMAND_TO_NAME[command.command]
            return cast(pe_commands.CommandCreate, getattr(self, h)(command))
        except KeyError:
            raise CommandTranslatorError(f"'{command.command}' is not recognized.")
        except AttributeError:
            raise CommandTranslatorError(
                f"Cannot find handler for '{command.command}'."
            )

    def _translate_load_labware(
        self,
        labware_id: str,
        labware: models.json_protocol.Labware,
        labware_definitions: Dict[str, models.LabwareDefinition],
    ) -> pe_commands.LoadLabwareCreate:
        """Translate a JSON labware data into a LoadLabware command.

        Args:
            labware_id: The ID that the JSON protocol's commands will use to refer to
                this labware placement.
            labware: The JSON protocol's details about this labware placement, including
                which deck slot it should go in, and a pointer to a labware definition.
            labware_definitions: The JSON protocol's collection of labware definitions.
        """
        definition = labware_definitions[labware.definitionId]
        return pe_commands.LoadLabwareCreate(
            params=pe_commands.LoadLabwareParams(
                location=DeckSlotLocation(
                    slotName=DeckSlotName.from_primitive(labware.slot)
                ),
                loadName=definition.parameters.loadName,
                namespace=definition.namespace,
                version=definition.version,
                labwareId=labware_id,
            )
        )

    def _translate_load_pipette(
        self,
        pipette_id: str,
        pipette: models.json_protocol.Pipettes,
    ) -> pe_commands.LoadPipetteCreate:
        return pe_commands.LoadPipetteCreate(
            params=pe_commands.LoadPipetteParams(
                pipetteName=PipetteName(pipette.name),
                mount=MountType(pipette.mount),
                pipetteId=pipette_id,
            )
        )

    def _aspirate(
        self,
        command: models.json_protocol.LiquidCommand,
    ) -> pe_commands.AspirateCreate:
        return pe_commands.AspirateCreate(
            params=pe_commands.AspirateParams(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well,
                volume=command.params.volume,
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=WellOffset(x=0, y=0, z=command.params.offsetFromBottomMm),
                ),
            )
        )

    def _dispense(
        self,
        command: models.json_protocol.LiquidCommand,
    ) -> pe_commands.DispenseCreate:
        return pe_commands.DispenseCreate(
            params=pe_commands.DispenseParams(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well,
                volume=command.params.volume,
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=WellOffset(x=0, y=0, z=command.params.offsetFromBottomMm),
                ),
            )
        )

    def _air_gap(self, command: models.json_protocol.LiquidCommand) -> None:
        raise NotImplementedError()

    def _blowout(self, command: models.json_protocol.BlowoutCommand) -> None:
        raise NotImplementedError()

    def _touch_tip(self, command: models.json_protocol.TouchTipCommand) -> None:
        raise NotImplementedError()

    def _pick_up(
        self,
        command: models.json_protocol.PickUpDropTipCommand,
    ) -> pe_commands.PickUpTipCreate:
        return pe_commands.PickUpTipCreate(
            params=pe_commands.PickUpTipParams(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well,
            )
        )

    def _drop_tip(
        self,
        command: models.json_protocol.PickUpDropTipCommand,
    ) -> pe_commands.DropTipCreate:
        return pe_commands.DropTipCreate(
            params=pe_commands.DropTipParams(
                pipetteId=command.params.pipette,
                labwareId=command.params.labware,
                wellName=command.params.well,
            )
        )

    def _move_to_slot(
        self,
        command: models.json_protocol.MoveToSlotCommand,
    ) -> None:
        raise NotImplementedError()

    def _delay(
        self,
        command: models.json_protocol.DelayCommand,
    ) -> pe_commands.PauseCreate:
        if command.params.wait is not True:
            raise NotImplementedError("Delay translation not yet implemented.")

        params = pe_commands.PauseParams(message=command.params.message)
        return pe_commands.PauseCreate(params=params)

    def _magnetic_module_engage(
        self,
        command: models.json_protocol.MagneticModuleEngageCommand,
    ) -> None:
        raise NotImplementedError()

    def _magnetic_module_disengage(
        self,
        command: models.json_protocol.MagneticModuleDisengageCommand,
    ) -> None:
        raise NotImplementedError()

    def _temperature_module_set_target(
        self,
        command: models.json_protocol.TemperatureModuleSetTargetCommand,
    ) -> None:
        raise NotImplementedError()

    def _temperature_module_await_temperature(
        self,
        command: models.json_protocol.TemperatureModuleAwaitTemperatureCommand,
    ) -> None:
        raise NotImplementedError()

    def _temperature_module_deactivate(
        self,
        command: models.json_protocol.TemperatureModuleDeactivateCommand,
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_set_target_block_temperature(
        self,
        command: models.json_protocol.ThermocyclerSetTargetBlockTemperatureCommand,
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_set_target_lid_temperature(
        self, command: models.json_protocol.ThermocyclerSetTargetLidTemperatureCommand
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_await_block_temperature(
        self, command: models.json_protocol.ThermocyclerAwaitBlockTemperatureCommand
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_await_lid_temperature(
        self,
        command: models.json_protocol.ThermocyclerAwaitLidTemperatureCommand,
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_deactivate_block(
        self,
        command: models.json_protocol.ThermocyclerDeactivateBlockCommand,
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_deactivate_lid(
        self,
        command: models.json_protocol.ThermocyclerDeactivateLidCommand,
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_open_lid(
        self,
        command: models.json_protocol.ThermocyclerOpenLidCommand,
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_close_lid(
        self,
        command: models.json_protocol.ThermocyclerCloseLidCommand,
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_run_profile(
        self,
        command: models.json_protocol.ThermocyclerRunProfile,
    ) -> None:
        raise NotImplementedError()

    def _thermocycler_await_profile_complete(
        self,
        command: models.json_protocol.ThermocyclerAwaitProfileCompleteCommand,
    ) -> None:
        raise NotImplementedError()

    def _move_to_well(
        self,
        command: models.json_protocol.MoveToWellCommand,
    ) -> None:
        raise NotImplementedError()

    _COMMAND_TO_NAME: Dict[str, str] = {
        models.json_protocol.CommandMoveToWell: _move_to_well.__name__,
        models.json_protocol.CommandThermocyclerAwaitProfile: _thermocycler_await_profile_complete.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerRunProfile: _thermocycler_run_profile.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerCloseLid: _thermocycler_close_lid.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerOpenLid: _thermocycler_open_lid.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerDeactivateLid: _thermocycler_deactivate_lid.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerDeactivateBlock: _thermocycler_deactivate_block.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerSetTargetLid: _thermocycler_set_target_lid_temperature.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerAwaitBlockTemperature: _thermocycler_await_block_temperature.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerAwaitLidTemperature: _thermocycler_await_lid_temperature.__name__,  # noqa: E501
        models.json_protocol.CommandThermocyclerSetTargetBlock: _thermocycler_set_target_block_temperature.__name__,  # noqa: E501
        models.json_protocol.CommandTemperatureModuleDeactivate: _temperature_module_deactivate.__name__,  # noqa: E501
        models.json_protocol.CommandTemperatureModuleAwait: _temperature_module_await_temperature.__name__,  # noqa: E501
        models.json_protocol.CommandTemperatureModuleSetTarget: _temperature_module_set_target.__name__,  # noqa: E501
        models.json_protocol.CommandMagneticModuleDisengage: _magnetic_module_disengage.__name__,  # noqa: E501
        models.json_protocol.CommandMagneticModuleEngage: _magnetic_module_engage.__name__,  # noqa: E501
        models.json_protocol.CommandDelay: _delay.__name__,
        models.json_protocol.CommandMoveToSlot: _move_to_slot.__name__,
        models.json_protocol.CommandDropTip: _drop_tip.__name__,
        models.json_protocol.CommandPickUpTip: _pick_up.__name__,
        models.json_protocol.CommandTouchTip: _touch_tip.__name__,
        models.json_protocol.CommandBlowout: _blowout.__name__,
        models.json_protocol.CommandAirGap: _air_gap.__name__,
        models.json_protocol.CommandDispense: _dispense.__name__,
        models.json_protocol.CommandAspirate: _aspirate.__name__,
    }
