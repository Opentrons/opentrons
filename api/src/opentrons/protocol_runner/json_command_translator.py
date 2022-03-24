"""Translation of JSON protocol commands into ProtocolEngine commands."""
from typing import cast, List
from pydantic import parse_obj_as
from opentrons_shared_data.protocol.models import ProtocolSchemaV6, Command
from opentrons.protocol_engine import commands as pe_commands, LabwareLocation


class CommandTranslatorError(Exception):
    """An error raised to indicate an internal programmer error."""

    pass


def _get_labware_command(
    protocol: ProtocolSchemaV6, labware_id: str, command: Command
) -> pe_commands.LoadLabwareCreate:
    definition_id = protocol.labware[labware_id].definitionId
    assert definition_id is not None
    labware_command = pe_commands.LoadLabwareCreate(
        params=pe_commands.LoadLabwareParams(
            labwareId=command.params.labwareId,
            displayName=protocol.labware[labware_id].displayName,
            version=protocol.labwareDefinitions[definition_id].version,
            namespace=protocol.labwareDefinitions[definition_id].namespace,
            loadName=protocol.labwareDefinitions[definition_id].parameters.loadName,
            location=parse_obj_as(
                LabwareLocation, command.params.location  # type: ignore[arg-type]
            ),
        )
    )
    return labware_command


class JsonCommandTranslator:
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def translate(
        self,
        protocol: ProtocolSchemaV6,
    ) -> List[pe_commands.CommandCreate]:
        """Takes json protocol v6 and translates commands->protocol engine commands."""
        commands_list: List[pe_commands.CommandCreate] = []
        exclude_commands = [
            "loadLiquid",
            "delay",
            "touchTip",
            "blowout",
            "moveToSlot",
            "moveToCoordinates",
        ]
        for command in protocol.commands:
            dict_command = command.dict(exclude_none=True)
            if command.commandType in exclude_commands:
                continue
            if command.commandType == "loadPipette":
                pipette_id = command.params.pipetteId
                assert pipette_id is not None
                dict_command["params"].update(
                    dict(pipetteName=protocol.pipettes[pipette_id].name)
                )
            elif command.commandType == "loadModule":
                module_id = command.params.moduleId
                modules = protocol.modules
                assert module_id is not None
                assert modules is not None
                dict_command["params"].update({"model": modules[module_id].model})
            elif command.commandType == "loadLabware":
                labware_id = command.params.labwareId
                assert labware_id is not None
                labware_command = _get_labware_command(protocol, labware_id, command)
                commands_list.append(labware_command)
                continue
                print(dict_command)
            translated_obj = cast(
                pe_commands.CommandCreate,
                parse_obj_as(
                    # https://github.com/samuelcolvin/pydantic/issues/1847
                    pe_commands.CommandCreate,  # type: ignore[arg-type]
                    dict_command,
                ),
            )
            commands_list.append(translated_obj)
        return commands_list
