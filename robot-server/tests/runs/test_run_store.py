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
    RunStateResource,
)
from robot_server.runs.action_models import RunAction, RunActionType

from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
    ProtocolRunData,
)
from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import EngineStatus

@pytest.fixture
def subject(sql_engine_fixture: Engine) -> RunStore:
    """Get a ProtocolStore test subject."""
    return RunStore(sql_engine=sql_engine_fixture)


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
        )
    ]

@pytest.fixture
def run_resource() -> RunResource:
    """Return a run resource."""
    return RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[],
        is_current=False,
    )


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
        status=EngineStatus.IDLE
    )


def test_update_run_state(
    subject: RunStore,
    protocol_run: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should be able to update a run state to the store."""
    subject.insert(run_resource)
    engine_state = RunStateResource(
        run_id="run-id",
        state=protocol_run,
        engine_status="idle",
        commands=[],
    )
    subject.update_run_state(run_id="run-id", run_data=engine_state.state, commands=engine_state.commands)
    run_data_result = subject.get_run_data(run_id="run-id")
    commands_result = subject.get_run_commands(run_id="run-id")
    assert run_data_result == protocol_run
    assert commands_result == engine_state.commands
    assert run_data_result.status == engine_state.engine_status




def test_update_state_run_not_found(
    subject: RunStore, protocol_run: ProtocolRunData
) -> None:
    """It should be able to catch the exception raised by insert."""
    engine_state = RunStateResource(
        run_id="run-not-found",
        state=protocol_run,
        engine_status="idle",
        _updated_at=datetime.now(timezone.utc),
        commands=[],
    )

    with pytest.raises(RunNotFoundError, match="run-not-found"):
        subject.update_run_state(run_id="run-not-found", run_data=engine_state.state, commands=engine_state.commands)


def test_add_run(subject: RunStore) -> None:
    """It should be able to add a new run to the store."""
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime.now(tz=timezone.utc),
        actions=[],
        is_current=True,
    )
    result = subject.insert(run)

    assert result == run


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
    run = RunResource(
        run_id="run-id",
        protocol_id="missing-protocol-id",
        created_at=datetime.now(),
        actions=[],
        is_current=True,
    )

    with pytest.raises(ProtocolNotFoundError, match="missing-protocol-id"):
        subject.insert(run)


def test_update_active_run(subject: RunStore) -> None:
    """It should be able to update a run in the store."""
    run = RunResource(
        run_id="identical-run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[],
        is_current=False,
    )
    updated_run = RunResource(
        run_id="identical-run-id",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        actions=[],
        is_current=True,
    )

    subject.insert(run)

    result = subject.update_active_run(
        run_id=run.run_id,
        is_current=updated_run.is_current,
    )
    assert result.is_current == updated_run.is_current


def test_update_active_run_run_not_found(subject: RunStore) -> None:
    """It should raise RunNotFound error."""
    with pytest.raises(RunNotFoundError, match="run-id"):
        subject.update_active_run(run_id="run-id", is_current=True)


def test_get_run_no_actions(subject: RunStore) -> None:
    """It can get a previously stored run entry."""
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[],
        is_current=False,
    )
    subject.insert(run)
    result = subject.get(run_id="run-id")

    assert result == run


def test_get_run(subject: RunStore) -> None:
    """It can get a previously stored run entry."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        id="action-id",
    )
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[],
        is_current=False,
    )
    update_run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[action],
        is_current=False,
    )

    subject.insert(run)
    subject.insert_action(run.run_id, action)
    result = subject.get(run_id="run-id")

    assert result == update_run


def test_get_run_missing(subject: RunStore) -> None:
    """It raises if the run does not exist."""
    with pytest.raises(RunNotFoundError, match="run-id"):
        subject.get(run_id="run-id")


def test_get_all_runs(subject: RunStore) -> None:
    """It can get all created runs."""
    run_1 = RunResource(
        run_id="run-id-1",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[],
        is_current=False,
    )
    run_2 = RunResource(
        run_id="run-id-2",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        actions=[],
        is_current=True,
    )

    subject.insert(run_1)
    subject.insert(run_2)

    result = subject.get_all()

    assert result == [run_1, run_2]


def test_remove_run(subject: RunStore) -> None:
    """It can remove and return a previously stored run entry."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        id="action-id",
    )
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[action],
        is_current=True,
    )

    subject.insert(run)
    subject.insert_action(run_id="run-id", action=action)
    result = subject.remove(run_id="run-id")

    assert result == run
    assert subject.get_all() == []


def test_remove_run_missing_id(subject: RunStore) -> None:
    """It raises if the run does not exist."""
    with pytest.raises(RunNotFoundError, match="run-id"):
        subject.remove(run_id="run-id")


def test_add_run_current_run_deactivates(subject: RunStore) -> None:
    """Adding a current run should mark all others as not current."""
    actions = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2023, month=3, day=3, tzinfo=timezone.utc),
        id="action-id",
    )
    run_1 = RunResource(
        run_id="run-id-1",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[actions],
        is_current=True,
    )
    run_2 = RunResource(
        run_id="run-id-2",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        actions=[],
        is_current=True,
    )

    subject.insert(run_1)
    subject.insert(run_2)

    assert subject.get("run-id-1").is_current is False
    assert subject.get("run-id-2").is_current is True


def test_update_active_run_deactivates(subject: RunStore) -> None:
    """Updating active run should deactivate other runs."""
    actions = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2023, month=3, day=3),
        id="action-id",
    )
    run_1 = RunResource(
        run_id="run-id-1",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[actions],
        is_current=True,
    )
    run_2 = RunResource(
        run_id="run-id-2",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2, tzinfo=timezone.utc),
        actions=[],
        is_current=True,
    )

    subject.insert(run_1)
    subject.insert(run_2)
    subject.update_active_run(run_1.run_id, True)

    assert subject.get("run-id-1").is_current is True
    assert subject.get("run-id-2").is_current is False


def test_insert_actions_no_run(subject: RunStore) -> None:
    """Insert actions with a run that doesn't exist should raise an exception."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2023, month=3, day=3, tzinfo=timezone.utc),
        id="action-id-1",
    )

    with pytest.raises(Exception):
        subject.insert_action(run_id="run-id-996", action=action)


def test_get_run_commands(subject: RunStore, protocol_run: ProtocolRunData, run_resource: RunResource, protocol_commands: List[pe_commands.Command]) -> None:
    subject.insert(run=run_resource)
    subject.update_run_state(run_id=run_resource.run_id, run_data=protocol_run, commands=protocol_commands)
    result = subject.get_run_commands(run_id=run_resource.run_id)
    assert result == protocol_commands


def test_get_run_data(subject: RunStore, protocol_run: ProtocolRunData, run_resource: RunResource) -> None:
    subject.insert(run=run_resource)
    subject.update_run_state(run_id=run_resource.run_id, run_data=protocol_run, commands=[])
    result = subject.get_run_data(run_id=run_resource.run_id)
    assert result == protocol_run