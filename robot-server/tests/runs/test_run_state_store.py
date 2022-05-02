"""Tests for robot_server.runs.run_store."""
import pytest
from datetime import datetime, timezone
from typing import Generator

import sqlalchemy
from pathlib import Path

from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
    ProtocolRunData,
)
from opentrons.types import MountType, DeckSlotName

from robot_server.runs.run_state_store import RunStateStore, RunStateResource
from robot_server.runs.run_store import RunNotFoundError, RunResource, RunStore
from robot_server.persistence import open_db_no_cleanup, add_tables_to_db


@pytest.fixture
def run_resource() -> RunResource:
    return RunResource(
        run_id="identical-run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        actions=[],
        is_current=False,
    )

@pytest.fixture
def sql_engine(tmp_path: Path) -> Generator[sqlalchemy.engine.Engine, None, None]:
    """Return a set-up database to back the store."""
    db_file_path = tmp_path / "test.db"
    sql_engine = open_db_no_cleanup(db_file_path=db_file_path)
    try:
        add_tables_to_db(sql_engine)
        yield sql_engine
    finally:
        sql_engine.dispose()


@pytest.fixture
def subject(sql_engine: sqlalchemy.engine.Engine) -> RunStateStore:
    """Get a ProtocolStore test subject."""
    return RunStateStore(sql_engine=sql_engine)

@pytest.fixture
def run_store(sql_engine: sqlalchemy.engine.Engine) -> RunStore:
    """Get a ProtocolStore test subject."""
    return RunStore(sql_engine=sql_engine)


@pytest.fixture
def protocol_run() -> ProtocolRunData:
    """Get a ProtocolRunData test object."""
    analysis_command = pe_commands.Pause(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2022, month=2, day=2),
        params=pe_commands.PauseParams(message="hello world"),
    )

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
    analysis_command_list = []
    labware_list = []
    for i in range(1000):
        analysis_command_list.append(analysis_command)
        labware_list.append(analysis_labware)

    return ProtocolRunData(
        commands=analysis_command_list,
        errors=[analysis_error],
        labware=labware_list,
        pipettes=[analysis_pipette],
        # TODO(mc, 2022-02-14): evaluate usage of modules in the analysis resp.
        modules=[],
        # TODO (tz 22-4-19): added the field to class. make sure what to initialize
        labwareOffsets=[],
    )


def test_insert_state(subject: RunStateStore, run_store: RunStore, protocol_run: ProtocolRunData, run_resource: RunResource) -> None:
    """It should be able to add a new run to the store."""

    inserted_run = run_store.insert(run_resource)
    print(inserted_run)
    engine_state = RunStateResource(
        run_id="run-id",
        state=protocol_run,
        engine_status="idle"
        # created_at=datetime.now()
    )
    result = subject.insert(engine_state)

    assert result == engine_state


def test_get_run_state(subject: RunStateStore, protocol_run: ProtocolRunData) -> None:
    """It should be able to get engine state from the store."""
    engine_state = RunStateResource(
        run_id="run-id",
        state=protocol_run,
        engine_status="idle"
        # created_at=datetime.now()
    )

    subject.insert(state=engine_state)
    result = subject.get("run-id")

    assert engine_state == result


@pytest.fixture
def teardown() -> Generator[None, None, None]:
    """It should teardown test setup."""
    print("setup")
    yield None
    print("teardown")


@pytest.mark.parametrize("pickle_type", [True, False])
def test_insert_get_by_state_type(
    subject: RunStateStore,
    protocol_run: ProtocolRunData,
    pickle_type: bool,
    teardown: Generator[None, None, None],
) -> None:
    """It should test the time and db size for prasing a json type and a string type."""
    engine_state = RunStateResource(
        run_id="run-id",
        state=protocol_run,
        engine_status="idle"
        # created_at=datetime.now()
    )

    subject.insert_state_by_type(state=engine_state, insert_pickle=pickle_type)
    result_state = subject.get_state_by_type(run_id="run-id", return_pickle=pickle_type)

    assert engine_state.run_id == result_state.run_id
    assert engine_state.state == result_state.state


def test_insert_state_run_not_found(
    subject: RunStateStore, protocol_run: ProtocolRunData
) -> None:
    """It should be able to catch the exception raised by insert."""
    engine_state = RunStateResource(
        run_id="run-not-found",
        state=protocol_run,
        engine_status="idle"
        # created_at=datetime.now()
    )

    with pytest.raises(RunNotFoundError, match="run-not-found"):
        subject.insert(engine_state)
