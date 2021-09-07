from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Union


class PreAnalyzer:
    @staticmethod
    def analyze(
        protocol_files: List[Path],
    ) -> Union["PythonPreAnalysis", "JsonPreAnalysis"]:
        raise NotImplementedError()


Metadata = Dict[str, Any]
"""A protocol's metadata: non-essential info, like author and title.

Robot software should not change how it handles a protocol depending on anything in
here.

This must be a dict of simple types serializable to JSON via ``json.dumps()``.
``Dict[str, Any]`` is an overly-permissive approximation needed because mypy doesn't
support recursive types.
"""


@dataclass(frozen=True)
class PythonPreAnalysis:
    metadata: Metadata
    api_level: str


@dataclass(frozen=True)
class JsonPreAnalysis:
    metadata: Metadata
