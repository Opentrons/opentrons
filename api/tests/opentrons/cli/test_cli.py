import subprocess
import pytest
from shutil import which
from typing import List
from pathlib import Path

from opentrons.cli.analyze import analyze
from click.testing import CliRunner


def list_fixtures(version: int) -> List[Path]:
    base = (
        Path(__file__).parent
        / ".."
        / ".."
        / ".."
        / ".."
        / "shared-data"
        / "protocol"
        / "fixtures"
        / f"{version}"
    )
    return list(base.iterdir())


@pytest.mark.parametrize("defpath", list_fixtures(5))
async def test_cli_executes_analyze(defpath: Path) -> None:
    """Should call analyze command and execute with no errors."""
    if which('opentrons') is None:
        subprocess.run('make sdist wheel', shell=True)
        subprocess.run('pip install --find-links=./api/dist opentrons', shell=True)
    out = subprocess.run(['python', '-m', 'opentrons.cli', 'analyze', str(defpath.resolve()), '--json-output', '/dev/stdout'], capture_output=True, text=True)

    assert out.returncode == 0
    # Should I assert that its type StateSummery? should I assert the whole response object?
    assert out.stdout is not None


@pytest.mark.parametrize("defpath", list_fixtures(5))
def test_analyze(defpath: Path) -> None:
    """Should return a StateSummery object."""
    runner = CliRunner()
    result = runner.invoke(analyze, [str(defpath.resolve()), '--json-output', '/dev/stdout'])

    assert result.exit_code == 0
    assert result.output is not None