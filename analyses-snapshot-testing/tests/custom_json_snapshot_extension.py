import re

from syrupy.extensions.json import JSONSnapshotExtension


class CustomJSONSnapshotExtension(JSONSnapshotExtension):
    def __init__(self) -> None:
        super().__init__()
        self.replacement_patterns = {
            "detail": [
                (r"moduleId='[^']+'", "moduleId='UUID'"),
            ],
            "offsetId": [
                (r"offsetId='[^']+'", "offsetId='UUID'"),
            ],
            "traceback": [
                (r"line \d+,", "line N,"),
            ],
        }

    def serialize(self, data: object, **kwargs) -> str:  # type: ignore
        processed_data = self.preprocess_data(data)
        return str(super().serialize(processed_data, **kwargs))

    def preprocess_data(self, data: object) -> object:
        if isinstance(data, dict):
            return {k: self.preprocess_data(v) if k not in self.replacement_patterns else self.process_field(k, v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.preprocess_data(v) for v in data]
        return data

    def process_field(self, key: str, value: str) -> str:
        patterns = self.replacement_patterns.get(key, [])
        for pattern, replacement in patterns:
            value = re.sub(pattern, replacement, value)
        return value
