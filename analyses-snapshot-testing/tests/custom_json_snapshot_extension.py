import re
from typing import Any, Dict, List, Tuple, Union

from syrupy.extensions.json import JSONSnapshotExtension

ReplacementPatterns = Dict[str, List[Tuple[str, str]]]


class CustomJSONSnapshotExtension(JSONSnapshotExtension):
    def __init__(self) -> None:
        super().__init__()
        self.replacement_patterns: ReplacementPatterns = {
            "detail": [
                (r"moduleId='[^']+'", "moduleId='UUID'"),
            ],
            "traceback": [
                (r"line \d+,", "line N,"),
                # A single, smarter pattern for project paths on all platforms
                (
                    r"((?:[a-zA-Z]:\\[Uu]sers\\[^\\\"']+|/Users/[^/\"']+)[/\\]github[/\\]opentrons[/\\]opentrons|/home/runner/work/opentrons/opentrons)[^\s\"]*",
                    "<PATH>",
                ),
            ],
            "obj": [
                (r"(<[\w\.]+ object at 0x)[0-9a-fA-F]+(>)", r"\1UUID\2"),
            ],
        }
        self.id_keys_to_replace = [
            "id",
            "pipetteId",
            "labwareId",
            "serialNumber",
            "moduleId",
            "liquidId",
            "offsetId",
            "lidId",
            "liquidClassId",
            "labwareIds",
            "primaryLabwareId",
            "lidLabwareId",
            "stackLabwareId",
            "lid_id",
        ]
        self.timestamp_keys_to_replace = [
            "createdAt",
            "startedAt",
            "completedAt",
            "lastModified",
            "created",
        ]

    def serialize(self, data: Any, **kwargs: Any) -> str:
        processed_data = self.preprocess_data(data)
        return str(super().serialize(processed_data, **kwargs))

    def preprocess_data(self, data: Any) -> Any:
        if isinstance(data, dict):
            return {k: self.process_field(k, self.preprocess_data(v)) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.preprocess_data(v) for v in data]
        return data

    def process_field(self, key: str, value: Union[str, Any]) -> Union[str, Any]:
        # Do not inspect the "files" key
        # Then we can always just use all the custom labware for each analysis.
        # If we don't do this, anytime we add custom labware,
        # all protocol snapshots will be altered.
        if key == "files":
            return []
        if key in self.id_keys_to_replace:
            if isinstance(value, list):
                return ["UUID"] * len(value)
            return "UUID"
        if key in self.timestamp_keys_to_replace:
            return "TIMESTAMP"
        if isinstance(value, str):
            patterns = self.replacement_patterns.get(key, [])
            for pattern, replacement in patterns:
                value = re.sub(pattern, replacement, value)
        return value
