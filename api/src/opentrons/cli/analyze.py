"""Opentrons analyze CLI."""
import click

from anyio import run, Path as AsyncPath
from datetime import datetime, timezone
from pathlib import Path
from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Sequence, Union
from typing_extensions import Literal

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_reader import (
    ProtocolReader,
    ProtocolFileRole,
    ProtocolType,
    JsonProtocolConfig,
    ProtocolFilesInvalidError,
)
from opentrons.protocol_runner import create_simulating_runner
from opentrons.protocol_engine import (
    Command,
    ErrorOccurrence,
    LoadedLabware,
    LoadedPipette,
    LoadedModule,
    Liquid,
)


@click.command()
@click.argument(
    "files",
    nargs=-1,
    required=True,
    type=click.Path(exists=True, path_type=Path, file_okay=True, dir_okay=True),
)
@click.option(
    "--json-output",
    help="Return analysis results as machine-readable JSON.",
    type=click.Path(path_type=AsyncPath),
)
def analyze(files: Sequence[Path], json_output: Optional[Path]) -> None:
    """Analyze a protocol.

    You can use `opentrons analyze` to get a protocol's expected
    equipment and commands.
    """
    run(_analyze, files, json_output)


def _get_input_files(files_and_dirs: Sequence[Path]) -> List[Path]:
    results: List[Path] = []

    for entry in files_and_dirs:
        if entry.is_dir():
            results.extend(entry.glob("**/*"))
        else:
            results.append(entry)

    return results


async def _analyze(
    files_and_dirs: Sequence[Path],
    json_output: Optional[AsyncPath],
) -> None:
    input_files = _get_input_files(files_and_dirs)

    try:
        protocol_source = await ProtocolReader().read_saved(
            files=input_files,
            directory=None,
        )
    except ProtocolFilesInvalidError as error:
        raise click.ClickException(str(error))

    runner = await create_simulating_runner()
    analysis = await runner.run(protocol_source)

    if json_output:
        results = AnalyzeResults(
            createdAt=datetime.now(tz=timezone.utc),
            files=[
                ProtocolFile(name=f.path.name, role=f.role)
                for f in protocol_source.files
            ],
            config=(
                JsonConfig(schemaVersion=protocol_source.config.schema_version)
                if isinstance(protocol_source.config, JsonProtocolConfig)
                else PythonConfig(apiVersion=protocol_source.config.api_version)
            ),
            metadata=protocol_source.metadata,
            commands=analysis.commands,
            errors=analysis.state_summary.errors,
            labware=analysis.state_summary.labware,
            pipettes=analysis.state_summary.pipettes,
            modules=analysis.state_summary.modules,
            liquids=analysis.state_summary.liquids,
        )

        await json_output.write_text(
            results.json(exclude_none=True),
            encoding="utf-8",
        )

    else:
        raise click.UsageError(
            "Currently, this tool only supports JSON mode. Use `--json-output`."
        )


class ProtocolFile(BaseModel):
    """A file in a protocol analysis."""

    name: str
    role: ProtocolFileRole


class JsonConfig(BaseModel):
    """Configuration of a JSON protocol."""

    protocolType: Literal[ProtocolType.JSON] = ProtocolType.JSON
    schemaVersion: int


class PythonConfig(BaseModel):
    """Configuration of a Python protocol."""

    protocolType: Literal[ProtocolType.PYTHON] = ProtocolType.PYTHON
    apiVersion: APIVersion


class AnalyzeResults(BaseModel):
    """Results of a protocol analysis."""

    createdAt: datetime
    files: List[ProtocolFile]
    config: Union[JsonConfig, PythonConfig]
    metadata: Dict[str, Any]
    commands: List[Command]
    labware: List[LoadedLabware]
    pipettes: List[LoadedPipette]
    modules: List[LoadedModule]
    liquids: List[Liquid]
    errors: List[ErrorOccurrence]
