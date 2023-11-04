"""Custom encoder."""

import json
from enum import Enum
from typing import Any

class EnumEncoder(json.JSONEncoder):
    def default(self, obj: Any):
        if isinstance(obj, Enum):
            return obj.value
        return json.JSONEncoder.default(self, obj)

