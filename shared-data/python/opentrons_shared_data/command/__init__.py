""" opentrons_shared_data.module: functions and types for module defs """
from pathlib import Path
import json
import os
import re

from ..load import load_shared_data, get_shared_data_root


def get_newest_schema_version() -> str:
    command_schemas_dir = get_shared_data_root() / "command" / "schemas"
    command_schemas = os.listdir(command_schemas_dir)
    return str(max(re.match(r"(\d+).json", v).group(1) for v in command_schemas))


def load_schema_string(version: str) -> str:
    path = Path("command") / "schemas" / f"{version}.json"
    return json.dumps(json.loads(load_shared_data(path)), indent=2)
