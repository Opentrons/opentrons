"""Tests for robot_server.runs.run_store."""
import pytest
from datetime import datetime, timezone
from typing import List
from sqlalchemy.engine import Engine

from robot_server.protocols.protocol_store import ProtocolNotFoundError
from robot_server.runs.run_store import (
    RunStore,
    RunResource,
    RunNotFoundError,
    CommandNotFoundError,
)
from robot_server.runs.action_models import RunAction, RunActionType

from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
    ProtocolRunData,
    CommandSlice,
)
from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import EngineStatus


@pytest.fixture
def subject(sql_engine: Engine) -> RunStore:
    """Get a ProtocolStore test subject."""
    return RunStore(sql_engine=sql_engine)


@pytest.fixture
def protocol_commands() -> List[pe_commands.Command]:
    """Get a ProtocolRunData value object."""
    return [
        pe_commands.Pause(
            id="pause-1",
            key="command-key",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=pe_commands.PauseParams(message="hello world"),
            result=pe_commands.PauseResult(),
        ),
        pe_commands.Pause(
            id="pause-2",
            key="command-key",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2022, month=2, day=2),
            params=pe_commands.PauseParams(message="hey world"),
            result=pe_commands.PauseResult(),
        ),
        pe_commands.Pause(
            id="pause-3",
            key="command-key",
            status=pe_commands.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2023, month=3, day=3),
            params=pe_commands.PauseParams(message="sup world"),
            result=pe_commands.PauseResult(),
        ),
    ]


@pytest.fixture
def protocol_run() -> ProtocolRunData:
    """Get a ProtocolRunData test object."""
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
        pipetteName=pe_types.PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    return ProtocolRunData(
        errors=[analysis_error],
        labware=[analysis_labware],
        pipettes=[analysis_pipette],
        # TODO(mc, 2022-02-14): evaluate usage of modules in the analysis resp.
        modules=[],
        # TODO (tz 22-4-19): added the field to class. make sure what to initialize
        labwareOffsets=[],
        status=EngineStatus.IDLE,
    )


def test_update_run_state(
    subject: RunStore,
    protocol_run: ProtocolRunData,
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
        run_data=protocol_run,
        commands=protocol_commands,
    )
    run_data_result = subject.get_run_data(run_id="run-id")
    commands_result = subject.get_run_commands(run_id="run-id")

    assert result == RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[action],
    )
    assert run_data_result == protocol_run
    assert commands_result == protocol_commands


def test_update_state_run_not_found(
    subject: RunStore,
    protocol_run: ProtocolRunData,
    protocol_commands: List[pe_commands.Command],
) -> None:
    """It should be able to catch the exception raised by insert."""
    with pytest.raises(RunNotFoundError, match="run-not-found"):
        subject.update_run_state(
            run_id="run-not-found",
            run_data=protocol_run,
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


def test_get_all_runs(subject: RunStore) -> None:
    """It can get all created runs."""
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

    result = subject.get_all()

    assert result == [
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
    ]


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

    assert subject.get_all() == []


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


def test_get_run_commands(
    subject: RunStore,
    protocol_run: ProtocolRunData,
    protocol_commands: List[pe_commands.Command],
) -> None:
    """It should be able to get all stored run commands."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.update_run_state(
        run_id="run-id",
        run_data=protocol_run,
        commands=protocol_commands,
    )
    result = subject.get_run_commands(run_id="run-id")
    assert result == protocol_commands


def test_get_run_commands_none(
    subject: RunStore,
    protocol_run: ProtocolRunData,
    protocol_commands: List[pe_commands.Command],
) -> None:
    """It should return None if no commands stored."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )

    result = subject.get_run_commands(run_id="run-id")
    assert result == []


def test_get_run_data(subject: RunStore, protocol_run: ProtocolRunData) -> None:
    """It should be able to get store run data."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    subject.update_run_state(run_id="run-id", run_data=protocol_run, commands=[])
    result = subject.get_run_data(run_id="run-id")
    assert result == protocol_run


def test_get_run_data_none(subject: RunStore) -> None:
    """It should return None if no state data stored."""
    subject.insert(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
    )
    result = subject.get_run_data(run_id="run-id")
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
    protocol_run: ProtocolRunData,
) -> None:
    """Should return a run command from the db."""
    subject.insert(
        run_id="run-id", protocol_id=None, created_at=datetime.now(timezone.utc)
    )
    subject.update_run_state(
        run_id="run-id",
        run_data=protocol_run,
        commands=protocol_commands,
    )
    result = subject.get_command(run_id="run-id", command_id="pause-2")

    assert result == protocol_commands[1]


def test_get_command_run_not_found(subject: RunStore) -> None:
    """Should raise RunNotFoundError."""
    subject.insert(
        run_id="run-id", protocol_id=None, created_at=datetime.now(timezone.utc)
    )
    with pytest.raises(RunNotFoundError):
        subject.get_command(run_id="not-run-id", command_id="pause-2")


def test_get_command_command_not_found(
    subject: RunStore,
    protocol_commands: List[pe_commands.Command],
    protocol_run: ProtocolRunData,
) -> None:
    """Should raise CommandNotFoundError."""
    subject.insert(
        run_id="run-id", protocol_id=None, created_at=datetime.now(timezone.utc)
    )
    subject.update_run_state(
        run_id="run-id",
        run_data=protocol_run,
        commands=protocol_commands,
    )
    with pytest.raises(CommandNotFoundError):
        subject.get_command(run_id="run-id", command_id="pause-666")


def test_get_commands_slice(
    subject: RunStore,
    protocol_commands: List[pe_commands.Command],
    protocol_run: ProtocolRunData,
) -> None:
    """Should return commands list sliced."""
    expected_commands_result = [protocol_commands[1], protocol_commands[2]]
    expected_command_slice = CommandSlice(
        commands=expected_commands_result, cursor=1, total_length=3
    )

    subject.insert(
        run_id="run-id", protocol_id=None, created_at=datetime.now(timezone.utc)
    )
    subject.update_run_state(
        run_id="run-id",
        run_data=protocol_run,
        commands=protocol_commands,
    )
    result = subject.get_commands_slice(run_id="run-id", cursor=1, length=3)

    assert expected_command_slice == result


def test_get_commands_slice_run_not_found(subject: RunStore) -> None:
    """Should raise an error RunNotFoundError."""
    subject.insert(
        run_id="run-id", protocol_id=None, created_at=datetime.now(timezone.utc)
    )
    with pytest.raises(RunNotFoundError):
        subject.get_commands_slice(run_id="not-run-id", cursor=1, length=3)
