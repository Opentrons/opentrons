"""Custom encoder."""

import json
from enum import Enum

class EnumEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        return json.JSONEncoder.default(self, obj)

