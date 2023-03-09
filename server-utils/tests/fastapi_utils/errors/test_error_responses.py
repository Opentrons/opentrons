"""Tests for API error exceptions and response model serialization."""
from robot_server.errors.error_responses import (
    ApiError,
    ErrorSource,
    ErrorDetails,
    ErrorBody,
    LegacyErrorResponse,
    MultiErrorResponse,
)


def test_error_details() -> None:
    """It should serialize an error response from an ErrorDetails."""
    result = ErrorDetails(
        id="SomeErrorId",
        title="Some Error Title",
        detail="Some error detail",
    ).as_error(status_code=400)

    assert isinstance(result, ApiError)
    assert result.status_code == 400
    assert result.content == {
        "errors": (
            {
                "id": "SomeErrorId",
                "title": "Some Error Title",
                "detail": "Some error detail",
            },
        )
    }


def test_error_details_with_meta() -> None:
    """It should serialize an error with meta and source from ErrorDetails."""
    result = ErrorDetails(
        id="SomeErrorId",
        title="Some Error Title",
        detail="Some error detail",
        source=ErrorSource(pointer="/foo/bar/baz"),
        meta={"some": "meta information"},
    ).as_error(status_code=400)

    assert isinstance(result, ApiError)
    assert result.status_code == 400
    assert result.content == {
        "errors": (
            {
                "id": "SomeErrorId",
                "title": "Some Error Title",
                "detail": "Some error detail",
                "source": {"pointer": "/foo/bar/baz"},
                "meta": {"some": "meta information"},
            },
        )
    }


def test_legacy_error_response() -> None:
    """It should serialize an error response from a LegacyErrorResponse."""
    result = LegacyErrorResponse(
        message="Some error detail",
    ).as_error(status_code=400)

    assert isinstance(result, ApiError)
    assert result.status_code == 400
    assert result.content == {"message": "Some error detail"}


def test_error_response() -> None:
    """It should serialize an error response from an ErrorResponse."""
    result = ErrorBody(
        errors=(
            ErrorDetails(
                id="SomeErrorId",
                title="Some Error Title",
                detail="Some error detail",
                meta={"some": "meta information"},
            ),
        )
    ).as_error(status_code=400)

    assert isinstance(result, ApiError)
    assert result.status_code == 400
    assert result.content == {
        "errors": (
            {
                "id": "SomeErrorId",
                "title": "Some Error Title",
                "detail": "Some error detail",
                "meta": {"some": "meta information"},
            },
        )
    }


def test_multi_error_response() -> None:
    """It should serialize an error response from a MultiErrorResponse."""
    result = MultiErrorResponse(
        errors=[
            ErrorDetails(
                id="SomeErrorId",
                title="Some Error Title",
                detail="Some error detail",
                meta={"some": "meta information"},
            ),
            ErrorDetails(
                id="SomeOtherErrorId",
                title="Some Other Error Title",
                detail="Some other error detail",
                meta={"some": "other meta information"},
            ),
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
            },
            {
                "id": "SomeOtherErrorId",
                "title": "Some Other Error Title",
                "detail": "Some other error detail",
                "meta": {"some": "other meta information"},
            },
        ]
    }
