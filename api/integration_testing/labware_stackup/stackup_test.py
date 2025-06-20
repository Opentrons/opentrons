"""Regression testing for various stackup combinations.

This test captures the vector coordinates of possible module/adapter/labware combinations
to detect unintended changes in stackup positioning.

The errors caused by running this script are due to invalid stackups and are expected.

NOTE: The list of labware, modules, adapters and their versions are hardcoded
to reduce the amount of time generating snapshots, since the test takes several hours to complete.
If you want to test targeted changes involving a module or labware or a specific version of a module or labware,
you'll have to update this list and re-run the baseline snapshot test on a known good branch first.

To run this test:
    cd api && pytest -m stackup_testing -s

To update the snapshot:
    cd api && UPDATE_SNAPSHOT=1 pytest -m stackup_testing -s
"""

from dataclasses import dataclass
import itertools
import json
import sys
import os
from concurrent.futures import ProcessPoolExecutor, as_completed, Future

from pathlib import Path
from typing import Any, Iterator, cast, Literal

from .stackup_spec import StackupSpec

import pytest

orig_stdout = sys.stdout

pytestmark = pytest.mark.stackup_testing

ROBOT_TYPES: list[Literal["Flex"] | Literal["OT-2"]] = ["Flex", "OT-2"]

# Labware URI, version
TEST_LATEST_LABWARE: list[tuple[str, int]] = [
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

FLEX_TEST_ADAPTERS: list[tuple[str, int]] = [
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

OT_2_TEST_ADAPTERS: list[tuple[str, int]] = [
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


@pytest.fixture
def snapshot_path() -> Path:
    """Path to the snapshot file."""
    return Path(__file__).parent / "stackup_coordinates_snapshot.json"


def _print(capsys: Any, message: str) -> None:
    with capsys.disabled():
        print(capsys, message)


@dataclass
class Options:
    """Test options."""

    update_snapshot: bool
    only_robot: Literal["Flex"] | Literal["OT-2"] | None


def get_options(request: Any) -> Options:
    """Get options."""
    opts = Options(
        update_snapshot=(
            request.config.getoption("--update-snapshot", default=False)
            or os.environ.get("UPDATE_SNAPSHOT", "").lower() in ("1", "true", "yes")
        ),
        only_robot=cast(
            Literal["Flex"] | Literal["OT-2"] | None,
            request.config.getoption("--update-snapshot", default=None)
            or os.environ.get("ONLY_ROBOT", None),
        ),
    )
    assert not (
        opts.update_snapshot and opts.only_robot is not None
    ), "Must do all robots to update snapshots"
    return opts


def test_stackup_coordinates_regression(
    snapshot_path: Path, request: Any, caplog: Any, capsys: Any
) -> None:
    """Test that stackup well A1 coordinates match the expected snapshot.

    This test runs possible combinations of robot types, modules, adapters, and labware.
    """
    opts = get_options(request)
    specs = list(_generate_all_specs(opts.only_robot))
    _print(capsys, f"Running {len(specs)} stackup coordinate tests...")

    snapshot_data = _load_snapshot(snapshot_path)
    temp_snapshot_path, temp_results = _initialize_temp_file(
        snapshot_path, snapshot_data, opts.update_snapshot, capsys
    )

    results, errors = _run_all_stackup_tests(
        specs, temp_snapshot_path, temp_results, capsys
    )

    if opts.update_snapshot:
        _finalize_snapshot_update(
            snapshot_path, temp_snapshot_path, temp_results, errors, capsys
        )
        return

    _compare_with_snapshot(
        snapshot_data, temp_results, errors, temp_snapshot_path, capsys
    )


def _generate_all_specs(
    only_robot: Literal["OT-2"] | Literal["Flex"] | None,
) -> Iterator[StackupSpec]:
    """Generate all test specifications for all robot types."""
    robots = [r for r in ROBOT_TYPES] if only_robot is None else [only_robot]

    for robot_type in robots:
        if robot_type == "OT-2":
            modules_with_none = [None] + OT2_TEST_MODULES
            adapters_with_none = [None] + OT_2_TEST_ADAPTERS
        else:
            modules_with_none = [None] + FLEX_TEST_MODULES
            adapters_with_none = [None] + FLEX_TEST_ADAPTERS

        combos = itertools.product(
            modules_with_none, adapters_with_none, TEST_LATEST_LABWARE
        )
        for module_load_name, adapter_load_info, labware_load_info in combos:
            yield StackupSpec(
                robot_type=robot_type,
                module_load_name=module_load_name,
                adapter_load_info=adapter_load_info,
                labware_load_info=labware_load_info,
            )


def _load_snapshot(snapshot_path: Path) -> dict[str, Any] | Any:
    """Load the snapshot file if it exists."""
    if snapshot_path.exists():
        with open(snapshot_path, "r") as f:
            return json.load(f)
    return {}


def _save_snapshot(snapshot_path: Path, data: dict[str, Any]) -> None:
    """Save the snapshot file."""
    with open(snapshot_path, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)


def _initialize_temp_file(
    snapshot_path: Path,
    snapshot_data: dict[str, Any],
    update_snapshot: bool,
    capsys: Any,
) -> tuple[Path, dict[str, Any]]:
    """Initialize the temporary file for continuous saving."""
    temp_snapshot_path = snapshot_path.with_suffix(".temp")

    # Start fresh snapshot when updating snapshot
    if update_snapshot:
        temp_results: dict[str, Any] = {}
        _print(
            capsys,
            f"Starting fresh snapshot update, saving progress to {temp_snapshot_path}",
        )
    # Load existing temp file if it exists, otherwise start with current snapshot
    else:
        if temp_snapshot_path.exists():
            _print(capsys, f"Resuming from existing temp file: {temp_snapshot_path}")
            temp_results = _load_snapshot(temp_snapshot_path)
        else:
            temp_results = snapshot_data.copy()
            _print(capsys, f"Creating new temp file: {temp_snapshot_path}")

    _save_snapshot(temp_snapshot_path, temp_results)
    return temp_snapshot_path, temp_results


def _run_all_stackup_tests(
    specs: list[StackupSpec],
    temp_snapshot_path: Path,
    temp_results: dict[str, Any],
    capsys: Any,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Run all stackup tests and save progress continuously."""
    ordered_specs = []
    robot_counts: dict[str, int] = {}

    found_one = False
    for robot_type in ROBOT_TYPES:
        robot_specs = [spec for spec in specs if spec.robot_type == robot_type]
        ordered_specs.extend(robot_specs)
        robot_counts[robot_type] = len(robot_specs)
        if len(robot_specs) != 0:
            found_one = True

    assert found_one, f"No stackups specs found: {specs}"

    robot_info = ", then ".join(
        f"{count} {robot_type} stackups" for robot_type, count in robot_counts.items()
    )

    _print(capsys, f"Processing {robot_info}...")
    executor = ProcessPoolExecutor()
    futures = [executor.submit(_process_single_test, spec) for spec in ordered_specs]
    try:
        return _collate_results(futures, temp_snapshot_path, capsys)
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


@dataclass(frozen=True)
class _TestResult:
    spec: StackupSpec


@dataclass(frozen=True)
class Successful(_TestResult):
    """Outcome of a successful test."""

    outcome: Literal["success"]
    result: tuple[float, float, float]


@dataclass(frozen=True)
class Unsuccessful(_TestResult):
    """Outcome of an unsuccessful test."""

    outcome: Literal["error"]
    error: str


def _collate_results(
    futures: list["Future[Successful | Unsuccessful]"],
    temp_snapshot_path: Path,
    capsys: Any,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    completed_count = 0
    results: dict[str, Any] = {}
    temp_results: dict[str, Any] = {}
    errors: list[dict[str, Any]] = []

    for completed in as_completed(futures):
        if (unhandled_exc := completed.exception()) is not None:
            import traceback

            # this would only happen in the case of a timeout which should never happen
            errors.append(
                {
                    "stackup_key": "<unknown>",
                    "spec": "<unknown>",
                    "error": traceback.format_exception(unhandled_exc),
                }
            )
        else:
            test_outcome = completed.result()
            stackup_key = test_outcome.spec.stackup_key()
            if test_outcome.outcome == "success":
                rounded_result = tuple(round(coord, 6) for coord in test_outcome.result)
                result_entry = {
                    "coordinates": rounded_result,
                    "spec": test_outcome.spec.to_dict(),
                }
                results[stackup_key] = result_entry
                temp_results[stackup_key] = result_entry
            else:
                error_info = {
                    "stackup_key": stackup_key,
                    "spec": test_outcome.spec.to_dict(),
                    "error": test_outcome.error,
                }
                errors.append(error_info)

        if (len(results) + len(errors)) % 10 == 0:
            _print(
                capsys,
                f"Processed {len(results) + len(errors)}/{len(futures)} items. Successful: {len(results)}, Errors: {len(errors)}",
            )
            _save_snapshot(temp_snapshot_path, temp_results)
        completed_count += 1

    _save_snapshot(temp_snapshot_path, temp_results)
    _print(capsys, f"Completed: {len(results)} successful, {len(errors)} errors")

    return results, errors


def _process_single_test(
    spec: StackupSpec,
) -> Successful | Unsuccessful:
    """Process a single test in a subprocess to completely isolate resources."""
    from .in_subprocess_test import run_test_subprocess
    import sys

    try:
        return Successful(
            spec=spec, outcome="success", result=run_test_subprocess(spec)
        )
    except Exception:
        import sys  # noqa: F811
        import traceback

        _, exc_value, tb = sys.exc_info()

        return Unsuccessful(
            spec=spec,
            outcome="error",
            error="\n".join(traceback.format_exception(None, value=exc_value, tb=tb)),
        )


def _finalize_snapshot_update(
    snapshot_path: Path,
    temp_snapshot_path: Path,
    temp_results: dict[str, Any],
    errors: list[dict[str, Any]],
    capsys: Any,
) -> None:
    """Finalize the snapshot update by moving temp file to final location."""
    _print(capsys, "Finalizing snapshot update...")

    # Move temp file to final snapshot
    if temp_snapshot_path.exists():
        _save_snapshot(snapshot_path, temp_results)
        temp_snapshot_path.unlink()
        _print(capsys, f"Snapshot updated and saved to {snapshot_path}")
        _print(capsys, f"Temp file {temp_snapshot_path} cleaned up")
    # Fallback if temp file doesn't exist
    else:
        _save_snapshot(snapshot_path, temp_results)
        _print(capsys, f"Snapshot saved to {snapshot_path}")

    if errors:
        _print(capsys, "Errors encountered (not saved to snapshot):")
        for error in errors[:5]:  # Show first 5 errors
            _print(capsys, f"  {error['stackup_key']}: {error['error']}")

        if len(errors) > 5:
            _print(capsys, f"  ... and {len(errors) - 5} more errors")


def _compare_with_snapshot(
    snapshot_data: dict[str, Any],
    temp_results: dict[str, Any],
    errors: list[dict[str, Any]],
    temp_snapshot_path: Path,
    capsys: Any,
) -> None:
    """Compare current results with the snapshot and report differences."""
    if not snapshot_data:
        pytest.fail(
            "No snapshot found. Run with UPDATE_SNAPSHOT=1 to create the initial snapshot."
        )

    # Check for missing stackups in current run
    missing_stackups = set(snapshot_data.keys()) - set(temp_results.keys())
    if missing_stackups:
        _print(
            capsys,
            f"Warning: {len(missing_stackups)} stackups from snapshot are missing in current run",
        )

    # Check for new stackups not in snapshot
    new_stackups = set(temp_results.keys()) - set(snapshot_data.keys())
    if new_stackups:
        _print(
            capsys,
            f"Warning: {len(new_stackups)} new stackups found that are not in snapshot",
        )

    coordinate_mismatches = _find_coordinate_mismatches(snapshot_data, temp_results)

    critical_failures, warnings = _build_failure_messages(
        errors, coordinate_mismatches, missing_stackups, new_stackups
    )

    for warning in warnings:
        _print(capsys, warning)

    if critical_failures:
        pytest.fail("".join(critical_failures))

    if temp_snapshot_path.exists():
        temp_snapshot_path.unlink()
        _print(capsys, f"Cleaned up temp file: {temp_snapshot_path}")

    _print(capsys, f"All {len(temp_results)} stackup coordinates match the snapshot!")


def _find_coordinate_mismatches(
    snapshot_data: dict[str, Any], temp_results: dict[str, Any]
) -> list[dict[str, Any]]:
    """Find coordinate mismatches between snapshot and current results."""
    coordinate_mismatches = []
    for stackup_key in temp_results:
        if stackup_key in snapshot_data:
            current_coords = temp_results[stackup_key]["coordinates"]
            snapshot_coords = snapshot_data[stackup_key]["coordinates"]

            current_x, current_y, current_z = current_coords
            snapshot_x, snapshot_y, snapshot_z = snapshot_coords

            if not (
                current_x == pytest.approx(snapshot_x)
                and current_y == pytest.approx(snapshot_y)
                and current_z == pytest.approx(snapshot_z)
            ):
                coordinate_mismatches.append(
                    {
                        "stackup_key": stackup_key,
                        "expected": [snapshot_x, snapshot_y, snapshot_z],
                        "actual": [current_x, current_y, current_z],
                        "diff": (
                            round(current_x - snapshot_x, 6),
                            round(current_y - snapshot_y, 6),
                            round(current_z - snapshot_z, 6),
                        ),
                    }
                )

    return coordinate_mismatches


def _build_failure_messages(
    errors: list[dict[str, Any]],
    coordinate_mismatches: list[dict[str, Any]],
    missing_stackups: set[str],
    new_stackups: set[str],
) -> tuple[list[str], list[str]]:
    """Build comprehensive failure messages for test failures.

    critical_failures: Issues that fail the test
    warnings: Issues reported but not fail the test
    """
    critical_failures = []
    warnings = []

    if errors:
        warning_msg = (
            f"\n{len(errors)} stackups failed to execute:\n"
            + "\n".join(f"  {e['stackup_key']}: {e['error']}" for e in errors[:10])
            + (f"\n  ... and {len(errors) - 10} more" if len(errors) > 10 else "")
        )
        warnings.append(warning_msg)

    if missing_stackups:
        warnings.append(
            f"\n{len(missing_stackups)} stackups from snapshot are missing in current run"
        )

    if new_stackups:
        warnings.append(
            f"\n{len(new_stackups)} new stackups found (run with UPDATE_SNAPSHOT=1 to include them)"
        )

    if coordinate_mismatches:
        critical_failures.append(
            f"\n{len(coordinate_mismatches)} stackups have coordinate mismatches:\n"
            + "\n".join(
                f"  {m['stackup_key']}:\n"
                f"    Expected: {m['expected']}\n"
                f"    Actual:   {m['actual']}\n"
                f"    Diff:     {m['diff']}"
                for m in coordinate_mismatches
            )
        )

    return critical_failures, warnings
