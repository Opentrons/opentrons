"""Input file config analysis."""
from dataclasses import dataclass
from typing import Union

from .protocol_source import Metadata, PythonProtocolConfig, JsonProtocolConfig
from .role_analyzer import RoleAnalyzedFile


@dataclass(frozen=True)
class ConfigAnalysis:
    """Protocol config analyzed from main file."""

    metadata: Metadata
    config: Union[PythonProtocolConfig, JsonProtocolConfig]


class ConfigAnalyzer:
    """Input file config analysis interface."""

    @staticmethod
    def analyze(file: RoleAnalyzedFile) -> ConfigAnalysis:
        """Analyze the main file of a protocol to identify its config and metadata."""
        raise NotImplementedError("ConfigAnalyzer not yet implemented")
