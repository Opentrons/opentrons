"""Test cli execution."""
import json
import tempfile
import textwrap

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


_DECK_DEFINITION_TEST_SLOT = 2
_DECK_DEFINITION_TEST_LABWARE = "agilent_1_reservoir_290ml"
_DECK_DEFINITION_TEST_WELL = "A1"


def _get_deck_definition_test_source(robot_type: str) -> str:
    return textwrap.dedent(
        f"""\
        requirements = {{
            "apiLevel": "2.14",
            "robotType": "{robot_type}",
        }}
        def run(protocol):
            labware = protocol.load_labware(
                "{_DECK_DEFINITION_TEST_LABWARE}",
                "{_DECK_DEFINITION_TEST_SLOT}",
            )
            test_point = labware["{_DECK_DEFINITION_TEST_WELL}"].top().point
            protocol.comment(str(test_point))
        """
    )


@pytest.mark.parametrize(
    ("robot_type", "expected_point"),
    [
        # These expected_point values were copied from known-good analysis outputs.
        # The exact values don't matter much for this test, since we're not checking positional
        # accuracy here. They just need to be clearly different between the OT-2 and OT-3.
        ("OT-2", "(196.38, 42.785, 44.04)"),
        ("OT-3", "(227.88, 42.785, 44.04)"),
    ],
)
def test_analysis_deck_definition(
    robot_type: str,
    expected_point: str,
    tmp_path: Path,
) -> None:
    """Test that the analysis uses the appropriate deck definition for the protocol's robot type.

    At the time of writing, the only official, public, documented way to observe the deck definition
    that a protocol uses is for the protocol to load a labware and inspect the deck coordinates of
    its wells.
    """
    protocol_source_file = Path(tmp_path) / "protocol.py"
    protocol_source_file.write_text(
        _get_deck_definition_test_source(
            robot_type=robot_type,
        )
    )

    exit_code, analysis_output_json = _get_analysis_result([protocol_source_file])

    assert exit_code == 0

    [load_labware_command, comment_command] = analysis_output_json["commands"]
    _ = load_labware_command

    # todo(mm, 2023-05-12): When protocols emit true Protocol Engine comment commands instead
    # of legacy commands, "legacyCommandText" should change to "message".
    assert comment_command["params"]["legacyCommandText"] == expected_point
