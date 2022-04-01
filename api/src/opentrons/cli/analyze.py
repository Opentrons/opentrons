"""Opentrons analyze CLI."""
import click
import json
from anyio import run
from pathlib import Path
from pydantic.json import pydantic_encoder
from typing import List, Sequence

from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner import create_simulating_runner


@click.command()
@click.argument(
    "files",
    nargs=-1,
    required=True,
    type=click.Path(exists=True, path_type=Path, file_okay=True, dir_okay=True),
)
@click.option(
    "--json/--no-json",
    default=False,
    help="Return analysis results as machine-readable JSON.",
)
def analyze(files: Sequence[Path], json: bool) -> None:
    """Analyze a protocol.

    You can use `opentrons analyze` to get a protocol's expected
    equipment and commands.
    """
    run(_analyze, files, json)


def _get_input_files(files_and_dirs: Sequence[Path]) -> List[Path]:
    results: List[Path] = []

    for entry in files_and_dirs:
        if entry.is_dir():
            results.extend(entry.glob("**/*"))
        else:
            results.append(entry)

    return results


async def _analyze(files_and_dirs: Sequence[Path], json_mode: bool) -> None:
    input_files = _get_input_files(files_and_dirs)

    protocol_source = await ProtocolReader().read(input_files)
    runner = await create_simulating_runner()
    results = await runner.run(protocol_source)

    if json_mode:
        click.echo(json.dumps(results, default=pydantic_encoder))
        return

    raise click.UsageError(
        "Currently, this tool only supports JSON mode. Use `--json`."
    )
