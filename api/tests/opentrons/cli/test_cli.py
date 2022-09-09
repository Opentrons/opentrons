"""Test cli execution."""
from typing import List
from pathlib import Path

import pytest
from click.testing import CliRunner

from opentrons.cli.analyze import analyze


def _list_fixtures(version: int) -> List[Path]:
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


@pytest.mark.parametrize("defpath", _list_fixtures(5))
def test_analyze(defpath: Path) -> None:
    """Should return with no errors and a none empty output."""
    runner = CliRunner()
    result = runner.invoke(
        analyze, [str(defpath.resolve()), "--json-output", "/dev/stdout"]
    )

    assert result.exit_code == 0
    # TODO (tz, 9-8-22): should probably assert that expected props are in dict
    assert result.output is not None
