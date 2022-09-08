import subprocess
from shutil import which

from opentrons.cli.analyze import analyze
from click.testing import CliRunner

async def test_cli_executes_analyze() -> None:
    """Should call analyze command and execute with no errors."""
    if which('opentrons') is None:
        subprocess.run('make sdist wheel', shell=True)
        subprocess.run('pip install --find-links=./api/dist opentrons', shell=True)
    out = subprocess.run(['python', '-m', 'opentrons.cli', 'analyze', '/Users/tamarzanzouri/opentrons/shared-data/protocol/fixtures/5/simpleV5.json', '--json-output', '/dev/stdout'], capture_output=True, text=True)

    assert out.returncode == 0
    # Should I assert that its type StateSummery? should I assert the whole response object?
    assert out.stdout is not None


def test_analyze() -> None:
    """Should return a StateSummery object."""
    runner = CliRunner()
    result = runner.invoke(analyze, ['/Users/tamarzanzouri/opentrons/shared-data/protocol/fixtures/5/simpleV5.json', '--json-output', '/dev/stdout'])
    assert result.exit_code == 0
    assert result.output is not None