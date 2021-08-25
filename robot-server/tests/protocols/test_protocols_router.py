"""Tests for the /protocols router."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers
from starlette.datastructures import UploadFile

from robot_server.errors import ApiError
from robot_server.service.task_runner import TaskRunner
from robot_server.protocols.protocol_models import Protocol, ProtocolFileType
from robot_server.protocols.analysis_models import PendingAnalysis
from robot_server.protocols.protocol_analyzer import ProtocolAnalyzer
from robot_server.protocols.response_builder import ResponseBuilder

from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
    ProtocolFileInvalidError,
)

from robot_server.protocols.router import (
    create_protocol,
    get_protocols,
    get_protocol_by_id,
    delete_protocol_by_id,
)


async def test_get_protocols_no_protocols(
    decoy: Decoy,
    response_builder: ResponseBuilder,
    protocol_store: ProtocolStore,
) -> None:
    """It should return an empty collection response with no protocols loaded."""
    decoy.when(protocol_store.get_all()).then_return([])

    result = await get_protocols(
        response_builder=response_builder,
        protocol_store=protocol_store,
    )

    assert result.data == []


async def test_get_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
) -> None:
    """It should return stored protocols."""
    created_at_1 = datetime(year=2021, month=1, day=1)
    created_at_2 = datetime(year=2022, month=2, day=2)

    entry_1 = ProtocolResource(
        protocol_id="abc",
        protocol_type=ProtocolFileType.PYTHON,
        created_at=created_at_1,
        files=[],
    )
    entry_2 = ProtocolResource(
        protocol_id="123",
        protocol_type=ProtocolFileType.JSON,
        created_at=created_at_2,
        files=[],
    )

    protocol_1 = Protocol(
        id="abc",
        createdAt=created_at_1,
        protocolType=ProtocolFileType.PYTHON,
        analysis=PendingAnalysis(),
    )
    protocol_2 = Protocol(
        id="123",
        createdAt=created_at_2,
        protocolType=ProtocolFileType.JSON,
        analysis=PendingAnalysis(),
    )

    decoy.when(protocol_store.get_all()).then_return([entry_1, entry_2])
    decoy.when(response_builder.build(entry_1)).then_return(protocol_1)
    decoy.when(response_builder.build(entry_2)).then_return(protocol_2)

    result = await get_protocols(
        response_builder=response_builder,
        protocol_store=protocol_store,
    )

    assert result.data == [protocol_1, protocol_2]


async def test_get_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
) -> None:
    """It should return a single protocol file."""
    created_at = datetime.now()
    entry = ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.PYTHON,
        created_at=created_at,
        files=[],
    )
    protocol = Protocol(
        id="protocol-id",
        createdAt=created_at,
        protocolType=ProtocolFileType.PYTHON,
        analysis=PendingAnalysis(),
    )

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_return(entry)
    decoy.when(response_builder.build(entry)).then_return(protocol)

    result = await get_protocol_by_id(
        "protocol-id",
        response_builder=response_builder,
        protocol_store=protocol_store,
    )

    assert result.data == protocol


async def test_get_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
) -> None:
    """It should return a 404 error when requesting a non-existent protocol."""
    not_found_error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_raise(
        not_found_error
    )

    with pytest.raises(ApiError) as exc_info:
        await get_protocol_by_id(
            "protocol-id",
            response_builder=response_builder,
            protocol_store=protocol_store,
        )

    assert exc_info.value.status_code == 404


async def test_create_protocol(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    protocol_analyzer: ProtocolAnalyzer,
    response_builder: ResponseBuilder,
    task_runner: TaskRunner,
    unique_id: str,
    current_time: datetime,
) -> None:
    """It should store an uploaded protocol file."""
    protocol_resource = ProtocolResource(
        protocol_id=unique_id,
        protocol_type=ProtocolFileType.JSON,
        created_at=current_time,
        files=[],
    )
    protocol = Protocol(
        id=unique_id,
        createdAt=current_time,
        protocolType=ProtocolFileType.JSON,
        analysis=PendingAnalysis(),
    )

    decoy.when(
        await protocol_store.create(
            protocol_id=unique_id,
            created_at=current_time,
            files=[matchers.IsA(UploadFile, {"filename": "foo.json"})],
        )
    ).then_return(protocol_resource)

    decoy.when(response_builder.build(protocol_resource)).then_return(protocol)

    files = [UploadFile(filename="foo.json")]

    result = await create_protocol(
        files=files,
        response_builder=response_builder,
        protocol_store=protocol_store,
        protocol_analyzer=protocol_analyzer,
        task_runner=task_runner,
        protocol_id=unique_id,
        created_at=current_time,
    )

    assert result.data == protocol

    decoy.verify(
        task_runner.run(protocol_analyzer.analyze, protocol_resource=protocol_resource)
    )


@pytest.mark.xfail(raises=NotImplementedError)
async def test_create_multifile_protocol(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
    unique_id: str,
    current_time: datetime,
) -> None:
    """It should store multiple protocol files."""
    files = [UploadFile(filename="foo.py"), UploadFile(filename="bar.py")]

    await create_protocol(
        files=files,
        response_builder=response_builder,
        protocol_store=protocol_store,
        protocol_id=unique_id,
        created_at=current_time,
    )


async def test_create_protocol_invalid_file(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
    unique_id: str,
    current_time: datetime,
) -> None:
    """It should 400 if the file is rejected."""
    decoy.when(
        await protocol_store.create(
            protocol_id=unique_id,
            created_at=current_time,
            files=[matchers.IsA(UploadFile, {"filename": "foo.json"})],
        )
    ).then_raise(ProtocolFileInvalidError("oh no"))

    files = [UploadFile(filename="foo.json")]

    with pytest.raises(ApiError) as exc_info:
        await create_protocol(
            files=files,
            response_builder=response_builder,
            protocol_store=protocol_store,
            protocol_id=unique_id,
            created_at=current_time,
        )

    assert exc_info.value.status_code == 400


async def test_delete_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should remove a single protocol file."""
    result = await delete_protocol_by_id("protocol-id", protocol_store=protocol_store)

    decoy.verify(protocol_store.remove(protocol_id="protocol-id"))

    assert result.data is None


async def test_delete_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should 404 if the protocol to delete is not found."""
    not_found_error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.remove(protocol_id="protocol-id")).then_raise(
        not_found_error
    )

    with pytest.raises(ApiError) as exc_info:
        await delete_protocol_by_id("protocol-id", protocol_store=protocol_store)

    assert exc_info.value.status_code == 404
