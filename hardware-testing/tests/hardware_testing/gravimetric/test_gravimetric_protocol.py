"""Test the gravimetric protocol."""

import json
import tempfile

import subprocess
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from pathlib import Path
import glob
import csv
from unittest.mock import MagicMock, call, patch
import pytest

from hardware_testing.gravimetric.protocol_replacement import gravimetric
from hardware_testing.gravimetric.protocol_replacement.gravimetric import CSVSettings

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


def test_all_csvs_are_valid() -> None:
    """Check that all of the test csv's in the source code are vaild."""
    all_csvs = glob.glob(
        str(GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH) + "/**/*.csv", recursive=True
    )
    for csv_file in all_csvs:
        with open(csv_file) as input_file:
            # Print the file name to help with debugging when a test fail
            print(csv_file)
            reader = csv.reader(input_file)
            csv_params = [row for row in reader]
            CSVSettings.parse_csv(csv_params, False)


def test_liquid_height_calibration_is_triggered_by_volume_not_tip() -> None:
    """Calibrate on volume changes, but not when only the tip size changes."""
    fixture_settings = MagicMock()

    with patch.object(gravimetric, "_calibrate_liquid_height_for_volume") as calibrate:
        previous_volume = gravimetric._calibrate_liquid_height_if_volume_changed(
            fixture_settings,
            tip=50,
            test_volume=1.0,
            previous_volume=None,
            tip_already_attached=True,
        )
        previous_volume = gravimetric._calibrate_liquid_height_if_volume_changed(
            fixture_settings,
            tip=20,
            test_volume=1.0,
            previous_volume=previous_volume,
        )
        gravimetric._calibrate_liquid_height_if_volume_changed(
            fixture_settings,
            tip=20,
            test_volume=5.0,
            previous_volume=previous_volume,
        )

    assert calibrate.call_args_list == [
        call(
            fixture_settings,
            50,
            1.0,
            tip_already_attached=True,
        ),
        call(
            fixture_settings,
            20,
            5.0,
            tip_already_attached=False,
        ),
    ]


@pytest.mark.parametrize("use_lld", [True, False])
def test_liquid_height_calibration_mode_is_selected_by_parameter(
    use_lld: bool,
) -> None:
    """Keep the runtime parameter as the automatic/manual LLD selector."""
    fixture_settings = MagicMock()
    fixture_settings.use_lld = use_lld

    with patch.object(gravimetric, "_manually_set_liquid_height") as manual_lld:
        gravimetric._initialize_liquid_height(fixture_settings, test_volume=5.0)

    if use_lld:
        fixture_settings.pipette.require_liquid_presence.assert_called_once_with(
            fixture_settings.liquid_source
        )
        manual_lld.assert_not_called()
    else:
        fixture_settings.pipette.require_liquid_presence.assert_not_called()
        manual_lld.assert_called_once_with(fixture_settings, 5.0)


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
    argnames=["csv", "src_dir"],
    argvalues=[
        # ["1ch1000.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH], # Some of these are commented out just cause they take so long.
        # ["1ch1000_extra.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        # ["1ch50.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        # ["1ch50_extra.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        # ["96ch1000.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        # ["96ch200.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        # ["8ch1000.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        # ["8ch1000_extra.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        # ["8ch50.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        # ["8ch50_extra.csv", GRAVIMETRIC_PROTOCOL_PARENT_FILEPATH],
        ["1ch50.csv", Path(__file__).parent],
        ["8ch50.csv", Path(__file__).parent],
        ["96ch1000.csv", Path(__file__).parent],
    ],
)
def test_analasis(csv: str, src_dir: Path) -> None:
    """Make sure each CSV can analyze successfully."""
    result = _get_analysis_result(
        [GRAVIMETRIC_PROTOCOL_FILEPATH, VIAL_LABWARE_DEF],
        "--json-output",
        check=True,
        rtp_files=json.dumps({"qc_test_profile": str((src_dir / csv).resolve())}),
    )
    print(result.stdout_stderr)
    assert result.exit_code == 0


def test_photometric() -> None:
    """Make sure each CSV can analyze successfully."""
    photometric_protocol = (
        Path(__file__).parent
        / "../../../hardware_testing/protocols/universal_photometric.py"
    )
    result = _get_analysis_result(
        [photometric_protocol],
        "--json-output",
        check=True,
    )
    print(result)
    print(result.stdout_stderr)
    assert result.exit_code == 0
