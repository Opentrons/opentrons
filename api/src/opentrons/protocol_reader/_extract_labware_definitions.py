import json
from pathlib import Path
from typing import List

import anyio

from opentrons.protocols.models import LabwareDefinition

from .protocol_source import ProtocolFileRole, ProtocolSource, ProtocolType


async def extract_labware_definitions(
    protocol_source: ProtocolSource,
) -> List[LabwareDefinition]:
    """Extract all the labware definitions that are in the given protocol source.

    This accounts for differences between JSON protocols,
    which embed their labware definitions in the main protocol file,
    and Python protocols, which have them in separate sidecar files.
    """
    if protocol_source.config.protocol_type == ProtocolType.JSON:
        return await _extract_from_json_protocol_file(path=protocol_source.main_file)
        # Ignore separate labware files.

    else:
        assert protocol_source.config.protocol_type == ProtocolType.PYTHON
        return [
            await _extract_from_labware_file(file.path)
            for file in protocol_source.files
            if file.role == ProtocolFileRole.LABWARE
        ]


async def _extract_from_labware_file(path: Path) -> LabwareDefinition:
    return await anyio.to_thread.run_sync(LabwareDefinition.parse_file, path)


async def _extract_from_json_protocol_file(path: Path) -> List[LabwareDefinition]:
    def extract_sync(path: Path) -> List[LabwareDefinition]:
        with path.open("rb") as file:
            json_contents = json.load(file)
            # Rely on the file conforming to one of our JSON protocol schemas 3 to 7,
            # which require this labwareDefinitions key.
            unvalidated_definitions = json_contents["labwareDefinitions"].values()
            validated_definitions = [
                LabwareDefinition.parse_obj(u) for u in unvalidated_definitions
            ]
            return validated_definitions

    return await anyio.to_thread.run_sync(extract_sync, path)
