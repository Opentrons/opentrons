"""Test the production qc protocols."""

import json
import tempfile

import subprocess
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from pathlib import Path
import pytest


PROTOCOL_PARENT_FILEPATH = (
    Path(__file__).parent / "../../hardware_testing/production_qc_protocols"
)
LPF_LABWARE_DEF = (
    Path(__file__).parent / "../../hardware_testing/labware/liquid_probe_fixture/1.json"
)


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
    print(f"{protocol_files}")
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
    "protocol",
    [
        pytest.param("belt_calibration_ot3.py"),
        pytest.param("gripper_assembly_qc_ot3.py"),
        pytest.param("ninety_six_assembly_qc_ot3.py"),
        pytest.param("pipette_assembly_qc_ot3.py"),
    ],
)
def test_production_protocol(protocol: str) -> None:
    """Make sure each CSV can analyze successfully."""
    result = _get_analysis_result(
        [(PROTOCOL_PARENT_FILEPATH / protocol), LPF_LABWARE_DEF],
        "--json-output",
        check=True,
    )
    # print(result)
    print(result.stdout_stderr.decode())
    print(json.dumps(result.json_output, indent=4))
    assert result.exit_code == 0
