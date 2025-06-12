"""Regression testing for various stackup combinations.

This test captures the vector coordinates of possible module/adapter/labware combinations
to detect unintended changes in stackup positioning.

The errors caused by running this script are due to invalid stackups and are expected.

NOTE: The list of labware, modules, adapters and their versions are hardcoded
to reduce the amount of time generating snapshots, since the test takes several hours to complete.
If you want to test targeted changes involving a module or labware or a specific version of a module or labware,
you'll have to update this list and re-run the baseline snapshot test on a known good branch first.

To run this test:
    cd api && pytest path/to/file -s --log-cli-level=INFO

To update the snapshot:
    cd api && UPDATE_SNAPSHOT=1 pytest path/to/file -s --log-cli-level=INFO
"""

import itertools
import json
import logging
import subprocess
import sys
import os

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import pytest

pytestmark = pytest.mark.stackup_testing

logger = logging.getLogger(__name__)

ROBOT_TYPES = ["Flex", "OT-2"]

# Labware URI, version
TEST_LATEST_LABWARE: List[Tuple[str, int]] = [
    ("agilent_1_reservoir_290ml", 3),
    ("appliedbiosystemsmicroamp_384_wellplate_40ul", 2),
    ("armadillo_96_wellplate_200ul_pcr_full_skirt", 3),
    ("axygen_1_reservoir_90ml", 2),
    ("biorad_384_wellplate_50ul", 3),
    ("biorad_96_wellplate_200ul_pcr", 3),
    ("corning_12_wellplate_6.9ml_flat", 3),
    ("corning_24_wellplate_3.4ml_flat", 3),
    ("corning_384_wellplate_112ul_flat", 4),
    ("corning_48_wellplate_1.6ml_flat", 4),
    ("corning_6_wellplate_16.8ml_flat", 3),
    ("corning_96_wellplate_360ul_flat", 3),
    ("eppendorf_96_tiprack_1000ul_eptips", 1),
    ("eppendorf_96_tiprack_10ul_eptips", 1),
    ("geb_96_tiprack_1000ul", 1),
    ("geb_96_tiprack_10ul", 1),
    ("nest_12_reservoir_15ml", 2),
    ("nest_1_reservoir_195ml", 3),
    ("nest_1_reservoir_290ml", 3),
    ("nest_96_wellplate_100ul_pcr_full_skirt", 3),
    ("nest_96_wellplate_200ul_flat", 3),
    ("nest_96_wellplate_2ml_deep", 3),
    ("opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical", 2),
    ("opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic", 1),
    ("opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", 2),
    ("opentrons_15_tuberack_falcon_15ml_conical", 2),
    ("opentrons_15_tuberack_nest_15ml_conical", 2),
    ("opentrons_1_trash_1100ml_fixed", 1),
    ("opentrons_1_trash_3200ml_fixed", 1),
    ("opentrons_1_trash_850ml_fixed", 1),
    ("opentrons_24_aluminumblock_generic_2ml_screwcap", 3),
    ("opentrons_24_aluminumblock_nest_0.5ml_screwcap", 3),
    ("opentrons_24_aluminumblock_nest_1.5ml_screwcap", 2),
    ("opentrons_24_aluminumblock_nest_1.5ml_snapcap", 2),
    ("opentrons_24_aluminumblock_nest_2ml_screwcap", 2),
    ("opentrons_24_aluminumblock_nest_2ml_snapcap", 2),
    ("opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap", 2),
    ("opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap", 2),
    ("opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap_acrylic", 1),
    ("opentrons_24_tuberack_generic_0.75ml_snapcap_acrylic", 1),
    ("opentrons_24_tuberack_generic_2ml_screwcap", 2),
    ("opentrons_24_tuberack_nest_0.5ml_screwcap", 3),
    ("opentrons_24_tuberack_nest_1.5ml_screwcap", 2),
    ("opentrons_24_tuberack_nest_1.5ml_snapcap", 2),
    ("opentrons_24_tuberack_nest_2ml_screwcap", 2),
    ("opentrons_24_tuberack_nest_2ml_snapcap", 2),
    (
        "opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip",
        1,
    ),
    ("opentrons_6_tuberack_falcon_50ml_conical", 2),
    ("opentrons_6_tuberack_nest_50ml_conical", 2),
    ("opentrons_96_aluminumblock_biorad_wellplate_200ul", 1),
    ("opentrons_96_aluminumblock_generic_pcr_strip_200ul", 4),
    ("opentrons_96_aluminumblock_nest_wellplate_100ul", 1),
    ("opentrons_96_deep_well_adapter", 1),
    ("opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep", 1),
    ("opentrons_96_deep_well_temp_mod_adapter", 1),
    ("opentrons_96_filtertiprack_1000ul", 1),
    ("opentrons_96_filtertiprack_10ul", 1),
    ("opentrons_96_filtertiprack_200ul", 1),
    ("opentrons_96_filtertiprack_20ul", 1),
    ("opentrons_96_flat_bottom_adapter", 1),
    ("opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat", 1),
    ("opentrons_96_pcr_adapter", 1),
    ("opentrons_96_pcr_adapter_armadillo_wellplate_200ul", 1),
    ("opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt", 1),
    ("opentrons_96_tiprack_1000ul", 1),
    ("opentrons_96_tiprack_10ul", 1),
    ("opentrons_96_tiprack_20ul", 1),
    ("opentrons_96_tiprack_300ul", 1),
    ("opentrons_96_well_aluminum_block", 1),
    ("opentrons_96_wellplate_200ul_pcr_full_skirt", 3),
    ("opentrons_aluminum_flat_bottom_plate", 1),
    ("opentrons_calibration_adapter_heatershaker_module", 1),
    ("opentrons_calibration_adapter_temperature_module", 1),
    ("opentrons_calibration_adapter_thermocycler_module", 1),
    ("opentrons_calibrationblock_short_side_left", 1),
    ("opentrons_calibrationblock_short_side_right", 1),
    ("opentrons_flex_96_filtertiprack_1000ul", 1),
    ("opentrons_flex_96_filtertiprack_200ul", 1),
    ("opentrons_flex_96_filtertiprack_20ul", 1),
    ("opentrons_flex_96_filtertiprack_50ul", 1),
    ("opentrons_flex_96_tiprack_1000ul", 1),
    ("opentrons_flex_96_tiprack_200ul", 1),
    ("opentrons_flex_96_tiprack_20ul", 1),
    ("opentrons_flex_96_tiprack_50ul", 1),
    ("opentrons_flex_96_tiprack_adapter", 1),
    ("opentrons_flex_deck_riser", 1),
    ("opentrons_flex_lid_absorbance_plate_reader_module", 1),
    ("opentrons_flex_tiprack_lid", 1),
    ("opentrons_tough_12_reservoir_22ml", 1),
    ("opentrons_tough_1_reservoir_300ml", 1),
    ("opentrons_tough_4_reservoir_72ml", 1),
    ("opentrons_tough_pcr_auto_sealing_lid", 2),
    ("opentrons_tough_universal_lid", 1),
    ("opentrons_universal_flat_adapter", 1),
    ("opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat", 1),
    ("protocol_engine_lid_stack_object", 1),
    ("thermoscientificnunc_96_wellplate_1300ul", 2),
    ("thermoscientificnunc_96_wellplate_2000ul", 2),
    ("tipone_96_tiprack_200ul", 1),
    ("usascientific_12_reservoir_22ml", 3),
    ("usascientific_96_wellplate_2.4ml_deep", 2),
]

FLEX_TEST_ADAPTERS: List[Tuple[str, int]] = [
    ("opentrons_96_deep_well_adapter", 1),
    ("opentrons_96_deep_well_temp_mod_adapter", 1),
    ("opentrons_96_flat_bottom_adapter", 1),
    ("opentrons_96_pcr_adapter", 1),
    ("opentrons_96_well_aluminum_block", 1),
    ("opentrons_aluminum_flat_bottom_plate", 1),
    ("opentrons_flex_96_tiprack_adapter", 1),
    ("opentrons_flex_deck_riser", 1),
    ("opentrons_universal_flat_adapter", 1),
]

OT_2_TEST_ADAPTERS: List[Tuple[str, int]] = [
    ("opentrons_96_well_aluminum_block", 1),
]

FLEX_TEST_MODULES = [
    "thermocyclerModuleV2",
    "temperatureModuleV2",
    "absorbanceReaderV1",
    "heaterShakerModuleV1",
    "magneticBlockV1",
    "flexStackerModuleV1",
]

OT2_TEST_MODULES = [
    "heaterShakerModuleV1",
]


@dataclass
class StackupSpec:
    """The test parameters of interest."""

    robot_type: str
    module_load_name: Optional[str]
    adapter_load_info: Optional[Tuple[str, int]]
    labware_load_info: Tuple[str, int]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "robot_type": self.robot_type,
            "module_load_name": self.module_load_name,
            "adapter_load_info": self.adapter_load_info,
            "labware_load_info": self.labware_load_info,
        }

    def stackup_key(self) -> str:
        """Generate a unique key for this stackup configuration."""
        module_name = self.module_load_name or "None"
        adapter_name = self.adapter_load_info[0] if self.adapter_load_info else "None"
        labware_name = self.labware_load_info[0]
        return f"{self.robot_type},{module_name},{adapter_name},{labware_name}"


@pytest.fixture
def snapshot_path() -> Path:
    """Path to the snapshot file."""
    return Path(__file__).parent / "stackup_coordinates_snapshot.json"


def test_stackup_coordinates_regression(
    snapshot_path: Path, request: Any, caplog: Any
) -> None:
    """Test that stackup well A1 coordinates match the expected snapshot.

    This test runs possible combinations of robot types, modules, adapters, and labware.
    """
    caplog.set_level(logging.INFO)

    update_snapshot = _should_update_snapshot(request)
    specs = _generate_all_specs()
    logger.info(f"Running {len(specs)} stackup coordinate tests...")

    snapshot_data = _load_snapshot(snapshot_path)
    temp_snapshot_path, temp_results = _initialize_temp_file(
        snapshot_path, snapshot_data, update_snapshot
    )

    results, errors = _run_all_stackup_tests(specs, temp_snapshot_path, temp_results)

    if update_snapshot:
        _finalize_snapshot_update(
            snapshot_path, temp_snapshot_path, temp_results, errors
        )
        return

    _compare_with_snapshot(snapshot_data, temp_results, errors, temp_snapshot_path)


def _should_update_snapshot(request: Any) -> bool:
    """Determine if snapshot should be updated based on CLI args."""
    return request.config.getoption(
        "--update-snapshot", default=False
    ) or os.environ.get("UPDATE_SNAPSHOT", "").lower() in ("1", "true", "yes")


def _generate_all_specs() -> List[StackupSpec]:
    """Generate all test specifications for all robot types."""
    all_specs = []

    for robot_type in ROBOT_TYPES:
        if robot_type == "OT-2":
            modules_with_none = [None] + OT2_TEST_MODULES
            adapters_with_none = [None] + OT_2_TEST_ADAPTERS
        else:
            modules_with_none = [None] + FLEX_TEST_MODULES
            adapters_with_none = [None] + FLEX_TEST_ADAPTERS

        combos = itertools.product(
            modules_with_none, adapters_with_none, TEST_LATEST_LABWARE
        )
        robot_specs = [
            StackupSpec(
                robot_type=robot_type,
                module_load_name=module_load_name,
                adapter_load_info=adapter_load_info,
                labware_load_info=labware_load_info,
            )
            for (module_load_name, adapter_load_info, labware_load_info) in combos
        ]
        all_specs.extend(robot_specs)

    return all_specs


def _load_snapshot(snapshot_path: Path) -> Union[Dict[str, Any], Any]:
    """Load the snapshot file if it exists."""
    if snapshot_path.exists():
        with open(snapshot_path, "r") as f:
            return json.load(f)
    return {}


def _save_snapshot(snapshot_path: Path, data: Dict[str, Any]) -> None:
    """Save the snapshot file."""
    with open(snapshot_path, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)


def _initialize_temp_file(
    snapshot_path: Path, snapshot_data: Dict[str, Any], update_snapshot: bool
) -> Tuple[Path, Dict[str, Any]]:
    """Initialize the temporary file for continuous saving."""
    temp_snapshot_path = snapshot_path.with_suffix(".temp")

    # Start fresh snapshot when updating snapshot
    if update_snapshot:
        temp_results: Dict[str, Any] = {}
        logger.info(
            f"Starting fresh snapshot update, saving progress to {temp_snapshot_path}"
        )
    # Load existing temp file if it exists, otherwise start with current snapshot
    else:
        if temp_snapshot_path.exists():
            logger.info(f"Resuming from existing temp file: {temp_snapshot_path}")
            temp_results = _load_snapshot(temp_snapshot_path)
        else:
            temp_results = snapshot_data.copy()
            logger.info(f"Creating new temp file: {temp_snapshot_path}")

    _save_snapshot(temp_snapshot_path, temp_results)
    return temp_snapshot_path, temp_results


def _run_all_stackup_tests(
    specs: List[StackupSpec],
    temp_snapshot_path: Path,
    temp_results: Dict[str, Any],
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Run all stackup tests and save progress continuously."""
    results: Dict[str, Any] = {}
    errors: List[Dict[str, Any]] = []

    ordered_specs = []
    robot_counts: Dict[str, int] = {}

    for robot_type in ROBOT_TYPES:
        robot_specs = [spec for spec in specs if spec.robot_type == robot_type]
        ordered_specs.extend(robot_specs)
        robot_counts[robot_type] = len(robot_specs)

    robot_info = ", then ".join(
        f"{count} {robot_type} stackups" for robot_type, count in robot_counts.items()
    )

    logger.info(f"Processing {robot_info}...")

    for i, spec in enumerate(ordered_specs):
        spec_result, result = _process_single_test_subprocess(spec)
        stackup_key = spec_result.stackup_key()

        if isinstance(result, tuple):
            rounded_result = tuple(round(coord, 6) for coord in result)
            result_entry = {
                "coordinates": rounded_result,
                "spec": spec_result.to_dict(),
            }
            results[stackup_key] = result_entry
            temp_results[stackup_key] = result_entry

        else:
            error_info = {
                "stackup_key": stackup_key,
                "spec": spec_result.to_dict(),
                "error": result,
            }
            errors.append(error_info)

        if (i + 1) % 10 == 0:
            logger.info(
                f"Processed {i + 1}/{len(ordered_specs)} items. Successful: {len(results)}, Errors: {len(errors)} ({spec.robot_type})"
            )
            _save_snapshot(temp_snapshot_path, temp_results)

    _save_snapshot(temp_snapshot_path, temp_results)
    logger.info(f"Completed: {len(results)} successful, {len(errors)} errors")

    return results, errors


def _process_single_test_subprocess(
    spec: StackupSpec,
) -> Tuple[StackupSpec, Union[Tuple[float, float, float], str]]:
    """Process a single test in a subprocess to completely isolate resources."""
    spec_data = spec.to_dict()

    test_script = f"""
import json
import sys
from opentrons import protocol_api, simulate

def run_test_subprocess(spec_data):
    context = simulate.get_protocol_api(
        protocol_api.MAX_SUPPORTED_VERSION, robot_type="{spec.robot_type}"
    )

    top_so_far = None
    module_load_name = spec_data["module_load_name"]
    adapter_load_info = spec_data["adapter_load_info"]
    labware_load_info = spec_data["labware_load_info"]

    if module_load_name:
        if module_load_name == "thermocyclerModuleV2":
            module = context.load_module(module_load_name)
        else:
            module = context.load_module(module_load_name, "D3")
            if module_load_name == "absorbanceReaderV1":
                module.open_lid()
        top_so_far = module

    if adapter_load_info is not None:
        adapter_load_name, adapter_version = adapter_load_info
        if top_so_far is None:
            adapter = context.load_adapter(
                adapter_load_name, "D3", version=adapter_version
            )
        else:
            if module_load_name == "absorbanceReaderV1":
                adapter = context.load_labware(adapter_load_name, "A3", version=adapter_version)
                context.move_labware(adapter, module, use_gripper=True)
            else:
                adapter = top_so_far.load_adapter(
                    adapter_load_name, version=adapter_version
                )
        top_so_far = adapter

    labware_load_name, labware_version = labware_load_info
    if top_so_far is None:
        labware = context.load_labware(labware_load_name, "D3", version=labware_version)
    else:
        if module_load_name == "absorbanceReaderV1":
            labware = context.load_labware(labware_load_name, "A3", version=labware_version)
            if adapter_load_info is not None:
                context.move_labware(labware, adapter, use_gripper=True)
            else:
                context.move_labware(labware, module, use_gripper=True)
        else:
            labware = top_so_far.load_labware(labware_load_name, version=labware_version)
    top_so_far = labware

    x, y, z = top_so_far.wells_by_name()["A1"].top().point
    return (x, y, z)

try:
    spec_data = json.loads('{json.dumps(spec_data)}')
    result = run_test_subprocess(spec_data)
    print(json.dumps({{"success": True, "result": result}}))
except Exception as e:
    print(json.dumps({{"success": False, "error": str(e)}}))
"""

    try:
        process = subprocess.run(
            [sys.executable, "-c", test_script],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=".",
        )

        if process.returncode == 0:
            try:
                output = json.loads(process.stdout.strip())
                if output["success"]:
                    return (spec, tuple(output["result"]))
                else:
                    return (spec, f"Error: {output['error']}")
            except json.JSONDecodeError:
                return (spec, f"Invalid JSON output: {process.stdout}")
        else:
            return (spec, f"Process failed: {process.stderr}")

    except subprocess.TimeoutExpired:
        return (spec, "Error: Test timeout")
    except Exception as e:
        return (spec, f"Error: Subprocess error: {e}")


def _finalize_snapshot_update(
    snapshot_path: Path,
    temp_snapshot_path: Path,
    temp_results: Dict[str, Any],
    errors: List[Dict[str, Any]],
) -> None:
    """Finalize the snapshot update by moving temp file to final location."""
    logger.info("Finalizing snapshot update...")

    # Move temp file to final snapshot
    if temp_snapshot_path.exists():
        _save_snapshot(snapshot_path, temp_results)
        temp_snapshot_path.unlink()
        logger.info(f"Snapshot updated and saved to {snapshot_path}")
        logger.info(f"Temp file {temp_snapshot_path} cleaned up")
    # Fallback if temp file doesn't exist
    else:
        _save_snapshot(snapshot_path, temp_results)
        logger.info(f"Snapshot saved to {snapshot_path}")

    if errors:
        logger.info("Errors encountered (not saved to snapshot):")
        for error in errors[:5]:  # Show first 5 errors
            logger.info(f"  {error['stackup_key']}: {error['error']}")

        if len(errors) > 5:
            logger.info(f"  ... and {len(errors) - 5} more errors")


def _compare_with_snapshot(
    snapshot_data: Dict[str, Any],
    temp_results: Dict[str, Any],
    errors: List[Dict[str, Any]],
    temp_snapshot_path: Path,
) -> None:
    """Compare current results with the snapshot and report differences."""
    if not snapshot_data:
        pytest.fail(
            "No snapshot found. Run with UPDATE_SNAPSHOT=1 to create the initial snapshot."
        )

    # Check for missing stackups in current run
    missing_stackups = set(snapshot_data.keys()) - set(temp_results.keys())
    if missing_stackups:
        logger.warning(
            f"Warning: {len(missing_stackups)} stackups from snapshot are missing in current run"
        )

    # Check for new stackups not in snapshot
    new_stackups = set(temp_results.keys()) - set(snapshot_data.keys())
    if new_stackups:
        logger.warning(
            f"Warning: {len(new_stackups)} new stackups found that are not in snapshot"
        )

    coordinate_mismatches = _find_coordinate_mismatches(snapshot_data, temp_results)

    failure_messages = _build_failure_messages(
        errors, coordinate_mismatches, missing_stackups, new_stackups
    )

    if failure_messages:
        pytest.fail("".join(failure_messages))

    if temp_snapshot_path.exists():
        temp_snapshot_path.unlink()
        logger.info(f"Cleaned up temp file: {temp_snapshot_path}")

    logger.info(f"All {len(temp_results)} stackup coordinates match the snapshot!")


def _find_coordinate_mismatches(
    snapshot_data: Dict[str, Any], temp_results: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Find coordinate mismatches between snapshot and current results."""
    coordinate_mismatches = []
    for stackup_key in temp_results:
        if stackup_key in snapshot_data:
            current_coords = temp_results[stackup_key]["coordinates"]
            snapshot_coords = snapshot_data[stackup_key]["coordinates"]

            if current_coords != snapshot_coords:
                coordinate_mismatches.append(
                    {
                        "stackup_key": stackup_key,
                        "expected": snapshot_coords,
                        "actual": current_coords,
                        "diff": tuple(
                            round(a - e, 6)
                            for a, e in zip(current_coords, snapshot_coords)
                        ),
                    }
                )
    return coordinate_mismatches


def _build_failure_messages(
    errors: List[Dict[str, Any]],
    coordinate_mismatches: List[Dict[str, Any]],
    missing_stackups: Set[str],
    new_stackups: Set[str],
) -> List[str]:
    """Build comprehensive failure messages for test failures."""
    failure_messages = []

    if errors:
        failure_messages.append(
            f"\n{len(errors)} stackups failed to execute:\n"
            + "\n".join(f"  {e['stackup_key']}: {e['error']}" for e in errors[:10])
            + (f"\n  ... and {len(errors) - 10} more" if len(errors) > 10 else "")
        )

    if missing_stackups:
        failure_messages.append(
            f"\n{len(missing_stackups)} stackups from snapshot are missing in current run"
        )

    if new_stackups:
        failure_messages.append(
            f"\n{len(new_stackups)} new stackups found (run with UPDATE_SNAPSHOT=1 to include them)"
        )

    if coordinate_mismatches:
        failure_messages.append(
            f"\n{len(coordinate_mismatches)} stackups have coordinate mismatches:\n"
            + "\n".join(
                f"  {m['stackup_key']}:\n"
                f"    Expected: {m['expected']}\n"
                f"    Actual:   {m['actual']}\n"
                f"    Diff:     {m['diff']}"
                for m in coordinate_mismatches
            )
        )

    return failure_messages
