"""Tests for base /runs routes."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers
from pathlib import Path

from opentrons.types import DeckSlotName, MountType
from opentrons.protocol_engine import StateView, ErrorOccurrence, types as pe_types
from opentrons.protocol_reader import ProtocolSource, JsonProtocolConfig

from robot_server.errors import ApiError
from robot_server.service.task_runner import TaskRunner
from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
    MultiBodyMeta,
    ResourceLink,
)


from robot_server.protocols import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
)

from robot_server.runs.run_view import RunView
from robot_server.runs.run_models import Run, RunSummary, RunCreate, RunUpdate

from robot_server.runs.engine_store import (
    EngineStore,
    EngineConflictError,
    EngineMissingError,
)

from robot_server.runs.run_store import (
    RunStore,
    RunNotFoundError,
    RunResource,
)

from robot_server.runs.router.base_router import (
    AllRunsLinks,
    create_run,
    get_run_data_from_url,
    get_run,
    get_runs,
    remove_run,
    add_labware_offset,
    update_run,
)


LABWARE_OFFSET_REQUESTS = [
    pe_types.LabwareOffsetCreate(
        definitionUri="namespace_1/load_name_1/123",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    ),
    pe_types.LabwareOffsetCreate(
        definitionUri="namespace_2/load_name_2/123",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_2),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    ),
]

RESOLVED_LABWARE_OFFSETS = [
    pe_types.LabwareOffset(
        id="labware-offset-1-id",
        createdAt=datetime(year=2021, month=1, day=1),
        definitionUri="namespace_1/load_name_1/1",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    ),
    pe_types.LabwareOffset(
        id="labware-offset-2-id",
        createdAt=datetime(year=2021, month=1, day=1),
        definitionUri="namespace_2/load_name_2/2",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_2),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    ),
]


async def test_create_run(
    decoy: Decoy,
    task_runner: TaskRunner,
    run_store: RunStore,
    engine_store: EngineStore,
) -> None:
    """It should be able to create a basic run."""
    run_id = "run-id"
    run_created_at = datetime(year=2021, month=1, day=1)

    expected_run = RunResource(
        run_id=run_id,
        created_at=run_created_at,
        protocol_id=None,
        actions=[],
        is_current=True,
    )
    expected_response = Run(
        id=run_id,
        protocolId=None,
        createdAt=run_created_at,
        status=pe_types.EngineStatus.IDLE,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=RESOLVED_LABWARE_OFFSETS,
    )

    engine_state = decoy.mock(cls=StateView)
    decoy.when(await engine_store.create(run_id=run_id)).then_return(engine_state)

    decoy.when(engine_state.pipettes.get_all()).then_return([])
    decoy.when(engine_state.labware.get_all()).then_return([])
    decoy.when(engine_state.labware.get_labware_offsets()).then_return(
        RESOLVED_LABWARE_OFFSETS
    )
    decoy.when(engine_state.commands.get_status()).then_return(
        pe_types.EngineStatus.IDLE
    )

    result = await create_run(
        request_body=RequestModel(
            data=RunCreate(labwareOffsets=LABWARE_OFFSET_REQUESTS)
        ),
        run_store=run_store,
        engine_store=engine_store,
        task_runner=task_runner,
        run_id=run_id,
        created_at=run_created_at,
    )

    assert result.content.data == expected_response
    assert result.status_code == 201

    decoy.verify(
        # It should have added each requested labware offset to the engine,
        # in the exact order they appear in the request.
        *[engine_store.engine.add_labware_offset(r) for r in LABWARE_OFFSET_REQUESTS],
        run_store.upsert(run=expected_run),
    )


async def test_create_protocol_run(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    protocol_store: ProtocolStore,
    engine_store: EngineStore,
    task_runner: TaskRunner,
) -> None:
    """It should be able to create a protocol run."""
    run_created_at = datetime(year=2021, month=1, day=1)

    run = RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=run_created_at,
        actions=[],
        is_current=True,
    )
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2022, month=2, day=2),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            labware_definitions=[],
        ),
    )
    expected_response = Run(
        id="run-id",
        protocolId="protocol-id",
        createdAt=run_created_at,
        status=pe_types.EngineStatus.IDLE,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=RESOLVED_LABWARE_OFFSETS,
    )

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_return(
        protocol_resource
    )

    engine_state = decoy.mock(cls=StateView)
    decoy.when(await engine_store.create(run_id="run-id")).then_return(engine_state)

    decoy.when(engine_state.pipettes.get_all()).then_return([])
    decoy.when(engine_state.labware.get_all()).then_return([])
    decoy.when(engine_state.labware.get_labware_offsets()).then_return(
        RESOLVED_LABWARE_OFFSETS
    )
    decoy.when(engine_state.commands.get_status()).then_return(
        pe_types.EngineStatus.IDLE
    )

    result = await create_run(
        request_body=RequestModel(
            data=RunCreate(
                protocolId="protocol-id",
                labwareOffsets=LABWARE_OFFSET_REQUESTS,
            )
        ),
        run_store=run_store,
        engine_store=engine_store,
        protocol_store=protocol_store,
        task_runner=task_runner,
        run_id="run-id",
        created_at=run_created_at,
    )

    assert result.content.data == expected_response
    assert result.status_code == 201

    decoy.verify(
        # It should have added each requested labware offset to the engine,
        # in the exact order they appear in the request.
        *[engine_store.engine.add_labware_offset(r) for r in LABWARE_OFFSET_REQUESTS],
        engine_store.runner.load(protocol_resource.source),
        run_store.upsert(run=run),
    )


async def test_create_protocol_run_bad_protocol_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should 404 if a protocol for a run does not exist."""
    error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_raise(error)

    with pytest.raises(ApiError) as exc_info:
        await create_run(
            request_body=RequestModel(data=RunCreate(protocolId="protocol-id")),
            protocol_store=protocol_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "ProtocolNotFound"


async def test_create_run_conflict(decoy: Decoy, engine_store: EngineStore) -> None:
    """It should respond with a conflict error if multiple engines are created."""
    decoy.when(await engine_store.create(run_id=matchers.Anything())).then_raise(
        EngineConflictError("oh no")
    )

    with pytest.raises(ApiError) as exc_info:
        await create_run(request_body=None, engine_store=engine_store)

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunAlreadyActive"


async def test_get_run_data_from_url(
    decoy: Decoy,
    run_store: RunStore,
    engine_store: EngineStore,
) -> None:
    """It should be able to get a run by ID."""
    created_at = datetime(year=2021, month=1, day=1)

    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=created_at,
        actions=[],
        is_current=False,
    )

    labware = pe_types.LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=pe_types.DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId=None,
    )

    pipette = pe_types.LoadedPipette(
        id="pipette-id",
        pipetteName=pe_types.PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    expected_response = Run(
        id="run-id",
        protocolId=None,
        createdAt=created_at,
        status=pe_types.EngineStatus.IDLE,
        current=False,
        actions=[],
        errors=[],
        pipettes=[pipette],
        labware=[labware],
        labwareOffsets=RESOLVED_LABWARE_OFFSETS,
    )

    decoy.when(run_store.get(run_id="run-id")).then_return(run)

    engine_state = decoy.mock(cls=StateView)

    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get_all_errors()).then_return([])
    decoy.when(engine_state.pipettes.get_all()).then_return([pipette])
    decoy.when(engine_state.labware.get_all()).then_return([labware])
    decoy.when(engine_state.labware.get_labware_offsets()).then_return(
        RESOLVED_LABWARE_OFFSETS
    )
    decoy.when(engine_state.commands.get_status()).then_return(
        pe_types.EngineStatus.IDLE
    )

    result = await get_run_data_from_url(
        runId="run-id",
        run_store=run_store,
        engine_store=engine_store,
    )

    assert result == expected_response


async def test_get_run_with_errors(
    decoy: Decoy,
    run_store: RunStore,
    engine_store: EngineStore,
) -> None:
    """It should be able to get a run by ID that has errors."""
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=False,
    )

    error_1 = ErrorOccurrence(
        id="error-1",
        createdAt=datetime(year=2023, month=3, day=3),
        errorType="SomethingBad",
        detail="oh no",
    )

    error_2 = ErrorOccurrence(
        id="error-2",
        createdAt=datetime(year=2024, month=4, day=4),
        errorType="SomethingWorse",
        detail="oh no no",
    )

    expected_response = Run(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.FAILED,
        current=False,
        actions=[],
        errors=[error_1, error_2],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    decoy.when(run_store.get(run_id="run-id")).then_return(run)

    engine_state = decoy.mock(cls=StateView)

    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get_all_errors()).then_return([error_1, error_2])
    decoy.when(engine_state.pipettes.get_all()).then_return([])
    decoy.when(engine_state.labware.get_all()).then_return([])
    decoy.when(engine_state.labware.get_labware_offsets()).then_return([])
    decoy.when(engine_state.commands.get_status()).then_return(
        pe_types.EngineStatus.FAILED
    )

    result = await get_run_data_from_url(
        runId="run-id",
        run_store=run_store,
        engine_store=engine_store,
    )

    assert result == expected_response


async def test_get_run_with_missing_id(decoy: Decoy, run_store: RunStore) -> None:
    """It should 404 if the run ID does not exist."""
    not_found_error = RunNotFoundError(run_id="run-id")

    decoy.when(run_store.get(run_id="run-id")).then_raise(not_found_error)

    with pytest.raises(ApiError) as exc_info:
        await get_run_data_from_url(runId="run-id", run_store=run_store)

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_get_run() -> None:
    """It should wrap the run data in a response."""
    run_data = Run(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.IDLE,
        current=False,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    result = await get_run(run_data=run_data)

    assert result.content.data == run_data
    assert result.status_code == 200


async def test_get_runs_empty(decoy: Decoy, run_store: RunStore) -> None:
    """It should return an empty collection response when no runs exist."""
    decoy.when(run_store.get_all()).then_return([])

    result = await get_runs(run_store=run_store)

    assert result.content.data == []
    assert result.content.links == AllRunsLinks(current=None)
    assert result.content.meta == MultiBodyMeta(cursor=0, pageLength=0, totalLength=0)
    assert result.status_code == 200


async def test_get_runs_not_empty(
    decoy: Decoy,
    run_store: RunStore,
    engine_store: EngineStore,
) -> None:
    """It should return a collection response when a run exists."""
    created_at_1 = datetime(year=2021, month=1, day=1)
    created_at_2 = datetime(year=2022, month=2, day=2)

    run_1 = RunResource(
        run_id="unique-id-1",
        protocol_id=None,
        created_at=created_at_1,
        actions=[],
        is_current=False,
    )

    run_2 = RunResource(
        run_id="unique-id-2",
        protocol_id=None,
        created_at=created_at_2,
        actions=[],
        is_current=True,
    )

    response_1 = RunSummary(
        id="unique-id-1",
        protocolId=None,
        createdAt=created_at_1,
        status=pe_types.EngineStatus.SUCCEEDED,
        current=False,
    )

    response_2 = RunSummary(
        id="unique-id-2",
        protocolId=None,
        createdAt=created_at_2,
        status=pe_types.EngineStatus.IDLE,
        current=True,
    )

    decoy.when(run_store.get_all()).then_return([run_1, run_2])

    engine_state_1 = decoy.mock(cls=StateView)
    engine_state_2 = decoy.mock(cls=StateView)

    decoy.when(engine_store.get_state("unique-id-1")).then_return(engine_state_1)
    decoy.when(engine_store.get_state("unique-id-2")).then_return(engine_state_2)

    decoy.when(engine_state_1.commands.get_status()).then_return(
        pe_types.EngineStatus.SUCCEEDED
    )

    decoy.when(engine_state_2.commands.get_status()).then_return(
        pe_types.EngineStatus.IDLE
    )

    result = await get_runs(run_store=run_store, engine_store=engine_store)

    assert result.content.data == [response_1, response_2]
    assert result.content.links == AllRunsLinks(
        current=ResourceLink(href="/runs/unique-id-2")
    )
    assert result.content.meta == MultiBodyMeta(cursor=0, pageLength=2, totalLength=2)
    assert result.status_code == 200


async def test_delete_run_by_id(
    decoy: Decoy,
    run_store: RunStore,
    engine_store: EngineStore,
) -> None:
    """It should be able to remove a run by ID."""
    result = await remove_run(
        runId="run-id",
        run_store=run_store,
        engine_store=engine_store,
    )

    decoy.verify(
        await engine_store.clear(),
        run_store.remove(run_id="run-id"),
    )

    assert result.content == SimpleEmptyBody()
    assert result.status_code == 200


async def test_delete_run_with_bad_id(
    decoy: Decoy,
    run_store: RunStore,
    engine_store: EngineStore,
) -> None:
    """It should 404 if the run ID does not exist."""
    key_error = RunNotFoundError(run_id="run-id")

    decoy.when(run_store.remove(run_id="run-id")).then_raise(key_error)

    with pytest.raises(ApiError) as exc_info:
        await remove_run(
            runId="run-id",
            run_store=run_store,
            engine_store=engine_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_delete_active_run(
    decoy: Decoy,
    engine_store: EngineStore,
    run_store: RunStore,
) -> None:
    """It should 409 if the run is not finished."""
    decoy.when(await engine_store.clear()).then_raise(EngineConflictError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await remove_run(
            runId="run-id",
            run_store=run_store,
            engine_store=engine_store,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunNotIdle"


async def test_delete_active_run_no_engine(
    decoy: Decoy,
    engine_store: EngineStore,
    run_store: RunStore,
) -> None:
    """It should no-op if no engine is present."""
    decoy.when(engine_store.get_state("run-id")).then_raise(EngineMissingError("oh no"))

    await remove_run(
        runId="run-id",
        run_store=run_store,
        engine_store=engine_store,
    )


async def test_add_labware_offset(
    decoy: Decoy,
    engine_store: EngineStore,
    run_store: RunStore,
) -> None:
    """It should add the labware offset to the engine, assuming the run is current."""
    labware_offset_request = LABWARE_OFFSET_REQUESTS[0]

    run_resource = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )

    expected_response = Run(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.SUCCEEDED,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    decoy.when(run_store.get(run_id="run-id")).then_return(run_resource)

    engine_state = decoy.mock(cls=StateView)
    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)

    decoy.when(engine_state.commands.get_all()).then_return([])
    decoy.when(engine_state.commands.get_all_errors()).then_return([])
    decoy.when(engine_state.pipettes.get_all()).then_return([])
    decoy.when(engine_state.labware.get_all()).then_return([])
    decoy.when(
        engine_store.engine.add_labware_offset(labware_offset_request)
    ).then_return(
        pe_types.LabwareOffset(
            id="labware-offset-id",
            createdAt=datetime(year=2021, month=1, day=1),
            definitionUri="labware-definition-uri",
            location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
            vector=pe_types.LabwareOffsetVector(x=0, y=0, z=0),
        )
    )
    # Tests for run POST and GET should already cover passing the engine's labware
    # offsets to the client when .get_labware_offsets() returns a non-empty list.
    decoy.when(engine_state.labware.get_labware_offsets()).then_return([])
    decoy.when(engine_state.commands.get_status()).then_return(
        pe_types.EngineStatus.SUCCEEDED
    )

    result = await add_labware_offset(
        runId="run-id",
        request_body=RequestModel(data=labware_offset_request),
        engine_store=engine_store,
        run_store=run_store,
    )

    assert result.content == SimpleBody(data=expected_response)
    assert result.status_code == 201


async def test_update_run_to_not_current(
    decoy: Decoy,
    engine_store: EngineStore,
    run_store: RunStore,
    run_view: RunView,
) -> None:
    """It should update a run to no longer be current."""
    run_resource = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )

    updated_resource = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=False,
    )

    expected_response = Run(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.SUCCEEDED,
        current=False,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    run_update = RunUpdate(current=False)

    decoy.when(run_store.get(run_id="run-id")).then_return(run_resource)

    decoy.when(run_view.with_update(run=run_resource, update=run_update)).then_return(
        updated_resource
    )

    engine_state = decoy.mock(cls=StateView)
    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get_all()).then_return([])
    decoy.when(engine_state.commands.get_all_errors()).then_return([])
    decoy.when(engine_state.pipettes.get_all()).then_return([])
    decoy.when(engine_state.labware.get_all()).then_return([])
    decoy.when(engine_state.labware.get_labware_offsets()).then_return([])
    decoy.when(engine_state.commands.get_status()).then_return(
        pe_types.EngineStatus.SUCCEEDED
    )

    result = await update_run(
        runId="run-id",
        request_body=RequestModel(data=run_update),
        run_store=run_store,
        run_view=run_view,
        engine_store=engine_store,
    )

    assert result.content == SimpleBody(data=expected_response)
    assert result.status_code == 200

    decoy.verify(
        await engine_store.clear(),
        run_store.upsert(updated_resource),
    )


async def test_update_current_to_current_noop(
    decoy: Decoy,
    engine_store: EngineStore,
    run_store: RunStore,
    run_view: RunView,
) -> None:
    """It should noop if updating the current run to current: true."""
    run_resource = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )

    expected_response = Run(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.SUCCEEDED,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    run_update = RunUpdate(current=True)

    decoy.when(run_store.get(run_id="run-id")).then_return(run_resource)

    decoy.when(run_view.with_update(run=run_resource, update=run_update)).then_return(
        run_resource
    )

    engine_state = decoy.mock(cls=StateView)
    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get_all()).then_return([])
    decoy.when(engine_state.commands.get_all_errors()).then_return([])
    decoy.when(engine_state.pipettes.get_all()).then_return([])
    decoy.when(engine_state.labware.get_all()).then_return([])
    decoy.when(engine_state.labware.get_labware_offsets()).then_return([])
    decoy.when(engine_state.commands.get_status()).then_return(
        pe_types.EngineStatus.SUCCEEDED
    )

    result = await update_run(
        runId="run-id",
        request_body=RequestModel(data=run_update),
        run_store=run_store,
        run_view=run_view,
        engine_store=engine_store,
    )

    assert result.content == SimpleBody(data=expected_response)
    assert result.status_code == 200

    decoy.verify(run_store.upsert(run_resource), times=0)
    decoy.verify(await engine_store.clear(), times=0)


async def test_update_to_current_conflict(
    decoy: Decoy,
    engine_store: EngineStore,
    run_store: RunStore,
) -> None:
    """It should 409 if attempting to update a not current run."""
    run_resource = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=False,
    )

    run_update = RunUpdate(current=True)

    decoy.when(run_store.get(run_id="run-id")).then_return(run_resource)

    with pytest.raises(ApiError) as exc_info:
        await update_run(
            runId="run-id",
            request_body=RequestModel(data=run_update),
            run_store=run_store,
            engine_store=engine_store,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"
