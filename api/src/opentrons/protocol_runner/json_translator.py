"""Translation of JSON protocol commands into ProtocolEngine commands."""
from typing import cast, List, Union
from pydantic import parse_obj_as

from opentrons_shared_data.pipette.types import PipetteNameType
from opentrons_shared_data.protocol.models import (
    ProtocolSchemaV6,
    protocol_schema_v6,
    ProtocolSchemaV7,
    protocol_schema_v7,
    ProtocolSchemaV8,
    protocol_schema_v8,
)
from opentrons_shared_data import command as command_schema

from opentrons.types import MountType
from opentrons.protocol_engine import (
    commands as pe_commands,
    LabwareLocation,
    ModuleModel,
    DeckSlotLocation,
    Liquid,
)
from opentrons.protocol_engine.types import HexColor


class CommandTranslatorError(Exception):
    """An error raised to indicate an internal programmer error."""

    pass


def _translate_labware_command(
    protocol: ProtocolSchemaV6,
    command: protocol_schema_v6.Command,
) -> pe_commands.LoadLabwareCreate:
    labware_id = command.params.labwareId
    # v6 data model supports all commands and therefor most props are optional.
    # load labware command must contain labware_id and definition_id.
    assert labware_id is not None
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
                # https://github.com/samuelcolvin/pydantic/issues/1847
                LabwareLocation,  # type: ignore[arg-type]
                command.params.location,
            ),
        ),
        key=command.key,
    )
    return labware_command


def _translate_v7_labware_command(
    command: protocol_schema_v7.Command,
) -> pe_commands.LoadLabwareCreate:
    labware_id = command.params.labwareId
    # v7 data model supports all commands and therefor most props are optional.
    # load labware command must contain labware_id and definition_id.
    assert labware_id is not None
    assert command.params.version is not None
    assert command.params.namespace is not None
    assert command.params.loadName is not None

    labware_command = pe_commands.LoadLabwareCreate(
        params=pe_commands.LoadLabwareParams(
            labwareId=command.params.labwareId,
            displayName=command.params.displayName,
            version=command.params.version,
            namespace=command.params.namespace,
            loadName=command.params.loadName,
            location=parse_obj_as(
                # https://github.com/samuelcolvin/pydantic/issues/1847
                LabwareLocation,  # type: ignore[arg-type]
                command.params.location,
            ),
        ),
        key=command.key,
    )
    return labware_command


def _translate_module_command(
    protocol: ProtocolSchemaV6,
    command: protocol_schema_v6.Command,
) -> pe_commands.CommandCreate:
    module_id = command.params.moduleId
    modules = protocol.modules
    # v6 data model supports all commands and therefor most props are optional.
    # load module command must contain module_id. modules cannot be None.
    assert module_id is not None
    assert modules is not None
    translated_obj = pe_commands.LoadModuleCreate(
        params=pe_commands.LoadModuleParams(
            model=ModuleModel(modules[module_id].model),
            location=DeckSlotLocation.parse_obj(command.params.location),
            moduleId=command.params.moduleId,
        ),
        key=command.key,
    )
    return translated_obj


def _translate_v7_module_command(
    command: protocol_schema_v7.Command,
) -> pe_commands.CommandCreate:
    module_id = command.params.moduleId
    # v7 data model supports all commands and therefor most props are optional.
    # load module command must contain module_id. modules cannot be None.
    assert module_id is not None
    assert command.params.model is not None
    translated_obj = pe_commands.LoadModuleCreate(
        params=pe_commands.LoadModuleParams(
            model=ModuleModel(command.params.model),
            location=DeckSlotLocation.parse_obj(command.params.location),
            moduleId=command.params.moduleId,
        ),
        key=command.key,
    )
    return translated_obj


def _translate_pipette_command(
    protocol: ProtocolSchemaV6,
    command: protocol_schema_v6.Command,
) -> pe_commands.CommandCreate:
    pipette_id = command.params.pipetteId
    # v6 data model supports all commands and therefor most props are optional.
    # load pipette command must contain pipette_id.
    assert pipette_id is not None
    translated_obj = pe_commands.LoadPipetteCreate(
        params=pe_commands.LoadPipetteParams(
            pipetteName=PipetteNameType(protocol.pipettes[pipette_id].name),
            mount=MountType(command.params.mount),
            pipetteId=command.params.pipetteId,
        ),
        key=command.key,
    )
    return translated_obj


def _translate_v7_pipette_command(
    command: protocol_schema_v7.Command,
) -> pe_commands.CommandCreate:
    pipette_id = command.params.pipetteId
    # v7 data model supports all commands and therefor most props are optional.
    # load pipette command must contain pipette_id.
    assert pipette_id is not None
    assert command.params.pipetteName is not None
    translated_obj = pe_commands.LoadPipetteCreate(
        params=pe_commands.LoadPipetteParams(
            pipetteName=PipetteNameType(command.params.pipetteName),
            mount=MountType(command.params.mount),
            pipetteId=command.params.pipetteId,
        ),
        key=command.key,
    )
    return translated_obj


def _translate_simple_command(
    command: Union[
        protocol_schema_v6.Command,
        protocol_schema_v7.Command,
        protocol_schema_v8.Command,
    ]
) -> pe_commands.CommandCreate:
    dict_command = command.dict(exclude_none=True)

    # map deprecated `delay` commands to `waitForResume` / `waitForDuration`
    if dict_command["commandType"] == "delay":
        if "waitForResume" in dict_command["params"]:
            dict_command["commandType"] = "waitForResume"
        else:
            dict_command["commandType"] = "waitForDuration"

    translated_obj = cast(
        pe_commands.CommandCreate,
        parse_obj_as(
            # https://github.com/samuelcolvin/pydantic/issues/1847
            pe_commands.CommandCreate,  # type: ignore[arg-type]
            dict_command,
        ),
    )
    return translated_obj


class JsonTranslator:
    """Class that translates commands/liquids from PD/JSON to ProtocolEngine."""

    def translate_liquids(
        self, protocol: Union[ProtocolSchemaV6, ProtocolSchemaV7]
    ) -> List[Liquid]:
        """Takes json protocol v6 and translates liquids->protocol engine liquids."""
        protocol_liquids = protocol.liquids or {}

        return [
            Liquid(
                id=liquid_id,
                displayName=liquid.displayName,
                description=liquid.description,
                displayColor=HexColor(__root__=liquid.displayColor)
                if liquid.displayColor is not None
                else None,
            )
            for liquid_id, liquid in protocol_liquids.items()
        ]

    def translate_commands(
        self,
        protocol: Union[ProtocolSchemaV8, ProtocolSchemaV7, ProtocolSchemaV6],
    ) -> List[pe_commands.CommandCreate]:
        """Takes json protocol and translates commands->protocol engine commands."""
        if isinstance(protocol, ProtocolSchemaV6):
            return self._translate_v6_commands(protocol)
        elif isinstance(protocol, ProtocolSchemaV7):
            return self._translate_v7_commands(protocol)
        else:
            return self._translate_v8_commands(protocol)

    def _translate_v6_commands(
        self,
        protocol: ProtocolSchemaV6,
    ) -> List[pe_commands.CommandCreate]:
        """Takes json protocol v6 and translates commands->protocol engine commands."""
        commands_list: List[pe_commands.CommandCreate] = []
        for command in protocol.commands:
            if command.commandType == "loadPipette":
                translated_obj = _translate_pipette_command(protocol, command)
            elif command.commandType == "loadModule":
                translated_obj = _translate_module_command(protocol, command)
            elif command.commandType == "loadLabware":
                translated_obj = _translate_labware_command(protocol, command)
            else:
                translated_obj = _translate_simple_command(command)
            commands_list.append(translated_obj)
        return commands_list

    def _translate_v7_commands(
        self,
        protocol: Union[ProtocolSchemaV7],
    ) -> List[pe_commands.CommandCreate]:
        """Takes json protocol v7 and translates commands->protocol engine commands."""
        commands_list: List[pe_commands.CommandCreate] = []
        for command in protocol.commands:
            translated_obj = _translate_simple_command(command)
            commands_list.append(translated_obj)
        return commands_list

    def _translate_v8_commands(
        self, protocol: ProtocolSchemaV8
    ) -> List[pe_commands.CommandCreate]:
        """Translate commands in json protocol schema v8, which might be of different command schemas."""
        command_schema_ref = protocol.commandSchemaId
        # these calls will raise if the command schema version is invalid or unknown
        command_schema_version = command_schema.schema_version_from_ref(
            command_schema_ref
        )
        command_schema_string = command_schema.load_schema_string(  # noqa: F841
            command_schema_version
        )

        return [_translate_simple_command(command) for command in protocol.commands]
