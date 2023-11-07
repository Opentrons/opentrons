"""Tests for robot_server.runs.run_store."""
from datetime import datetime, timezone
from typing import List, Optional, Type

import pytest
from sqlalchemy.engine import Engine

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from robot_server.protocols.protocol_store import ProtocolNotFoundError
from robot_server.runs.run_store import (
    RunStore,
    RunResource,
    CommandNotFoundError,
)
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.action_models import RunAction, RunActionType

from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
    StateSummary,
    CommandSlice,
    Liquid,
    EngineStatus,
)
from opentrons.types import MountType, DeckSlotName


@pytest.fixture
def subject(sql_engine: Engine) -> RunStore:
    """Get a ProtocolStore test subject."""
    return RunStore(sql_engine=sql_engine)


@pytest.fixture
def protocol_commands() -> List[pe_commands.Command]:
    """Get a StateSummary value object."""
    return [
        pe_commands.WaitForResume(
            id="pause-1",
            key="command-key",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=pe_commands.WaitForResumeParams(message="hello world"),
            result=pe_commands.WaitForResumeResult(),
        ),
        pe_commands.WaitForResume(
            id="pause-2",
            key="command-key",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2022, month=2, day=2),
            params=pe_commands.WaitForResumeParams(message="hey world"),
            result=pe_commands.WaitForResumeResult(),
        ),
        pe_commands.WaitForResume(
            id="pause-3",
            key="command-key",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2023, month=3, day=3),
            params=pe_commands.WaitForResumeParams(message="sup world"),
            result=pe_commands.WaitForResumeResult(),
        ),
    ]


@pytest.fixture
def state_summary() -> StateSummary:
    """Get a StateSummary test object."""
    analysis_error = pe_errors.ErrorOccurrence(
        id="error-id",
        createdAt=datetime(year=2023, month=3, day=3),
        errorType="BadError",
        detail="oh no",
    )

    analysis_labware = pe_types.LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=pe_types.DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId=None,
    )

    analysis_pipette = pe_types.LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    liquids = [Liquid(id="some-id", displayName="water", description="water desc")]

    return StateSummary(
        errors=[analysis_error],
        labware=[analysis_labware],
        pipettes=[analysis_pipette],
        # TODO(mc, 2022-02-14): evaluate usage of modules in the analysis resp.
        modules=[],
        # TODO (tz 22-4-19): added the field to class. make sure what to initialize
        labwareOffsets=[],
        status=EngineStatus.IDLE,
        liquids=liquids,
    )


@pytest.fixture
def invalid_state_summary() -> StateSummary:
    """Should fail pydantic validation."""
    analysis_error = pe_errors.ErrorOccurrence.construct(
        id="error-id",
        # Invalid value here should fail analysis
        createdAt=MountType.LEFT,  # type: ignore
        errorType="BadError",
        detail="oh no",
    )

    analysis_labware = pe_types.LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=pe_types.DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId=None,
    )

    analysis_pipette = pe_types.LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    liquids = [Liquid(id="some-id", displayName="water", description="water desc")]

    return StateSummary(
        errors=[analysis_error],
        labware=[analysis_labware],
        pipettes=[analysis_pipette],
        # TODO(mc, 2022-02-14): evaluate usage of modules in the analysis resp.
        modules=[],
        # TODO (tz 22-4-19): added the field to class. make sure what to initialize
        labwareOffsets=[],
        status=EngineStatus.IDLE,
        liquids=liquids,
    )


def test_update_run_state(
    subject: RunStore,
    state_summary: StateSummary,
    protocol_commands: List[pe_commands.Command],
) -> None:
    """It should be able to update a run state to the store."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        id="action-id",
    )

    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.insert_action(run_id="run-id", action=action)

    result = subject.update_run_state(
        run_id="run-id",
        summary=state_summary,
        commands=protocol_commands,
    )
    run_summary_result = subject.get_state_summary(run_id="run-id")
    commands_result = subject.get_commands_slice(
        run_id="run-id",
        length=len(protocol_commands),
        cursor=0,
    )

    assert result == RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[action],
    )
    assert run_summary_result == state_summary
    assert commands_result.commands == protocol_commands


def test_update_state_run_not_found(
    subject: RunStore,
    state_summary: StateSummary,
    protocol_commands: List[pe_commands.Command],
) -> None:
    """It should be able to catch the exception raised by insert."""
    with pytest.raises(RunNotFoundError, match="run-not-found"):
        subject.update_run_state(
            run_id="run-not-found",
            summary=state_summary,
            commands=protocol_commands,
        )


def test_add_run(subject: RunStore) -> None:
    """It should be able to add a new run to the store."""
    result = subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
    )

    assert result == RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        actions=[],
    )


def test_insert_actions_missing_run_id(subject: RunStore) -> None:
    """Should not be able to insert an action with a run id that does not exist."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        id="action-id",
    )

    with pytest.raises(RunNotFoundError, match="missing-run-id"):
        subject.insert_action(run_id="missing-run-id", action=action)


def test_insert_run_missing_protocol_id(subject: RunStore) -> None:
    """Should not be able to insert an action with a run id that does not exist."""
    with pytest.raises(ProtocolNotFoundError, match="missing-protocol-id"):
        subject.insert(
            run_id="run-id",
            protocol_id="missing-protocol-id",
            created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        )


def test_get_run_no_actions(subject: RunStore) -> None:
    """It can get a previously stored run entry."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )

    result = subject.get("run-id")

    assert result == RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[],
    )


def test_get_run(subject: RunStore) -> None:
    """It can get a previously stored run entry."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        id="action-id",
    )

    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )

    subject.insert_action("run-id", action)

    result = subject.get(run_id="run-id")

    assert result == RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[action],
    )


def test_get_run_missing(subject: RunStore) -> None:
    """It raises if the run does not exist."""
    with pytest.raises(RunNotFoundError, match="run-id"):
        subject.get(run_id="run-id")


@pytest.mark.parametrize(
    "length, expected_result",
    [
        (0, []),
        (
            1,
            [
                RunResource(
                    run_id="run-id-2",
                    protocol_id=None,
                    created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
                    actions=[],
                )
            ],
        ),
        (
            20,
            [
                RunResource(
                    run_id="run-id-1",
                    protocol_id=None,
                    created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
                    actions=[],
                ),
                RunResource(
                    run_id="run-id-2",
                    protocol_id=None,
                    created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
                    actions=[],
                ),
            ],
        ),
        (
            None,
            [
                RunResource(
                    run_id="run-id-1",
                    protocol_id=None,
                    created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
                    actions=[],
                ),
                RunResource(
                    run_id="run-id-2",
                    protocol_id=None,
                    created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
                    actions=[],
                ),
            ],
        ),
    ],
)
def test_get_all_runs(
    subject: RunStore, length: Optional[int], expected_result: List[RunResource]
) -> None:
    """It gets the number of created runs supplied in length."""
    subject.insert(
        run_id="run-id-1",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.insert(
        run_id="run-id-2",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
    )

    result = subject.get_all(length=length)

    assert result == expected_result


def test_remove_run(subject: RunStore) -> None:
    """It can remove a previously stored run entry."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        id="action-id",
    )

    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.insert_action(run_id="run-id", action=action)
    subject.remove(run_id="run-id")

    assert subject.get_all(length=20) == []


def test_remove_run_missing_id(subject: RunStore) -> None:
    """It raises if the run does not exist."""
    with pytest.raises(RunNotFoundError, match="run-id"):
        subject.remove(run_id="run-id")


def test_insert_actions_no_run(subject: RunStore) -> None:
    """Insert actions with a run that doesn't exist should raise an exception."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2023, month=3, day=3, tzinfo=timezone.utc),
        id="action-id-1",
    )

    with pytest.raises(Exception):
        subject.insert_action(run_id="run-id-996", action=action)


def test_get_state_summary(subject: RunStore, state_summary: StateSummary) -> None:
    """It should be able to get store run data."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.update_run_state(run_id="run-id", summary=state_summary, commands=[])
    result = subject.get_state_summary(run_id="run-id")
    assert result == state_summary


def test_get_state_summary_failure(
    subject: RunStore, invalid_state_summary: StateSummary
) -> None:
    """It should return None."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.update_run_state(
        run_id="run-id", summary=invalid_state_summary, commands=[]
    )
    result = subject.get_state_summary(run_id="run-id")
    assert result is None


def test_get_state_summary_none(subject: RunStore) -> None:
    """It should return None if no state data stored."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    result = subject.get_state_summary(run_id="run-id")
    assert result is None


def test_has_run_id(subject: RunStore) -> None:
    """It should tell us if a given ID is in the store."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    result = subject.has("run-id")
    assert result is True


def test_has_no_run_id(subject: RunStore) -> None:
    """It should tell us if a given ID is not in the store."""
    result = subject.has("no-run-id")
    assert result is False


def test_get_command(
    subject: RunStore,
    protocol_commands: List[pe_commands.Command],
    state_summary: StateSummary,
) -> None:
    """Should return a run command from the db."""
    subject.insert(
        run_id="run-id", protocol_id=None, created_at=datetime.now(timezone.utc)
    )
    subject.update_run_state(
        run_id="run-id",
        summary=state_summary,
        commands=protocol_commands,
    )
    result = subject.get_command(run_id="run-id", command_id="pause-2")

    assert result == protocol_commands[1]


@pytest.mark.parametrize(
    "input_run_id, input_command_id, expected_exception",
    [
        ("not-run-id", "pause-1", RunNotFoundError),
        ("run-id", "not-command-id", CommandNotFoundError),
    ],
)
def test_get_command_raise_exception(
    subject: RunStore,
    protocol_commands: List[pe_commands.Command],
    state_summary: StateSummary,
    input_run_id: str,
    input_command_id: str,
    expected_exception: Type[Exception],
) -> None:
    """Should raise exception."""
    subject.insert(
        run_id="run-id", protocol_id=None, created_at=datetime.now(timezone.utc)
    )
    subject.update_run_state(
        run_id="run-id",
        summary=state_summary,
        commands=protocol_commands,
    )
    with pytest.raises(expected_exception):
        subject.get_command(run_id=input_run_id, command_id=input_command_id)


def test_get_command_slice(
    subject: RunStore,
    protocol_commands: List[pe_commands.Command],
    state_summary: StateSummary,
) -> None:
    """It should return slices of commands."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.update_run_state(
        run_id="run-id",
        summary=state_summary,
        commands=protocol_commands,
    )
    result = subject.get_commands_slice(
        run_id="run-id", cursor=0, length=len(protocol_commands)
    )

    assert result == CommandSlice(
        cursor=0,
        total_length=len(protocol_commands),
        commands=protocol_commands,
    )


@pytest.mark.parametrize(
    ("input_cursor", "input_length", "expected_cursor", "expected_command_ids"),
    [
        (0, 0, 0, []),
        (None, 0, 2, []),
        (0, 3, 0, ["pause-1", "pause-2", "pause-3"]),
        (0, 1, 0, ["pause-1"]),
        (1, 2, 1, ["pause-2", "pause-3"]),
        (0, 999, 0, ["pause-1", "pause-2", "pause-3"]),
        (1, 999, 1, ["pause-2", "pause-3"]),
        (None, 3, 0, ["pause-1", "pause-2", "pause-3"]),
        (None, 2, 1, ["pause-2", "pause-3"]),
        (999, 2, 2, ["pause-3"]),
    ],
)
def test_get_commands_slice_clamping(
    subject: RunStore,
    protocol_commands: List[pe_commands.Command],
    state_summary: StateSummary,
    input_cursor: Optional[int],
    input_length: int,
    expected_cursor: int,
    expected_command_ids: List[str],
) -> None:
    """It should clamp slice cursor and page length."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.update_run_state(
        run_id="run-id",
        summary=state_summary,
        commands=protocol_commands,
    )
    result = subject.get_commands_slice(
        run_id="run-id", cursor=input_cursor, length=input_length
    )

    assert result.cursor == expected_cursor
    assert result.total_length == len(protocol_commands)
    assert [
        result_command.id for result_command in result.commands
    ] == expected_command_ids


def test_get_run_command_slice_none(subject: RunStore) -> None:
    """It should return None if no commands stored."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )

    result = subject.get_commands_slice(run_id="run-id", length=999, cursor=None)
    assert result == CommandSlice(commands=[], cursor=0, total_length=0)


def test_get_commands_slice_run_not_found(subject: RunStore) -> None:
    """Should raise an error RunNotFoundError."""
    subject.insert(
        run_id="run-id", protocol_id=None, created_at=datetime.now(timezone.utc)
    )
    with pytest.raises(RunNotFoundError):
        subject.get_commands_slice(run_id="not-run-id", cursor=1, length=3)
