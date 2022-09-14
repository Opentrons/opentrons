"""Test cli execution."""
import json

from typing import List
from pathlib import Path

import pytest
from click.testing import CliRunner

from opentrons.cli.analyze import analyze


def _list_fixtures(version: int) -> List[Path]:
    return list(
        Path(__file__).parent.glob(
            f"../../../../shared-data/protocol/fixtures/{version}/*.json"
        )
    )


@pytest.mark.parametrize("defpath", _list_fixtures(6))
def test_analyze(defpath: Path, tmp_path: Path) -> None:
    """Should return with no errors and a non empty output."""
    analysis_output_path = tmp_path / "analysis_output.json"

    runner = CliRunner()
    result = runner.invoke(
        analyze, [str(defpath.resolve()), "--json-output", str(analysis_output_path)]
    )

    analysis_output_json = json.loads(analysis_output_path.read_bytes())

    assert result.exit_code == 0

    assert "pipettes" in analysis_output_json
    assert "commands" in analysis_output_json
    assert "labware" in analysis_output_json
    assert "liquids" in analysis_output_json
    assert "modules" in analysis_output_json
