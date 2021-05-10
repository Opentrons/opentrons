"""Tests for API error exceptions and response model serialization."""
from robot_server.errors.error_responses import (
    ApiError,
    ErrorResponse,
    LegacyErrorResponse,
    MultiErrorResponse,
)


def test_api_error_response() -> None:
    """It should serialize an API error response."""
    result = ErrorResponse(
        id="SomeErrorId",
        title="Some Error Title",
        detail="Some error detail",
    ).as_error(status_code=400)

    assert isinstance(result, ApiError)
    assert result.status_code == 400
    assert result.content == {
        "id": "SomeErrorId",
        "title": "Some Error Title",
        "detail": "Some error detail",
    }


def test_api_error_response_with_meta() -> None:
    """It should serialize an API error response with a meta object."""
    result = ErrorResponse(
        id="SomeErrorId",
        title="Some Error Title",
        detail="Some error detail",
        meta={"some": "meta information"},
    ).as_error(status_code=400)

    assert isinstance(result, ApiError)
    assert result.status_code == 400
    assert result.content == {
        "id": "SomeErrorId",
        "title": "Some Error Title",
        "detail": "Some error detail",
        "meta": {"some": "meta information"},
    }


def test_legacy_api_error_response() -> None:
    """It should serialize an API error response."""
    result = LegacyErrorResponse(
        message="Some error detail",
    ).as_error(status_code=400)

    assert isinstance(result, ApiError)
    assert result.status_code == 400
    assert result.content == {"message": "Some error detail"}


def test_multi_api_error_response() -> None:
    """It should serialize an API error response."""
    result = MultiErrorResponse(
        errors=[
            ErrorResponse(
                id="SomeErrorId",
                title="Some Error Title",
                detail="Some error detail",
                meta={"some": "meta information"},
            )
        ]
    ).as_error(status_code=400)

    assert isinstance(result, ApiError)
    assert result.status_code == 400
    assert result.content == {
        "errors": [
            {
                "id": "SomeErrorId",
                "title": "Some Error Title",
                "detail": "Some error detail",
                "meta": {"some": "meta information"},
            }
        ]
    }
