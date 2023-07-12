"""Tests for the server's exception handlers."""
import pytest
from decoy import matchers
from fastapi import FastAPI, Header, status
from fastapi.testclient import TestClient
from pydantic import BaseModel
from typing import List

from robot_server.constants import V1_TAG
from robot_server.errors import ApiError, exception_handlers


class Item(BaseModel):
    """Test model for validation errors."""

    string_field: str
    int_field: int
    array_field: List[bool]


@pytest.fixture
def app() -> FastAPI:
    """Get a FastAPI app with our exception handlers."""
    app = FastAPI()

    # TODO(mc, 2021-05-10): upgrade to FastAPI > 0.61.2 to use `exception_handlers` arg
    # see https://github.com/tiangolo/fastapi/pull/1924
    for exc_cls, handler in exception_handlers.items():
        app.add_exception_handler(exc_cls, handler)

    return app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """Get a client to the FastAPI application ."""
    return TestClient(app, raise_server_exceptions=False)


def test_handles_api_errors(app: FastAPI, client: TestClient) -> None:
    """It should serialize legacy v1 errors properly."""

    @app.get("/error")
    def trigger_v1_error() -> None:
        raise ApiError(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"message": "You shall not pass!"},
        )

    response = client.get("/error")

    assert response.status_code == 403
    assert response.json() == {"message": "You shall not pass!"}


def test_handles_unexpected_errors(app: FastAPI, client: TestClient) -> None:
    """It should serialize unexpected errors properly as 500 ISEs."""

    @app.get("/internal-server-error")
    def trigger_unhandled_exception() -> None:
        raise Exception("Oh no!")

    response = client.get("/internal-server-error")

    assert response.status_code == 500
    assert response.json() == {
        "errors": [
            {
                "id": "UnexpectedError",
                "title": "Unexpected Internal Error",
                "detail": "Exception: Oh no!",
                "errorCode": "4000",
                "meta": {
                    "code": "4000",
                    "message": "Exception: Oh no!",
                    "type": "Exception",
                    "detail": {
                        "args": "('Oh no!',)",
                        "class": "Exception",
                        "traceback": matchers.StringMatching(
                            r'raise Exception\("Oh no!"\)'
                        ),
                    },
                    "wrapping": [],
                },
            }
        ]
    }


def test_handles_legacy_unexpected_errors(app: FastAPI, client: TestClient) -> None:
    """It should serialize unexpected errors properly for legacy endpoints."""

    @app.get("/internal-server-error-legacy", tags=[V1_TAG])
    def trigger_unhandled_exception_legacy() -> None:
        raise Exception("Oh no!")

    response = client.get("/internal-server-error-legacy")

    assert response.status_code == 500
    assert response.json() == {"message": "Exception: Oh no!", "errorCode": "4000"}


def test_handles_framework_exceptions(app: FastAPI, client: TestClient) -> None:
    """It should properly format HTTP exceptions raised by the framework."""

    @app.get("/do-not-post")
    def raise_method_not_allowed() -> None:
        raise NotImplementedError()

    response = client.post("/do-not-post")

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.json() == {
        "errors": [
            {
                "errorCode": "4000",
                "id": "BadRequest",
                "title": "Bad Request",
                "detail": "Method Not Allowed",
            }
        ]
    }


def test_handles_legacy_framework_exceptions(app: FastAPI, client: TestClient) -> None:
    """It should properly format HTTP exceptions for legacy endpoints."""

    @app.get("/do-not-post-legacy", tags=[V1_TAG])
    def legacy_raise_method_not_allowed() -> None:
        raise NotImplementedError()

    response = client.post("/do-not-post-legacy")

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.json() == {
        "errorCode": "4000",
        "message": "Method Not Allowed",
    }


def test_handles_body_validation_error(app: FastAPI, client: TestClient) -> None:
    """It should properly format body validation errors."""

    @app.post("/items")
    def create_item(item: Item) -> Item:
        return item

    response = client.post(
        "/items",
        json={"int_field": "foobar", "array_field": ["fizzbuzz"]},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {
        "errors": [
            {
                "errorCode": "4000",
                "id": "InvalidRequest",
                "title": "Invalid Request",
                "detail": "field required",
                "source": {"pointer": "/string_field"},
            },
            {
                "errorCode": "4000",
                "id": "InvalidRequest",
                "title": "Invalid Request",
                "detail": "value is not a valid integer",
                "source": {"pointer": "/int_field"},
            },
            {
                "errorCode": "4000",
                "id": "InvalidRequest",
                "title": "Invalid Request",
                "detail": "value could not be parsed to a boolean",
                "source": {"pointer": "/array_field/0"},
            },
        ]
    }


def test_handles_query_validation_error(app: FastAPI, client: TestClient) -> None:
    """It should properly format query param validation errors."""

    @app.get("/items")
    def get_item(count: int) -> Item:
        raise NotImplementedError()

    response = client.get("/items?count=foo")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {
        "errors": [
            {
                "errorCode": "4000",
                "id": "InvalidRequest",
                "title": "Invalid Request",
                "detail": "value is not a valid integer",
                "source": {"parameter": "count"},
            },
        ]
    }


def test_handles_header_validation_error(app: FastAPI, client: TestClient) -> None:
    """It should properly format header validation errors."""

    @app.get("/items")
    def get_item(header_name: str = Header(...)) -> Item:
        raise NotImplementedError()

    response = client.get("/items")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {
        "errors": [
            {
                "errorCode": "4000",
                "id": "InvalidRequest",
                "title": "Invalid Request",
                "detail": "field required",
                "source": {"header": "header-name"},
            },
        ]
    }


def test_handles_legacy_validation_error(app: FastAPI, client: TestClient) -> None:
    """It should properly format validation errors."""

    @app.post("/items-legacy", tags=[V1_TAG])
    def create_item_legacy(item: Item) -> Item:
        return item

    response = client.post(
        "/items-legacy",
        json={"string_field": None, "int_field": "foobar", "array_field": ["fizzbuzz"]},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {
        "errorCode": "4000",
        "message": (
            "body.string_field: none is not an allowed value; "
            "body.int_field: value is not a valid integer; "
            "body.array_field.0: value could not be parsed to a boolean"
        ),
    }
