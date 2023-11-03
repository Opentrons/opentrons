"""opentrons_shared_data.command: functions command schemas."""
from pathlib import Path
import json
import os
import re

from opentrons_shared_data.errors.exceptions import InvalidProtocolData, PythonException

from ..load import load_shared_data, get_shared_data_root

SCHEMA_REF_VERSION_RE = re.compile(r"opentronsCommandSchemaV(\d+)")


def get_newest_schema_version() -> str:
    """Get the version string of the most modern command schema currently in shared-data."""
    command_schemas_dir = get_shared_data_root() / "command" / "schemas"
    command_schemas = os.listdir(command_schemas_dir)
    all_schema_versions = []
    for schema_file_name in command_schemas:
        schema_version_match = re.match(r"(\d+).json", schema_file_name)
        if schema_version_match is not None:
            all_schema_versions.append(schema_version_match.group(1))

    return str(max(all_schema_versions))


def load_schema_string(version: str) -> str:
    """Get the string containing the command JSON schema for the given version string."""
    path = Path("command") / "schemas" / f"{version}.json"
    try:
        return json.dumps(json.loads(load_shared_data(path)), indent=2)
    except OSError as ose:
        raise InvalidProtocolData(
            message=f"Command schema version {version} is not available",
            detail={
                "type": "bad-schema-version",
                "schema-kind": "command",
                "version": version,
            },
            wrapping=[PythonException(ose)],
        )


def schema_version_from_ref(ref: str) -> str:
    """Parse the command schema version from a command schema ref."""
    version = SCHEMA_REF_VERSION_RE.match(ref)
    if not version:
        raise InvalidProtocolData(
            message=f"Could not parse version from command schema ${ref}",
            detail={"ref": ref, "type": "bad-schema-ref", "schema-kind": "command"},
        )
    return version.group(1)
