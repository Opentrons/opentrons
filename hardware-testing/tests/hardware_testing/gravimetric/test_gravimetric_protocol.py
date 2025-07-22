"""Test the gravimetric protocol."""

import json
import tempfile

import subprocess
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from pathlib import Path

import pytest

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH = (
    Path(__file__).parent / "../../../hardware_testing/gravimetric/protocol_replacement"
)
VIAL_LABWARE_DEF = (
    Path(__file__).parent
    / "../../../hardware_testing/labware/radwag_pipette_calibration_vial/1.json"
)
GRAVIMETRIC_PROTOCOL_FILEPATH = GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH / "gravimetric.py"
CSV_FILEPATH = GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH / "96ch200.csv"


@dataclass
class _AnalysisCLIResult:
    exit_code: int
    json_output: Optional[Dict[str, Any]]
    stdout_stderr: bytes


# Function copied from api/tests/opentrons/cli/test_cli.py
# To be used for verifying that the test protocols in hardware-testing analyze successfully.
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
        args = [
            "python",
            "-m",
            "opentrons.cli",
            "analyze",
            output_type,
            str(analysis_output_file),
        ]

        if rtp_values is not None:
            args.extend(["--rtp-values", rtp_values])

        if rtp_files is not None:
            args.extend(["--rtp-files", rtp_files])

        args.extend([str(p.resolve()) for p in protocol_files])

        if check:
            args.append("--check")

        process = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if analysis_output_file.exists():
            json_output = json.loads(analysis_output_file.read_bytes())
        else:
            json_output = None
        return _AnalysisCLIResult(
            exit_code=process.returncode,
            json_output=json_output,
            stdout_stderr=process.stdout,
        )


@pytest.mark.parametrize(
    "pipette",
    [
        pytest.param("1ch50"),
    ],
)
def test_gravimetric_test_protocol_has_max_api(pipette: str) -> None:
    """Check that gravimetric test protocol uses the latest Python API version and simulates."""
    result = _get_analysis_result(
        [GRAVIMETRIC_PROTOCOL_FILEPATH],
        "--json-output",
        rtp_files=json.dumps(
            {
                "qc_test_profile": str(
                    (GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH / f"{pipette}.csv").resolve()
                )
            }
        ),
    )
    print(result.stdout_stderr)
    assert result.exit_code == 0
    assert result.json_output
    assert result.json_output["config"]["apiVersion"] == [
        MAX_SUPPORTED_VERSION.major,
        MAX_SUPPORTED_VERSION.minor,
    ]


@pytest.mark.parametrize(
    argnames=["csv"],
    argvalues=[
        # ["1ch1000.csv"], # Some of these are commented out just cause they take so long.
        # ["1ch1000_extra.csv"],
        ["1ch50.csv"],
        # ["1ch50_extra.csv"],
        # ["96ch1000.csv"],
        # ["96ch200.csv"], #Needs LC to complete
        # ["8ch1000.csv"],
        # ["8ch1000_extra.csv"],
        # ["8ch50.csv"],
        # ["8ch50_extra.csv"],
    ],
)
def test_analasis(csv: str) -> None:
    """Make sure each CSV can analyze successfully."""
    result = _get_analysis_result(
        [GRAVIMETRIC_PROTOCOL_FILEPATH, VIAL_LABWARE_DEF],
        "--json-output",
        check=True,
        rtp_files=json.dumps(
            {
                "qc_test_profile": str(
                    (GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH / csv).resolve()
                )
            }
        ),
    )
    print(result.stdout_stderr)
    assert result.exit_code == 0
