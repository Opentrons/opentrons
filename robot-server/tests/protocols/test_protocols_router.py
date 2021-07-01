"""Tests for the /protocols router."""
import pytest
from asyncio import AbstractEventLoop
from datetime import datetime
from decoy import Decoy, matchers
from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.datastructures import UploadFile
from httpx import AsyncClient
from typing import AsyncIterator

from robot_server.errors import exception_handlers
from robot_server.protocols.protocol_models import Protocol, ProtocolFileType
from robot_server.protocols.response_builder import ResponseBuilder
from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
    ProtocolFileInvalidError,
)

from robot_server.protocols.router import (
    protocols_router,
    ProtocolNotFound,
    ProtocolFileInvalid,
    get_unique_id,
    get_current_time,
    get_protocol_store,
)

from ..helpers import verify_response


@pytest.fixture
def app(
    unique_id: str,
    current_time: datetime,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
) -> FastAPI:
    """Get an app instance for /protocols routes with dependencies mocked out."""
    app = FastAPI(exception_handlers=exception_handlers)
    app.dependency_overrides[get_unique_id] = lambda: unique_id
    app.dependency_overrides[get_current_time] = lambda: current_time
    app.dependency_overrides[get_protocol_store] = lambda: protocol_store
    app.dependency_overrides[ResponseBuilder] = lambda: response_builder
    app.include_router(protocols_router)

    return app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """Get an TestClient for /protocols route testing."""
    return TestClient(app)


@pytest.fixture
async def async_client(
    loop: AbstractEventLoop,
    app: FastAPI,
) -> AsyncIterator[AsyncClient]:
    """Get an asynchronous client for /protocols route testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


def test_get_protocols_no_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should return an empty collection response with no protocols loaded."""
    decoy.when(protocol_store.get_all()).then_return([])

    response = client.get("/protocols")

    verify_response(response, expected_status=200, expected_data=[])


def test_get_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
    client: TestClient,
) -> None:
    """It should return stored protocols."""
    created_at_1 = datetime.now()
    created_at_2 = datetime.now()

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
    )
    protocol_2 = Protocol(
        id="123",
        createdAt=created_at_2,
        protocolType=ProtocolFileType.JSON,
    )

    decoy.when(protocol_store.get_all()).then_return([entry_1, entry_2])
    decoy.when(response_builder.build(entry_1)).then_return(protocol_1)
    decoy.when(response_builder.build(entry_2)).then_return(protocol_2)

    response = client.get("/protocols")

    verify_response(
        response,
        expected_status=200,
        expected_data=[protocol_1, protocol_2],
    )


def test_get_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
    client: TestClient,
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
    )

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_return(entry)
    decoy.when(response_builder.build(entry)).then_return(protocol)

    response = client.get("/protocols/protocol-id")

    verify_response(
        response,
        expected_status=200,
        expected_data=protocol,
    )


def test_get_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should return a 404 error when requesting a non-existent protocol."""
    not_found_error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_raise(
        not_found_error
    )

    response = client.get("/protocols/protocol-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=ProtocolNotFound(detail=str(not_found_error)),
    )


async def test_create_json_protocol(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should store a single JSON protocol file."""
    entry = ProtocolResource(
        protocol_id=unique_id,
        protocol_type=ProtocolFileType.JSON,
        created_at=current_time,
        files=[],
    )
    protocol = Protocol(
        id=unique_id,
        createdAt=current_time,
        protocolType=ProtocolFileType.JSON,
    )

    decoy.when(
        await protocol_store.create(
            protocol_id=unique_id,
            created_at=current_time,
            files=[
                matchers.IsA(
                    UploadFile,
                    {"filename": "foo.json", "content_type": "application/json"},
                )
            ],
        )
    ).then_return(entry)

    decoy.when(response_builder.build(entry)).then_return(protocol)

    files = [("files", ("foo.json", bytes("{}\n", "utf-8"), "application/json"))]
    response = await async_client.post("/protocols", files=files)

    verify_response(
        response,
        expected_status=201,
        expected_data=protocol,
    )


async def test_create_python_protocol(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should store a single Python protocol file."""
    entry = ProtocolResource(
        protocol_id=unique_id,
        protocol_type=ProtocolFileType.PYTHON,
        created_at=current_time,
        files=[],
    )
    protocol = Protocol(
        id=unique_id,
        createdAt=current_time,
        protocolType=ProtocolFileType.PYTHON,
    )

    decoy.when(
        await protocol_store.create(
            protocol_id=unique_id,
            created_at=current_time,
            files=[
                matchers.IsA(
                    UploadFile,
                    {"filename": "foo.py", "content_type": "text/x-python"},
                )
            ],
        )
    ).then_return(entry)

    decoy.when(response_builder.build(entry)).then_return(protocol)

    files = [
        ("files", ("foo.py", bytes("# my protocol\n", "utf-8"), "text/x-python")),
    ]
    response = await async_client.post("/protocols", files=files)

    verify_response(
        response,
        expected_status=201,
        expected_data=protocol,
    )


@pytest.mark.xfail(raises=NotImplementedError)
async def test_create_multifile_protocol(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should store multiple protocol files."""
    files = [
        ("files", ("foo.py", bytes("# my protocol", "utf-8"), "text/x-python")),
        ("files", ("bar.py", bytes("# support file", "utf-8"), "text/x-python")),
    ]

    await async_client.post("/protocols", files=files)


async def test_create_protocol_invalid_file(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should reject a request with an empty file."""
    decoy.when(
        await protocol_store.create(
            protocol_id=unique_id,
            created_at=current_time,
            files=[
                matchers.IsA(
                    UploadFile,
                    {"filename": "foo.json", "content_type": "application/json"},
                )
            ],
        )
    ).then_raise(ProtocolFileInvalidError("oh no"))

    files = [("files", ("foo.json", bytes("{}\n", "utf-8"), "application/json"))]
    response = await async_client.post("/protocols", files=files)

    verify_response(
        response,
        expected_status=400,
        expected_errors=ProtocolFileInvalid(detail="oh no"),
    )


def test_delete_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should remove a single protocol file."""
    response = client.delete("/protocols/protocol-id")

    decoy.verify(protocol_store.remove(protocol_id="protocol-id"))

    assert response.status_code == 200
    assert response.json()["data"] is None


def test_delete_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should 404 if the protocol to delete is not found."""
    not_found_error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.remove(protocol_id="protocol-id")).then_raise(
        not_found_error
    )

    response = client.delete("/protocols/protocol-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=ProtocolNotFound(detail=str(not_found_error)),
    )
