"""
opentrons_shared_data.protocol: types and bindings for json protocols
"""
import json
from typing import Any, NewType, Dict

from .. import load_shared_data

Schema = NewType("Schema", Dict[str, Any])


def load_schema(version: int) -> "Schema":
    return json.loads(load_shared_data(f"protocol/schema/{version}.json"))
