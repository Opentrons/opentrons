"""File format validation interface."""


from typing import Iterable

import anyio
from pydantic import ValidationError as PydanticValidationError

from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.protocol.models import (
    ProtocolSchemaV6 as JsonProtocolV6,
    ProtocolSchemaV7 as JsonProtocolV7,
    ProtocolSchemaV8 as JsonProtocolV8,
)
from opentrons_shared_data.errors.exceptions import PythonException

from opentrons.protocols.models import JsonProtocol as JsonProtocolUpToV5

from .file_identifier import (
    IdentifiedFile,
    IdentifiedJsonMain,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
    IdentifiedData,
)
from .protocol_files_invalid_error import ProtocolFilesInvalidError


class FileFormatValidationError(ProtocolFilesInvalidError):
    """Raised when a file does not conform to the format it's supposed to."""


class FileFormatValidator:
    """File format validation interface."""

    @staticmethod
    async def validate(files: Iterable[IdentifiedFile]) -> None:
        """Validate that each file actually conforms to the format we think it does."""
        for file in files:
            if isinstance(file, IdentifiedJsonMain):
                await _validate_json_protocol(file)
            elif isinstance(file, IdentifiedPythonMain):
                pass  # No more validation to do for Python protocols.
            elif isinstance(file, IdentifiedLabwareDefinition):
                await _validate_labware_definition(file)
            elif isinstance(file, IdentifiedData):
                pass  # No more validation to do for bundled data files.


async def _validate_labware_definition(info: IdentifiedLabwareDefinition) -> None:
    def validate_sync() -> None:
        try:
            LabwareDefinition.parse_obj(info.unvalidated_json)
        except PydanticValidationError as e:
            raise FileFormatValidationError(
                message=f"{info.original_file.name} could not be read as a labware definition.",
                detail={"kind": "bad-labware-definition"},
                wrapping=[PythonException(e)],
            ) from e

    await anyio.to_thread.run_sync(validate_sync)


async def _validate_json_protocol(info: IdentifiedJsonMain) -> None:
    def validate_sync() -> None:
        try:
            if info.schema_version == 8:
                JsonProtocolV8.parse_obj(info.unvalidated_json)
            elif info.schema_version == 7:
                JsonProtocolV7.parse_obj(info.unvalidated_json)
            elif info.schema_version == 6:
                JsonProtocolV6.parse_obj(info.unvalidated_json)
            else:
                JsonProtocolUpToV5.parse_obj(info.unvalidated_json)
        except PydanticValidationError as e:
            raise FileFormatValidationError(
                message=f"{info.original_file.name} could not be read as a JSON protocol.",
                detail={"kind": "bad-json-protocol"},
                wrapping=[PythonException(e)],
            ) from e

    await anyio.to_thread.run_sync(validate_sync)
