"""Unit tests for `deletion_planner`."""

import pytest

from dataclasses import dataclass
from typing import List, NamedTuple, Set

from robot_server.deletion_planner import (
    ProtocolDeletionPlanner,
    RunDeletionPlanner,
    DataFileDeletionPlanner,
    FileUsageInfo,
)


@dataclass
class _ProtocolInfo:
    protocol_id: str
    is_used_by_run: bool


class _ProtocolDeletionTestSpec(NamedTuple):
    """Input and expected output for a single protocol deletion test."""

    maximum_unused_protocols: int
    existing_protocols: List[_ProtocolInfo]
    expected_deletion_plan: Set[str]


_protocol_deletion_test_specs = [
    _ProtocolDeletionTestSpec(
        maximum_unused_protocols=1,
        existing_protocols=[
            _ProtocolInfo(protocol_id="p-1-unused", is_used_by_run=False),
            _ProtocolInfo(protocol_id="p-2-used", is_used_by_run=True),
            _ProtocolInfo(protocol_id="p-3-unused", is_used_by_run=False),
            _ProtocolInfo(protocol_id="p-4-used", is_used_by_run=True),
            _ProtocolInfo(protocol_id="p-5-unused", is_used_by_run=False),
        ],
        expected_deletion_plan=set(["p-1-unused", "p-3-unused", "p-5-unused"]),
    ),
    _ProtocolDeletionTestSpec(
        maximum_unused_protocols=2,
        existing_protocols=[
            _ProtocolInfo(protocol_id="p-1-unused", is_used_by_run=False),
            _ProtocolInfo(protocol_id="p-2-used", is_used_by_run=True),
            _ProtocolInfo(protocol_id="p-3-unused", is_used_by_run=False),
            _ProtocolInfo(protocol_id="p-4-used", is_used_by_run=True),
            _ProtocolInfo(protocol_id="p-5-unused", is_used_by_run=False),
        ],
        expected_deletion_plan=set(["p-1-unused", "p-3-unused"]),
    ),
    _ProtocolDeletionTestSpec(
        maximum_unused_protocols=3,
        existing_protocols=[
            _ProtocolInfo(protocol_id="p-1-unused", is_used_by_run=False),
            _ProtocolInfo(protocol_id="p-2-used", is_used_by_run=True),
            _ProtocolInfo(protocol_id="p-3-unused", is_used_by_run=False),
            _ProtocolInfo(protocol_id="p-4-used", is_used_by_run=True),
            _ProtocolInfo(protocol_id="p-5-unused", is_used_by_run=False),
        ],
        expected_deletion_plan=set(["p-1-unused"]),
    ),
    _ProtocolDeletionTestSpec(
        maximum_unused_protocols=999999,
        existing_protocols=[
            _ProtocolInfo(protocol_id="p-1-unused", is_used_by_run=False),
            _ProtocolInfo(protocol_id="p-2-used", is_used_by_run=True),
            _ProtocolInfo(protocol_id="p-3-unused", is_used_by_run=False),
            _ProtocolInfo(protocol_id="p-4-used", is_used_by_run=True),
            _ProtocolInfo(protocol_id="p-5-unused", is_used_by_run=False),
        ],
        expected_deletion_plan=set(),
    ),
]


@pytest.mark.parametrize(
    _ProtocolDeletionTestSpec._fields, _protocol_deletion_test_specs
)
def test_plan_for_new_protocol(
    maximum_unused_protocols: int,
    existing_protocols: List[_ProtocolInfo],
    expected_deletion_plan: Set[str],
) -> None:
    """It should return a plan that leaves at least one slot open for a new protocol."""
    subject = ProtocolDeletionPlanner(maximum_unused_protocols=maximum_unused_protocols)
    result = subject.plan_for_new_protocol(existing_protocols=existing_protocols)
    assert result == expected_deletion_plan


class _RunDeletionTestSpec(NamedTuple):
    """Input and expected output for a single run deletion test."""

    maximum_runs: int
    existing_runs: List[str]
    expected_deletion_plan: Set[str]


_run_deletion_test_specs = [
    _RunDeletionTestSpec(
        maximum_runs=1,
        existing_runs=["run-1", "run-2", "run-3", "run-4", "run-5"],
        expected_deletion_plan=set(["run-1", "run-2", "run-3", "run-4", "run-5"]),
    ),
    _RunDeletionTestSpec(
        maximum_runs=2,
        existing_runs=["run-1", "run-2", "run-3", "run-4", "run-5"],
        expected_deletion_plan=set(["run-1", "run-2", "run-3", "run-4"]),
    ),
    _RunDeletionTestSpec(
        maximum_runs=3,
        existing_runs=["run-1", "run-2", "run-3", "run-4", "run-5"],
        expected_deletion_plan=set(["run-1", "run-2", "run-3"]),
    ),
    _RunDeletionTestSpec(
        maximum_runs=999999,
        existing_runs=["run-1", "run-2", "run-3", "run-4", "run-5"],
        expected_deletion_plan=set(),
    ),
]


@pytest.mark.parametrize(_RunDeletionTestSpec._fields, _run_deletion_test_specs)
def test_plan_for_new_run(
    maximum_runs: int,
    existing_runs: List[str],
    expected_deletion_plan: Set[str],
) -> None:
    """It should return a plan that leaves at least one slot open for a new run."""
    subject = RunDeletionPlanner(maximum_runs=maximum_runs)
    result = subject.plan_for_new_run(existing_runs=existing_runs)
    assert result == expected_deletion_plan


class _FileDeletionTestSpec(NamedTuple):
    """Input and expected output for a single file deletion."""

    maximum_files: int
    existing_files: List[FileUsageInfo]
    expected_deletion_plan: Set[str]


_file_deletion_test_specs = [
    _FileDeletionTestSpec(
        maximum_files=3,
        existing_files=[
            FileUsageInfo(file_id="f-1-unused", used_by_run_or_analysis=False),
            FileUsageInfo(file_id="f-2-used", used_by_run_or_analysis=True),
            FileUsageInfo(file_id="f-3-unused", used_by_run_or_analysis=False),
            FileUsageInfo(file_id="f-4-used", used_by_run_or_analysis=True),
            FileUsageInfo(file_id="f-5-unused", used_by_run_or_analysis=False),
        ],
        expected_deletion_plan={"f-1-unused", "f-3-unused", "f-5-unused"},
    ),
    _FileDeletionTestSpec(
        maximum_files=3,
        existing_files=[
            FileUsageInfo(file_id="f-1-used", used_by_run_or_analysis=True),
            FileUsageInfo(file_id="f-2-used", used_by_run_or_analysis=True),
            FileUsageInfo(file_id="f-3-used", used_by_run_or_analysis=True),
            FileUsageInfo(file_id="f-4-used", used_by_run_or_analysis=True),
        ],
        expected_deletion_plan=set(),
    ),
    _FileDeletionTestSpec(
        maximum_files=3,
        existing_files=[
            FileUsageInfo(file_id="f-1-used", used_by_run_or_analysis=True),
            FileUsageInfo(file_id="f-2-unused", used_by_run_or_analysis=False),
            FileUsageInfo(file_id="f-3-used", used_by_run_or_analysis=True),
        ],
        expected_deletion_plan={"f-2-unused"},
    ),
]


@pytest.mark.parametrize(_FileDeletionTestSpec._fields, _file_deletion_test_specs)
def test_plan_for_new_data_file(
    maximum_files: int,
    existing_files: List[FileUsageInfo],
    expected_deletion_plan: Set[str],
) -> None:
    """It should return a plan that leaves at least one slot open for a new data file."""
    subject = DataFileDeletionPlanner(maximum_files=maximum_files)
    result = subject.plan_for_new_file(existing_files=existing_files)
    assert result == expected_deletion_plan
