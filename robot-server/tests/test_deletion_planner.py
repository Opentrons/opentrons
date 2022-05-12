"""Unit tests for `deletion_planner`."""


import pytest

from typing import List, NamedTuple, Set

from robot_server.deletion_planner import (
    ProtocolSpec,
    ProtocolDeletionPlanner,
    RunDeletionPlanner,
)


class _DeletionPlanTestSpec(NamedTuple):
    maximum_runs: int
    input_runs: List[str]
    expected_deletion_plan: Set[str]


_deletion_plan_test_specs = [
    _DeletionPlanTestSpec(
        maximum_runs=1,
        input_runs=["run-1", "run-2", "run-3", "run-4", "run-5"],
        expected_deletion_plan=set(["run-1", "run-2", "run-3", "run-4", "run-5"]),
    ),
    _DeletionPlanTestSpec(
        maximum_runs=2,
        input_runs=["run-1", "run-2", "run-3", "run-4", "run-5"],
        expected_deletion_plan=set(["run-1", "run-2", "run-3", "run-4"]),
    ),
    _DeletionPlanTestSpec(
        maximum_runs=3,
        input_runs=["run-1", "run-2", "run-3", "run-4", "run-5"],
        expected_deletion_plan=set(["run-1", "run-2", "run-3"]),
    ),
    _DeletionPlanTestSpec(
        maximum_runs=999999,
        input_runs=["run-1", "run-2", "run-3", "run-4", "run-5"],
        expected_deletion_plan=set(),
    ),
]


@pytest.mark.parametrize(_DeletionPlanTestSpec._fields, _deletion_plan_test_specs)
def test_plan_for_new_run(
    maximum_runs: int,
    input_runs: List[str],
    expected_deletion_plan: Set[str],
) -> None:
    """It should return a plan that leaves at least one slot open for a new run."""
    subject = RunDeletionPlanner(maximum_runs=maximum_runs)
    result = subject.plan_for_new_run(existing_runs=input_runs)
    assert result == expected_deletion_plan
