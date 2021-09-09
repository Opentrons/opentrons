# noqa: D100

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Union


class PreAnalyzer:  # noqa: D101
    @staticmethod
    def analyze(  # noqa: D102
        protocol_files: List[Path],
    ) -> Union["PythonPreAnalysis", "JsonPreAnalysis"]:
        if len(protocol_files) == 0:
            raise ProtocolNotPreAnalyzableError("Protocol must have at least one file.")
        elif len(protocol_files) > 1:
            # TODO(mm, 2021-09-07): add multi-file support
            raise NotImplementedError("Multi-file protocols not yet supported.")

        main_file = protocol_files[0]
        suffix = main_file.suffix

        if suffix == ".json":
            raise NotImplementedError()
        elif suffix == ".py":
            raise NotImplementedError()
        else:
            raise ProtocolNotPreAnalyzableError(f'Unrecognized file suffix "{suffix}"')


Metadata = Dict[str, Any]
"""A protocol's metadata (non-essential info, like author and title).

Robot software should not change how it handles a protocol depending on anything in
here.

This must be a simple JSON-like dict, serializable to JSON via ``json.dumps()``.
``Dict[str, Any]`` is an overly-permissive approximation, needed because mypy doesn't
support recursive types.
"""


@dataclass(frozen=True)
class PythonPreAnalysis:  # noqa: D101
    metadata: Metadata
    api_level: str


@dataclass(frozen=True)
class JsonPreAnalysis:  # noqa: D101
    metadata: Metadata


class ProtocolNotPreAnalyzableError(Exception):
    """Raised when an error in the protocol prevents pre-analysis."""


class JsonParseError(ProtocolNotPreAnalyzableError):
    """Raised when an apparent JSON protocol isn't actually parseable as JSON."""


class JsonSchemaValidationError(ProtocolNotPreAnalyzableError):
    """Raised when an apparent JSON protocol doesn't conform to our schema."""
