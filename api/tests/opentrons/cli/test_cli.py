"""Test cli execution."""
import json
import tempfile

from typing import Any, Iterator, List, Tuple
from pathlib import Path

import pytest
from click.testing import CliRunner

from opentrons.cli.analyze import analyze


def _list_fixtures(version: int) -> Iterator[Path]:
    return Path(__file__).parent.glob(
        f"../../../../shared-data/protocol/fixtures/{version}/*.json"
    )


def _get_analysis_result(protocol_files: List[Path]) -> Tuple[int, Any]:
    """Run `protocol_files` as a single protocol through the analysis CLI.

    Returns:
        A tuple (exit_code, analysis_json_dict).
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        analysis_output_file = Path(temp_dir) / "analysis_output.json"
        runner = CliRunner()
        exit_code = runner.invoke(
            analyze,
            [
                "--json-output",
                str(analysis_output_file),
                *[str(p.resolve()) for p in protocol_files],
            ],
        ).exit_code
        return exit_code, json.loads(analysis_output_file.read_bytes())


@pytest.mark.parametrize("fixture_path", _list_fixtures(6))
def test_analyze(
    fixture_path: Path,
) -> None:
    """Should return with no errors and a non-empty output."""
    exit_code, analysis_output_json = _get_analysis_result([fixture_path])

    assert exit_code == 0

    assert "robotType" in analysis_output_json
    assert "pipettes" in analysis_output_json
    assert "commands" in analysis_output_json
    assert "labware" in analysis_output_json
    assert "liquids" in analysis_output_json
    assert "modules" in analysis_output_json
