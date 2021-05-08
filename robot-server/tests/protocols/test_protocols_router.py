"""Tests for the /protocols router."""
import pytest
from dataclasses import dataclass
from decoy import Decoy
from fastapi import FastAPI, UploadFile
from fastapi.testclient import TestClient
from typing import cast

from robot_server.errors import exception_handlers
from robot_server.protocols import protocols_router
from robot_server.protocols.models import ProtocolResource, ProtocolFileType
from robot_server.protocols.store import ProtocolStore, ProtocolStoreKeyError


@dataclass(frozen=True)
class UploadFileMatcher:
    """Matcher class for a fastapi.UploadFile."""

    filename: str
    content_type: str

    @classmethod
    def create(cls, filename: str, content_type: str) -> UploadFile:
        """Create an UploadFileMatcher cast as an UploadFile."""
        return cast(UploadFile, cls(filename, content_type))

    def __eq__(self, target: object) -> bool:
        """Return true if target is a matching UploadFile."""
        target_filename = getattr(target, "filename", None)
        target_content_type = getattr(target, "content_type", None)

        return (
            self.filename == target_filename
            and self.content_type == target_content_type
        )


@pytest.fixture
def decoy() -> Decoy:
    """Get a Decoy state container."""
    return Decoy()


@pytest.fixture
def protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a fake ProtocolStore interface."""
    return decoy.create_decoy(spec=ProtocolStore)


@pytest.fixture
def client(protocol_store: ProtocolStore) -> TestClient:
    """Get an TestClient for /protocols routes with dependencies mocked out."""
    app = FastAPI(exception_handlers=exception_handlers)
    app.dependency_overrides[ProtocolStore] = lambda: protocol_store
    app.include_router(protocols_router)

    return TestClient(app)


def test_get_protocols_no_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should return an empty collection response with no protocols loaded."""
    decoy.when(protocol_store.get_all_protocols()).then_return([])

    response = client.get("/protocols")

    assert response.status_code == 200
    assert response.json() == {"data": [], "links": None}


def test_get_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should return stored protocols."""
    decoy.when(protocol_store.get_all_protocols()).then_return(
        [
            ProtocolResource(
                id="foo", fileName="foo.py", fileType=ProtocolFileType.PYTHON
            ),
            ProtocolResource(
                id="bar", fileName="bar.json", fileType=ProtocolFileType.JSON
            ),
        ]
    )

    response = client.get("/protocols")

    assert response.status_code == 200
    assert response.json() == {
        "data": [
            {"id": "foo", "fileName": "foo.py", "fileType": "python"},
            {"id": "bar", "fileName": "bar.json", "fileType": "json"},
        ],
        "links": None,
    }


def test_get_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should return a single protocol file."""
    decoy.when(protocol_store.get_protocol(id="foo")).then_return(
        ProtocolResource(id="foo", fileName="foo.py", fileType=ProtocolFileType.PYTHON)
    )

    response = client.get("/protocols/foo")

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "id": "foo",
            "fileName": "foo.py",
            "fileType": "python",
        },
        "links": None,
    }


def test_get_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should return a single protocol file."""
    decoy.when(protocol_store.get_protocol(id="bar")).then_raise(
        ProtocolStoreKeyError('Protocol with ID "bar" not found.')
    )

    response = client.get("/protocols/bar")

    assert response.status_code == 404
    assert response.json() == {
        "errors": [
            {
                "id": "ProtocolNotFound",
                "title": "Protocol Not Found",
                "detail": 'Protocol with ID "bar" not found.',
            },
        ]
    }


def test_create_protocol(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should store a single protocol file."""
    expected_file = UploadFileMatcher.create(
        filename="foo.py", content_type="text/x-python"
    )

    decoy.when(protocol_store.add_protocol(files=[expected_file])).then_return(
        ProtocolResource(id="foo", fileName="foo.py", fileType=ProtocolFileType.PYTHON)
    )

    files = [("files", ("foo.py", bytes("# my protocol", "utf-8"), "text/x-python"))]
    response = client.post("/protocols", files=files)

    assert response.status_code == 201
    assert response.json() == {
        "data": {
            "id": "foo",
            "fileName": "foo.py",
            "fileType": "python",
        },
        "links": None,
    }


def test_delete_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should store a single protocol file."""
    decoy.when(protocol_store.remove_protocol(id="foo")).then_return(
        ProtocolResource(id="foo", fileName="foo.py", fileType=ProtocolFileType.PYTHON)
    )

    response = client.delete("/protocols/foo")

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "id": "foo",
            "fileName": "foo.py",
            "fileType": "python",
        },
        "links": None,
    }


def test_delete_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    client: TestClient,
) -> None:
    """It should 404 if the protocol to delete is not found."""
    decoy.when(protocol_store.remove_protocol(id="bar")).then_raise(
        ProtocolStoreKeyError('Protocol with ID "bar" not found.')
    )

    response = client.delete("/protocols/bar")

    assert response.status_code == 404
    assert response.json() == {
        "errors": [
            {
                "id": "ProtocolNotFound",
                "title": "Protocol Not Found",
                "detail": 'Protocol with ID "bar" not found.',
            },
        ]
    }
