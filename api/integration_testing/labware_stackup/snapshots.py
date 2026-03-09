"""Handle the snapshot compare and update."""

from dataclasses import dataclass
from pathlib import Path
from math import isclose
import json
from .test_types import SuccessfulTest, CoordinateMismatch, ResultSummary
from .stackup_spec import StackupSpec
from .data import SNAPSHOT_PATH_DEFAULT


@dataclass(frozen=True)
class SnapshotCompareResults:
    """The results of a snapshot comparison."""

    passed: dict[str, SuccessfulTest]
    failed: dict[str, CoordinateMismatch]
    not_in_snapshot: set[str]
    not_in_run: set[str]


def load_snapshot(snapshot_path: Path | None) -> dict[str, SuccessfulTest]:
    """Load the snapshot file if it exists."""
    checked_snapshot_path = snapshot_path or SNAPSHOT_PATH_DEFAULT
    if checked_snapshot_path.exists():
        with open(checked_snapshot_path, "r") as f:
            python_dct = json.load(f)
            return {
                k: SuccessfulTest(
                    coordinates=(
                        v["coordinates"][0],
                        v["coordinates"][1],
                        v["coordinates"][2],
                    ),
                    spec=StackupSpec(**v["spec"]),
                )
                for k, v in python_dct.items()
            }
    return {}


def save_snapshot(snapshot_path: Path | None, data: dict[str, SuccessfulTest]) -> None:
    """Save the snapshot file."""
    checked_snapshot_path = snapshot_path or SNAPSHOT_PATH_DEFAULT
    python_dct = {
        k: {"coordinates": v.coordinates, "spec": v.spec.to_dict()}
        for k, v in data.items()
    }
    with open(checked_snapshot_path, "w") as f:
        json.dump(python_dct, f, indent=2, sort_keys=True)


def find_coordinate_mismatches(
    snapshot_data: dict[str, SuccessfulTest], test_results: dict[str, SuccessfulTest]
) -> tuple[dict[str, SuccessfulTest], dict[str, CoordinateMismatch]]:
    """Find coordinate mismatches between snapshot and current results."""
    coordinate_mismatches = {}
    actually_ok = {}
    for stackup_key, result in test_results.items():
        if stackup_key in snapshot_data:
            current_coords = result.coordinates
            snapshot_coords = snapshot_data[stackup_key].coordinates

            current_x, current_y, current_z = current_coords
            snapshot_x, snapshot_y, snapshot_z = snapshot_coords

            if not (
                isclose(snapshot_x, current_x)
                and isclose(snapshot_y, current_y)
                and isclose(snapshot_z, current_z)
            ):
                coordinate_mismatches["stackup_key"] = CoordinateMismatch(
                    spec=result.spec,
                    snapshotted=snapshot_coords,
                    this_test=current_coords,
                    diff=(
                        round(current_x - snapshot_x, 6),
                        round(current_y - snapshot_y, 6),
                        round(current_z - snapshot_z, 6),
                    ),
                )
            else:
                actually_ok[stackup_key] = result

    return actually_ok, coordinate_mismatches


def find_untested_snapshots(
    snapshot_data: dict[str, SuccessfulTest], test_results: dict[str, SuccessfulTest]
) -> set[str]:
    """Find snapshots that didn't get run."""
    return set(snapshot_data.keys()) - set(test_results.keys())


def find_unsnapshotted_tests(
    snapshot_data: dict[str, SuccessfulTest], test_results: dict[str, SuccessfulTest]
) -> set[str]:
    """Find tests that weren't snapshotted."""
    return set(test_results.keys()) - set(snapshot_data.keys())


def compare(
    snapshot_data: dict[str, SuccessfulTest], test_results: dict[str, SuccessfulTest]
) -> SnapshotCompareResults:
    """Compare passed tests (that resulted in coordinates) to the snapshot."""
    passed, mismatched = find_coordinate_mismatches(snapshot_data, test_results)
    return SnapshotCompareResults(
        passed=passed,
        failed=mismatched,
        not_in_snapshot=find_unsnapshotted_tests(snapshot_data, test_results),
        not_in_run=find_untested_snapshots(snapshot_data, test_results),
    )


def summarize(snapshot_results: SnapshotCompareResults) -> ResultSummary:
    """Get a human-oriented summary of snapshot tests."""
    warnings: list[str] = []
    errors: list[str] = []
    if snapshot_results.not_in_run:
        warnings.append(
            f"Warning: {len(snapshot_results.not_in_run)} stackups from snapshot are missing in current run"
        )
    if snapshot_results.not_in_snapshot:
        warnings.append(
            f"Warning: {len(snapshot_results.not_in_snapshot)} new stackups found that are not in snapshot"
        )
    if snapshot_results.failed:
        mismatches = [
            f"  {k}:\n"
            + f"    Snapshotted: {v.snapshotted}\n"
            + f"    This test:   {v.this_test}\n"
            + f"    Diff:     {v.diff}"
            for k, v in snapshot_results.failed.items()
        ]
        errors.append(
            f"\n{len(snapshot_results.failed)} stackups have coordinate mismatches:\n"
            + "\n".join(mismatches)
        )
    return ResultSummary(warnings=warnings, critical_failures=errors)


def passed(snapshot_results: SnapshotCompareResults) -> bool:
    """Did this snapshot test pass?"""
    return snapshot_results.failed == {}
