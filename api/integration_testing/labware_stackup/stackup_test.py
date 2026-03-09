"""Automated testing for how labware stackups stack up."""

from dataclasses import dataclass
from concurrent.futures import ProcessPoolExecutor, as_completed, Future

from .stackup_spec import StackupSpec
from .test_types import SuccessfulTest, ResultSummary
from . import data


@dataclass(frozen=True)
class ExceptionDuringTest:
    """The data from a test that failed because of an exception.

    This may not cause an overall test failure.

    Specs as a whole cannot be relied upon during exceptions; spec_name will be reliably present but
    may be a standin if the failing spec is unknown.
    """

    spec: StackupSpec | None
    spec_name: str
    error: str


@dataclass(frozen=True)
class TestResults:
    """The results of a full test run. This test is a pass iff failed is empty."""

    tested: dict[str, StackupSpec]
    errored: list[ExceptionDuringTest]
    passed: dict[str, SuccessfulTest]


def _init_swallow_logging() -> None:
    import sys
    import io

    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()


def run_test(
    specs: list[StackupSpec],
) -> TestResults:
    """Run all stackup tests."""
    robot_counts: dict[str, int] = {}

    for robot_type in data.ROBOT_TYPES:
        robot_specs = [spec for spec in specs if spec.robot_type == robot_type]
        robot_counts[robot_type] = len(robot_specs)

    robot_info = ", then ".join(
        f"{count} {robot_type} stackups" for robot_type, count in robot_counts.items()
    )

    print(f"Processing {robot_info}...")
    executor = ProcessPoolExecutor(initializer=_init_swallow_logging)
    futures = [executor.submit(_process_single_test, spec) for spec in specs]
    try:
        return _collate_results(futures, specs)
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def _collate_results(
    futures: list["Future[SuccessfulTest | ExceptionDuringTest]"],
    specs: list[StackupSpec],
) -> TestResults:
    completed_count = 0
    results: dict[str, SuccessfulTest] = {}
    errors: list[ExceptionDuringTest] = []

    for completed in as_completed(futures):
        if (unhandled_exc := completed.exception()) is not None:
            import traceback

            # this would only happen in the case of a timeout which should never happen
            errors.append(
                ExceptionDuringTest(
                    spec=None,
                    spec_name="unknown",
                    error="\n".join(traceback.format_exception(unhandled_exc)),
                )
            )
        else:
            test_outcome = completed.result()
            if isinstance(test_outcome, SuccessfulTest):
                results[test_outcome.spec.stackup_key()] = test_outcome
            else:
                errors.append(test_outcome)

        if (len(results) + len(errors)) % 10 == 0:
            print(
                f"Processed {len(results) + len(errors)}/{len(futures)} items. Successful: {len(results)}, Errors: {len(errors)}",
            )
        completed_count += 1

    print(f"Completed: {len(results)} successful, {len(errors)} errors")

    return TestResults(
        passed=results,
        errored=errors,
        tested={spec.stackup_key(): spec for spec in specs},
    )


def _process_single_test(
    spec: StackupSpec,
) -> SuccessfulTest | ExceptionDuringTest:
    """Process a single test in a subprocess to completely isolate resources."""
    from .in_subprocess_test import run_test_subprocess
    import sys

    try:
        return SuccessfulTest(
            spec=spec, coordinates=tuple(round(c, 6) for c in run_test_subprocess(spec))  # type: ignore[arg-type]
        )
    except Exception:
        import sys  # noqa: F811
        import traceback

        _, exc_value, tb = sys.exc_info()

        return ExceptionDuringTest(
            spec=spec,
            spec_name=spec.stackup_key(),
            error="\n".join(traceback.format_exception(None, value=exc_value, tb=tb)),
        )


def passed(results: TestResults, ignore_unstackable: bool) -> bool:
    """Should this test be considered passed?"""
    return ignore_unstackable or results.errored == []


def summarize(results: TestResults, ignore_unstackable: bool) -> ResultSummary:
    """Build human-oriented summaries from test results."""
    if not results.errored:
        return ResultSummary(warnings=[], critical_failures=[])
    critical_failures = []
    warnings = []

    error_message = (
        (
            f"\n{len(results.errored)} stackups failed to execute:\n"
            + "\n".join(
                (f"  {err.spec_name}: {err.error}" for err in results.errored[:10])
            )
            + (
                f"\n  ... and {len(results.errored) - 10} more"
                if len(results.errored) > 10
                else ""
            )
        )
        if results.errored
        else ""
    )
    if ignore_unstackable:
        warnings.append(error_message)
    else:
        critical_failures.append(error_message)
        for error in results.errored[:5]:
            critical_failures.append(f"  {error.spec_name}: {error.error}")
        if len(results.errored) > 5:
            critical_failures.append(
                f"  ... and {len(results.errored) - 5} more errors"
            )

    return ResultSummary(warnings=warnings, critical_failures=critical_failures)
