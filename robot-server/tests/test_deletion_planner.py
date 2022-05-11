"""Unit tests for `deletion_planner`."""


from robot_server.deletion_planner import (
    ProtocolSpec,
    ProtocolDeletionPlanner,
    RunDeletionPlanner,
)


def test_protocol_deletion() -> None:  # noqa: D103
    # TODO: Add tests for protocol deletion.
    raise NotImplementedError()


def test_run_deletion_maximum_of_zero() -> None:  # noqa: D103
    subject = RunDeletionPlanner(maximum_runs=0)
    input_runs = [f"run-{i+1}" for i in range(5)]

    # If the maximum runs is 0, everything should be deleted.
    assert subject.plan_deletions_for_new_run(existing_runs=input_runs,) == set(
        [
            "run-1",
            "run-2",
            "run-3",
            "run-4",
            "run-5",
        ],
    )


def test_run_deletion_several_deleted() -> None:  # noqa: D103
    subject = RunDeletionPlanner(maximum_runs=2)
    input_runs = [f"run-{i+1}" for i in range(5)]

    # If the maximum runs is below the number of current runs,
    # enough runs should be deleted that the new count is one fewer than
    # the maximum runs. Runs should be deleted oldest-first.
    assert subject.plan_deletions_for_new_run(existing_runs=input_runs,) == set(
        [
            "run-1",
            "run-2",
            "run-3",
            "run-4",
        ]
    )


def test_run_deletion_exactly_equal() -> None:  # noqa: D103
    subject = RunDeletionPlanner(maximum_runs=5)
    input_runs = [f"run-{i+1}" for i in range(5)]

    # If the maximum runs is exactly equal to the number of current runs,
    # the single oldest run should be deleted to make room for one new one.
    assert subject.plan_deletions_for_new_run(
        existing_runs=input_runs,
    ) == set(["run-1"])


def test_run_deletion_no_deletions_needed() -> None:  # noqa: D103
    subject = RunDeletionPlanner(maximum_runs=6)
    input_runs = [f"run-{i+1}" for i in range(5)]

    # If the maximum runs is at least one more than the number of current runs,
    # no runs should be deleted.
    assert (
        subject.plan_deletions_for_new_run(
            existing_runs=input_runs,
        )
        == set()
    )
