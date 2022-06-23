"""Input file config analysis."""
import ast
from dataclasses import dataclass
from typing import Union

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.parse import extract_metadata as extract_python_metadata
from opentrons.protocols.models import JsonProtocol as ProtocolSchemaV5
from opentrons_shared_data.protocol.models import ProtocolSchemaV6

from .protocol_source import Metadata, PythonProtocolConfig, JsonProtocolConfig
from .role_analyzer import RoleAnalysisFile


@dataclass(frozen=True)
class ConfigAnalysis:
    """Protocol config analyzed from main file."""

    metadata: Metadata
    config: Union[PythonProtocolConfig, JsonProtocolConfig]


class ConfigAnalysisError(ValueError):
    """Error raised if protocol config can not be determined."""


class ConfigAnalyzer:
    """Input file config analysis interface."""

    @staticmethod
    def analyze(main_file: RoleAnalysisFile) -> ConfigAnalysis:
        """Analyze the main file of a protocol to identify its config and metadata."""
        if isinstance(main_file.data, (ProtocolSchemaV5, ProtocolSchemaV6)):
            return ConfigAnalysis(
                metadata=main_file.data.metadata.dict(exclude_none=True),
                config=JsonProtocolConfig(schema_version=main_file.data.schemaVersion),
            )

        else:
            return _analyze_python(main_file)


# todo(mm, 2021-09-13): Deduplicate with opentrons.protocols.parse.
def _analyze_python(main_file: RoleAnalysisFile) -> ConfigAnalysis:  # noqa: C901
    assert main_file.name.lower().endswith(".py"), "Expected main_file to be Python"

    try:
        # todo(mm, 2021-09-13): Investigate whether it's really appropriate to leave
        # the Python compilation flags at their defaults. For example, we probably
        # don't truly want the protocol to inherit our own __future__ features.
        module_ast = ast.parse(source=main_file.contents, filename=main_file.name)
    except (SyntaxError, ValueError) as e:
        # ast.parse() raises SyntaxError for most errors,
        # but ValueError if the source contains null bytes.
        raise ConfigAnalysisError(f"Unable to parse {main_file.name}.") from e

    try:
        metadata = extract_python_metadata(module_ast)
    except ValueError as e:
        raise ConfigAnalysisError(
            f"Unable to extract metadata from {main_file.name}."
        ) from e

    try:
        api_level = metadata["apiLevel"]
    except KeyError as e:
        raise ConfigAnalysisError(
            "metadata.apiLevel missing or not statically analyzable"
            f" in {main_file.name}."
        ) from e

    if not isinstance(api_level, str):
        raise ConfigAnalysisError(
            f"metadata.apiLevel must be a string, but it instead has type"
            f' "{type(api_level)}" in {main_file.name}.'
        )

    try:
        api_version = APIVersion.from_string(api_level)
    except ValueError as e:
        raise ConfigAnalysisError(
            f'metadata.apiLevel "{api_level}" is not of the format X.Y'
            f" in {main_file.name}."
        ) from e

    if api_version > MAX_SUPPORTED_VERSION:
        raise ConfigAnalysisError(
            f"API version {api_version} is not supported by this "
            f"robot software. Please either reduce your requested API "
            f"version or update your robot."
        )

    return ConfigAnalysis(
        metadata=metadata,
        config=PythonProtocolConfig(api_version=api_version),
    )
