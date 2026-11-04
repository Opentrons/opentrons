"""Test cli execution."""

import json
import tempfile
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

import pytest
from click.testing import CliRunner

from opentrons.cli.analyze import AnalysisResult, analyze


def _list_fixtures(version: int, robot_type: Optional[str] = None) -> Iterator[Path]:
    paths = Path(__file__).parent.glob(
        f"../../../../shared-data/protocol/fixtures/{version}/*.json"
    )
    if robot_type is None:
        yield from paths
    else:
        for path in paths:
            data = json.loads(path.read_text())
            if data.get("robot", {}).get("model") == robot_type:
                yield path


@dataclass
class _AnalysisCLIResult:
    exit_code: int
    json_output: Optional[Dict[str, Any]]
    stdout_stderr: str


def _get_analysis_result(
    protocol_files: List[Path],
    output_type: str,
    check: bool = False,
    rtp_values: Optional[str] = None,
    rtp_files: Optional[str] = None,
) -> _AnalysisCLIResult:
    """Run `protocol_files` as a single protocol through the analysis CLI.

    Returns:
        A tuple (exit_code, analysis_json_dict_or_none).

        Don't forget to check the status code. Errors from within the analysis CLI will otherwise
        not be propagated!
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        analysis_output_file = Path(temp_dir) / "analysis_output.json"
        runner = CliRunner()
        args = [output_type, str(analysis_output_file)]

        if rtp_values is not None:
            args.extend(["--rtp-values", rtp_values])

        if rtp_files is not None:
            args.extend(["--rtp-files", rtp_files])

        args.extend([str(p.resolve()) for p in protocol_files])

        if check:
            args.append("--check")

        result = runner.invoke(analyze, args)
        if analysis_output_file.exists():
            json_output = json.loads(analysis_output_file.read_bytes())
        else:
            json_output = None
        return _AnalysisCLIResult(
            exit_code=result.exit_code,
            json_output=json_output,
            stdout_stderr=result.output,
        )


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
@pytest.mark.parametrize("fixture_path", _list_fixtures(8, robot_type="OT-3 Standard"))
def test_analyze(
    fixture_path: Path,
    output: str,
) -> None:
    """Should return with no errors and a non-empty output."""
    result = _get_analysis_result([fixture_path], output)

    assert result.exit_code == 0

    assert result.json_output is not None
    assert "robotType" in result.json_output
    assert "pipettes" in result.json_output
    assert "commands" in result.json_output
    assert "labware" in result.json_output
    assert "liquids" in result.json_output
    assert "modules" in result.json_output
    assert "result" in result.json_output


_DECK_DEFINITION_TEST_SLOT = 2
_DECK_DEFINITION_TEST_LABWARE = "agilent_1_reservoir_290ml"
_DECK_DEFINITION_TEST_WELL = "A1"


def _get_deck_definition_test_source(api_level: str, robot_type: str) -> str:
    return textwrap.dedent(
        f"""\
        requirements = {{
            "apiLevel": "{api_level}",
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


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
@pytest.mark.parametrize(
    ("api_level", "robot_type", "expected_point"),
    [
        # These expected_point values were copied from known-good analysis outputs.
        # The exact values don't matter much for this test, since we're not checking positional
        # accuracy here.
        ("2.15", "OT-3", "(227.88, 42.785, 44.04)"),
    ],
)
def test_analysis_deck_definition(
    api_level: str,
    robot_type: str,
    expected_point: str,
    tmp_path: Path,
    output: str,
) -> None:
    """Test that the analysis uses the appropriate deck definition for the protocol's robot type.

    At the time of writing, the only official, public, documented way to observe the deck definition
    that a protocol uses is for the protocol to load a labware and inspect the deck coordinates of
    its wells.
    """
    protocol_source_file = Path(tmp_path) / "protocol.py"
    protocol_source_file.write_text(
        _get_deck_definition_test_source(
            api_level=api_level,
            robot_type=robot_type,
        ),
        encoding="utf-8",
    )

    result = _get_analysis_result([protocol_source_file], output)

    assert result.exit_code == 0

    assert result.json_output is not None
    [home_command, load_labware_command, comment_command] = result.json_output[
        "commands"
    ]

    assert comment_command["params"]["message"] == expected_point


# TODO(mm, 2023-08-12): We can remove this test when we remove special handling for these
# protocols. https://opentrons.atlassian.net/browse/RSS-306
@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_strict_metatada_requirements_validation(tmp_path: Path, output: str) -> None:
    """It should apply strict validation to the metadata and requirements dicts.

    It should reject protocols with questionable metadata and requirements dicts,
    even though these protocols may be accepted by other parts of the system.
    https://opentrons.atlassian.net/browse/RSS-306
    """
    protocol_source = textwrap.dedent(
        """
        # apiLevel in both metadata and requirements
        metadata = {"apiLevel": "2.15"}
        requirements = {"apiLevel": "2.15"}

        def run(protocol):
            pass
        """
    )

    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(protocol_source, encoding="utf-8")

    result = _get_analysis_result([protocol_source_file], output)

    assert result.exit_code != 0

    expected_message = (
        "You may only put apiLevel in the metadata dict or the requirements dict"
    )
    assert expected_message in result.stdout_stderr


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
@pytest.mark.parametrize("check", [True, False])
@pytest.mark.parametrize(
    ("python_protocol_source", "expected_detail"),
    [
        (
            textwrap.dedent(
                # Raises an exception from outside of Opentrons code,
                # in between two PAPI functions.
                """\
                requirements = {"apiLevel": "2.15", "robotType": "OT-3"}  # line 1
                                                                     # line 2
                def run(protocol):                   # line 3
                    protocol.comment(":^)")          # line 4
                    raise RuntimeError(">:(")        # line 5
                    protocol.comment(":D")           # line 6
                """
            ),
            "RuntimeError [line 5]: >:(",
        ),
        (
            textwrap.dedent(
                # Raises an exception from inside a Protocol Engine command.
                # https://opentrons.atlassian.net/browse/RSS-317
                """\
                requirements = {"apiLevel": "2.15", "robotType": "OT-3"}      # line 1
                                                                     # line 2
                def run(protocol):                       # line 3
                    tip_rack = protocol.load_labware(    # line 4
                        "opentrons_flex_96_tiprack_1000ul", 1  # line 5
                    )                                    # line 6
                    pipette = protocol.load_instrument(  # line 7
                        "flex_1channel_1000", "left"     # line 8
                    )                                    # line 9
                    pipette.pick_up_tip(tip_rack["A1"])  # line 10
                    pipette.pick_up_tip(tip_rack["A2"])  # line 11
                """
            ),
            (
                # TODO(mm, 2023-09-12): This is an overly verbose concatenative Frankenstein
                # message. We should simplify our error propagation to trim out the noise.
                "ProtocolCommandFailedError [line 11]:"
                " Error 4000 GENERAL_ERROR (ProtocolCommandFailedError):"
                " TipAttachedError: Pipette should not have a tip attached, but does."
            ),
        ),
        # TODO: PAPIv<2.15?
    ],
)
def test_python_error_line_numbers(
    tmp_path: Path,
    python_protocol_source: str,
    expected_detail: str,
    output: str,
    check: bool,
) -> None:
    """Test that error messages from Python protocols have line numbers."""
    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(python_protocol_source, encoding="utf-8")

    result = _get_analysis_result([protocol_source_file], output, check)

    if check:
        assert result.exit_code != 0
    else:
        assert result.exit_code == 0
    assert result.json_output is not None
    assert result.json_output["result"] == AnalysisResult.NOT_OK.value
    [error] = result.json_output["errors"]
    assert error["detail"] == expected_detail


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_run_time_parameter_setting(
    tmp_path: Path,
    output: str,
) -> None:
    """Test that a RTP can be set to a non default value for analysis.

    Also verify that analysis result contains all static data about the protocol.
    """
    python_protocol_source = textwrap.dedent(
        """\
            requirements = {"robotType": "OT-3", "apiLevel": "2.18"}

            def add_parameters(parameters):
                parameters.add_bool(
                    display_name="Dry Run",
                    variable_name="dry_run",
                    default=False,
                )
            def run(protocol):
                pass
        """
    )
    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(python_protocol_source, encoding="utf-8")
    result = _get_analysis_result(
        [protocol_source_file], output, rtp_values=json.dumps({"dry_run": True})
    )

    assert result.exit_code == 0

    assert result.json_output is not None
    assert result.json_output["robotType"] == "OT-3 Standard"
    assert result.json_output["result"] == AnalysisResult.OK
    assert result.json_output["pipettes"] == []
    assert result.json_output["commands"]  # There should be a home command
    assert result.json_output["labware"] == []
    assert result.json_output["liquids"] == []
    assert result.json_output["modules"] == []
    assert result.json_output["config"] == {
        "apiVersion": [2, 18],
        "protocolType": "python",
    }
    assert result.json_output["files"] == [{"name": "protocol.py", "role": "main"}]
    assert result.json_output["runTimeParameters"] == [
        {
            "displayName": "Dry Run",
            "variableName": "dry_run",
            "type": "bool",
            "value": True,
            "default": False,
        }
    ]
    assert result.json_output["labwareOffsets"] == []


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_ot2_protocol_rejected(tmp_path: Path, output: str) -> None:
    """It should reject OT-2 protocols."""
    protocol_source = textwrap.dedent(
        """\
        requirements = {
            "apiLevel": "2.15",
            "robotType": "OT-2",
        }

        def run(protocol):
            pass
        """
    )

    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(protocol_source, encoding="utf-8")

    result = _get_analysis_result([protocol_source_file], output)

    assert result.exit_code != 0

    expected_message = (
        "This protocol is designed for an OT-2 robot. "
        "To utilize this protocol, please download the "
        "most recent version of the Opentrons-OT2 app from "
        "https://github.com/Opentrons/opentrons-ot2/releases"
    )
    assert expected_message in result.stdout_stderr


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_run_time_parameter_error(
    tmp_path: Path,
    output: str,
) -> None:
    """Test that an RTP validation error is shown correctly in analysis result.

    Also verify that analysis result contains all static data about the protocol.
    """
    python_protocol_source = textwrap.dedent(
        # Raises an exception during runner load.
        """\
            requirements = {"robotType": "OT-3", "apiLevel": "2.18"}  # line 1
                                                                      # line 2
            def add_parameters(parameters):                           # line 3
                # No default value specified                          # line 4
                parameters.add_bool(                                  # line 5
                    display_name="Dry Run",
                    variable_name="dry_run",
                )
            def run(protocol):
                pass
        """
    )
    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(python_protocol_source, encoding="utf-8")
    result = _get_analysis_result([protocol_source_file], output)

    assert result.exit_code == 0

    assert result.json_output is not None
    assert result.json_output["robotType"] == "OT-3 Standard"
    assert result.json_output["result"] == AnalysisResult.NOT_OK.value
    assert result.json_output["pipettes"] == []
    assert result.json_output["commands"] == []
    assert result.json_output["labware"] == []
    assert result.json_output["liquids"] == []
    assert result.json_output["modules"] == []
    assert result.json_output["config"] == {
        "apiVersion": [2, 18],
        "protocolType": "python",
    }
    assert result.json_output["files"] == [{"name": "protocol.py", "role": "main"}]
    [error] = result.json_output["errors"]
    assert error["detail"] == (
        "TypeError [line 5]: ParameterContext.add_bool() missing 1"
        " required positional argument: 'default'"
    )
    assert result.json_output["labwareOffsets"] == []


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_rtp_csv_file_setting(
    tmp_path: Path,
    output: str,
) -> None:
    """Test that a CSV file can be set for analysis.

    Also verify that analysis result contains all static data about the protocol.
    """
    python_protocol_source = textwrap.dedent(
        """\
            requirements = {"robotType": "OT-3", "apiLevel": "2.20"}

            def add_parameters(parameters):
                parameters.add_csv_file(
                    display_name="CSV File",
                    variable_name="csv_file",
                )
            def run(protocol):
                protocol.params.csv_file.contents
        """
    )
    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(python_protocol_source, encoding="utf-8")
    csv_source_file = tmp_path / "csv_file.csv"
    csv_source_file.write_text("a,b,c", encoding="utf-8")

    result = _get_analysis_result(
        [protocol_source_file],
        output,
        rtp_files=json.dumps({"csv_file": str(csv_source_file.resolve())}),
    )

    assert result.exit_code == 0

    assert result.json_output is not None
    assert result.json_output["robotType"] == "OT-3 Standard"
    assert result.json_output["result"] == AnalysisResult.OK
    assert result.json_output["pipettes"] == []
    assert result.json_output["commands"]  # There should be a home command
    assert result.json_output["labware"] == []
    assert result.json_output["liquids"] == []
    assert result.json_output["modules"] == []
    assert result.json_output["config"] == {
        "apiVersion": [2, 20],
        "protocolType": "python",
    }
    assert result.json_output["files"] == [{"name": "protocol.py", "role": "main"}]
    assert result.json_output["runTimeParameters"] == [
        {
            "displayName": "CSV File",
            "variableName": "csv_file",
            "type": "csv_file",
            "file": {"id": "", "name": "csv_file.csv"},
        }
    ]
    assert result.json_output["labwareOffsets"] == []


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_file_required_error(
    tmp_path: Path,
    output: str,
) -> None:
    """Test that a FileParameterRequired error gets caught and changes the result to FILE_REQUIRED.

    Also verify that analysis result contains all static data about the protocol.
    """
    python_protocol_source = textwrap.dedent(
        # Raises an exception during runner load.
        """\
            requirements = {"robotType": "OT-3", "apiLevel": "2.20"}

            def add_parameters(parameters):
                parameters.add_csv_file(
                    display_name="CSV File",
                    variable_name="csv_file",
                )
            def run(protocol):
                protocol.params.csv_file.file
        """
    )
    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(python_protocol_source, encoding="utf-8")
    result = _get_analysis_result([protocol_source_file], output)

    assert result.exit_code == 0

    assert result.json_output is not None
    assert result.json_output["robotType"] == "OT-3 Standard"
    assert result.json_output["result"] == AnalysisResult.PARAMETER_VALUE_REQUIRED.value
    assert result.json_output["pipettes"] == []
    assert result.json_output["commands"]  # There should be a home command
    assert result.json_output["labware"] == []
    assert result.json_output["liquids"] == []
    assert result.json_output["modules"] == []
    assert result.json_output["config"] == {
        "apiVersion": [2, 20],
        "protocolType": "python",
    }
    assert result.json_output["files"] == [{"name": "protocol.py", "role": "main"}]
    assert result.json_output["errors"]
    assert result.json_output["labwareOffsets"] == []


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_unexpected_error(
    tmp_path: Path,
    output: str,
) -> None:
    """Test that an unexpected error raised from outside opentrons functions is handled correctly."""
    python_protocol_source = textwrap.dedent(
        # Raises an exception before runner load.
        """\
            requirements = {"robotType": "OT-3", "apiLevel": "2.18"}  # line 1
            x + 1 = 0                                                 # line 2
            def add_parameters(parameters):
                parameters.add_bool()
            def run(protocol):
                pass
        """
    )
    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(python_protocol_source, encoding="utf-8")
    result = _get_analysis_result([protocol_source_file], output)

    assert result.exit_code != 0
    assert result.stdout_stderr == (
        "Error: cannot assign to expression here."
        " Maybe you meant '==' instead of '='? (protocol.py, line 2)\n"
    )


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_unexpected_runner_load_error(
    tmp_path: Path,
    output: str,
) -> None:
    """Test that an error raised during runner load is handled properly.

    Also verify that analysis result contains all static data about the protocol.
    """
    python_protocol_source = textwrap.dedent(
        # Raises an exception during runner load.
        """\
            requirements = {"apiLevel": "2.18", "robotType": "OT-3"}     # line 1
            call_a_non_existent_func()              # line 2

            def add_parameters(parameters):         # line 4
                parameters.add_bool()
            def run(protocol):
                pass
        """
    )
    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(python_protocol_source, encoding="utf-8")
    result = _get_analysis_result([protocol_source_file], output)

    assert result.exit_code == 0

    assert result.json_output is not None
    assert result.json_output["robotType"] == "OT-3 Standard"
    assert result.json_output["pipettes"] == []
    assert result.json_output["commands"] == []
    assert result.json_output["config"] == {
        "apiVersion": [2, 18],
        "protocolType": "python",
    }
    assert result.json_output["files"] == [{"name": "protocol.py", "role": "main"}]
    [error] = result.json_output["errors"]
    assert error["detail"] == "name 'call_a_non_existent_func' is not defined"
    assert error["errorCode"] == "4000"
    assert error["errorType"] == "UnexpectedAnalysisError"


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_analyze_json_protocol(
    tmp_path: Path,
    output: str,
) -> None:
    """Test that a json protocol analyzes correctly."""
    json_file = (
        Path(__file__).parents[4]
        / "shared-data"
        / "protocol"
        / "fixtures"
        / "8"
        / "simpleFlexV8.json"
    )
    result = _get_analysis_result([json_file], output)

    assert result.exit_code == 0
    op = result.json_output
    assert op is not None
    assert len(op["commands"]) == 27
    assert op["result"] == AnalysisResult.OK.value


@pytest.mark.parametrize("output", ["--json-output", "--human-json-output"])
def test_analyze_protocol_with_offsets(
    tmp_path: Path,
    output: str,
) -> None:
    """Test that a protocol that sets a custom offset sees the offset in results."""
    protocol = textwrap.dedent("""\
                requirements = {"apiLevel": "2.18", "robotType": "Flex"}

                def run(protocol):
                    tip_rack = protocol.load_labware(
                        "opentrons_flex_96_tiprack_1000ul", "A2"
                    )
                    tip_rack.set_offset(x=1, y=2, z=3)
                    pipette = protocol.load_instrument(
                        "flex_1channel_1000", "left"
                    )
                    pipette.pick_up_tip(tip_rack["A1"])
                """)

    protocol_source_file = tmp_path / "protocol.py"
    protocol_source_file.write_text(protocol, encoding="utf-8")
    result = _get_analysis_result([protocol_source_file], output)

    assert result.exit_code == 0

    assert result.json_output is not None
    assert result.json_output["robotType"] == "OT-3 Standard"
    assert result.json_output["result"] == AnalysisResult.OK
    assert len(result.json_output["labwareOffsets"])
    offset = result.json_output["labwareOffsets"][0]
    assert offset["id"]
    assert offset["definitionUri"] == "opentrons/opentrons_flex_96_tiprack_1000ul/1"
    assert offset["location"]["slotName"] == "A2"
    assert offset["locationSequence"] == [
        {"kind": "onAddressableArea", "addressableAreaName": "A2"}
    ]
    assert offset["vector"] == {"x": 1.0, "y": 2.0, "z": 3.0}
