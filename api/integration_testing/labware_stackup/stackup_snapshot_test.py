"""Regression testing for various stackup combinations.

This test captures the vector coordinates of possible module/adapter/labware combinations
to detect unintended changes in stackup positioning.

The errors caused by running this script are due to invalid stackups and are expected.

NOTE: The list of labware, modules, adapters and their versions are hardcoded and this should probably change.
"""

from dataclasses import dataclass
from pathlib import Path

from . import stackup_test, snapshots, stackup_spec, create_stackups
from .test_types import SuccessfulTest, CoordinateMismatch, ResultSummary


@dataclass(frozen=True)
class TestResults:
    """The results of a full test run. This test is a pass iff failed is empty."""

    snapshot_results: snapshots.SnapshotCompareResults
    stackup_results: stackup_test.TestResults
    passed: list[SuccessfulTest]
    failed: list[CoordinateMismatch]
    errored: list[stackup_test.ExceptionDuringTest]
    tested: list[stackup_spec.StackupSpec]


def summarize(results: TestResults, ignore_bad_stack: bool) -> ResultSummary:
    """Summarize the test results."""
    stackup_summary = stackup_test.summarize(results.stackup_results, ignore_bad_stack)
    snapshot_summary = snapshots.summarize(results.snapshot_results)
    return ResultSummary(
        stackup_summary.critical_failures + snapshot_summary.critical_failures,
        stackup_summary.warnings + snapshot_summary.warnings,
    )


def passed(results: TestResults, ignore_bad_stack: bool) -> bool:
    """Did the combined tests pass?"""
    return snapshots.passed(results.snapshot_results) and stackup_test.passed(
        results.stackup_results, ignore_bad_stack
    )


def run_stackup_snapshot_tests(
    filters: create_stackups.FilterSpecs | None,
    update_snapshots: bool,
    snapshot_path: Path | None,
) -> TestResults:
    """Run the stackup tests and compare to the snapshot tests.

    These tests will pass if the stackups that produce coordinates match their
    entries in the snapshot. They will ignore exceptions during that process, to tolerate invalid stackup
    combinations, unless you also specify fail_on_bad_stack.
    """
    stackups = list(
        create_stackups.create_stackups(filters or create_stackups.FilterSpecs())
    )
    stackup_tests = stackup_test.run_test(stackups)
    if update_snapshots:
        snapshots.save_snapshot(snapshot_path, stackup_tests.passed)
    snapshot_data = snapshots.load_snapshot(snapshot_path)
    snapshot_check = snapshots.compare(snapshot_data, stackup_tests.passed)
    return TestResults(
        snapshot_results=snapshot_check,
        stackup_results=stackup_tests,
        passed=list(snapshot_check.passed.values()),
        failed=list(snapshot_check.failed.values()),
        errored=list(stackup_tests.errored),
        tested=stackups,
    )
