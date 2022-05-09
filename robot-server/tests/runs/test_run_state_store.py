"""Tests for robot_server.runs.run_store."""
import pytest
from datetime import datetime, timezone

import sqlalchemy

from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
    ProtocolRunData,
)
from opentrons.types import MountType, DeckSlotName

from robot_server.runs.run_state_store import RunStateStore, RunStateResource
from robot_server.runs.run_store import RunNotFoundError, RunResource, RunStore


# TODO(tz): move to conftest file. create a fixter that inserts a fun
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
def subject(sql_engine_fixture: sqlalchemy.engine.Engine) -> RunStateStore:
    """Get a ProtocolStore test subject."""
    return RunStateStore(sql_engine=sql_engine_fixture)


# TODO(tz): move to conftest file.
@pytest.fixture
def run_store(sql_engine_fixture: sqlalchemy.engine.Engine) -> RunStore:
    """Get a ProtocolStore test subject."""
    return RunStore(sql_engine=sql_engine_fixture)


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

    return ProtocolRunData(
        commands=[analysis_command],
        errors=[analysis_error],
        labware=[analysis_labware],
        pipettes=[analysis_pipette],
        # TODO(mc, 2022-02-14): evaluate usage of modules in the analysis resp.
        modules=[],
        # TODO (tz 22-4-19): added the field to class. make sure what to initialize
        labwareOffsets=[],
    )


def test_update_run_state(
    subject: RunStateStore,
    run_store: RunStore,
    protocol_run: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should be able to update a run state to the store."""
    run_store.insert(run_resource)
    engine_state = RunStateResource(
        run_id="run-id",
        state=protocol_run,
        engine_status="idle",
        _updated_at=datetime.now(timezone.utc),
        commands=[],
    )
    result = subject.update_run_state(engine_state)

    assert result == engine_state


def test_get_run_state(
    subject: RunStateStore,
    run_store: RunStore,
    run_resource: RunResource,
    protocol_run: ProtocolRunData,
) -> None:
    """It should be able to get engine state from the store."""
    run_store.insert(run_resource)
    engine_state = RunStateResource(
        run_id="run-id",
        state=protocol_run,
        engine_status="idle",
        _updated_at=datetime.now(timezone.utc),
        commands=[],
    )

    subject.update_run_state(state=engine_state)
    result = subject.get("run-id")

    assert engine_state == result


def test_update_state_run_not_found(
    subject: RunStateStore, protocol_run: ProtocolRunData
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
        subject.update_run_state(engine_state)
