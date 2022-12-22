from typing import Iterable

import anyio

from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.protocol.models import ProtocolSchemaV6 as JsonProtocolV6

from opentrons.protocols.models import JsonProtocol as JsonProtocolUpToV5

from .file_identifier import (
    FileInfo,
    JsonProtocolFileInfo,
    PythonProtocolFileInfo,
    LabwareDefinitionFileInfo,
)


class FileFormatValidator:
    @staticmethod
    async def validate(files: Iterable[FileInfo]) -> None:
        for file in files:
            if isinstance(file, JsonProtocolFileInfo):
                await _validate_json_protocol(file)
            elif isinstance(file, PythonProtocolFileInfo):
                pass  # No more validation to do for Python protocols.
            elif isinstance(file, LabwareDefinitionFileInfo):
                await _validate_labware_definition(file)


async def _validate_labware_definition(info: LabwareDefinitionFileInfo) -> None:
    def validate_sync() -> None:
        LabwareDefinition.parse_obj(info.unvalidated_json)

    await anyio.to_thread.run_sync(validate_sync)
    # FIX BEFORE MERGE: Wrap exception?


async def _validate_json_protocol(info: JsonProtocolFileInfo) -> None:
    def validate_v6_sync() -> None:
        JsonProtocolV6.parse_obj(info.unvalidated_json)

    def validate_up_to_v5_sync() -> None:
        JsonProtocolUpToV5.parse_obj(info.unvalidated_json)

    if info.schema_version == 6:
        await anyio.to_thread.run_sync(validate_v6_sync)
    else:
        await anyio.to_thread.run_sync(validate_up_to_v5_sync)
    # FIX BEFORE MERGE: Wrap exception?
