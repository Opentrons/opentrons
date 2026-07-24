from pathlib import Path
from typing import AsyncIterator, Iterator, Type

import pytest
from decoy import Decoy, matchers
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import (
    FileResponse,
    HTMLResponse,
    JSONResponse,
    PlainTextResponse,
    RedirectResponse,
    Response,
    StreamingResponse,
)
from starlette.routing import Route
from starlette.testclient import TestClient

from server_utils.audit.audit_logger import MAX_LOG_CHUNK_SIZE, AuditLogger
from server_utils.audit.audit_server import Client, SubmitAuditLogMessageData
from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
)


@pytest.fixture
def mock_client(decoy: Decoy) -> Client:
    """A pretend audit server client."""
    return decoy.mock(cls=Client)


@pytest.fixture
def subject(mock_client: Client, request: pytest.FixtureRequest) -> AuditLogger:
    """An audit logger."""
    return AuditLogger(
        audit_client=mock_client,
        auto_log_request_head=True,
        auto_log_response_head=True,
        auto_log_request_body=True,
        auto_log_response_body=True,
    )


@pytest.fixture
def parametrized_subject(
    mock_client: Client, request: pytest.FixtureRequest
) -> AuditLogger:
    """A subject with non-message fields prefilled."""
    return (
        AuditLogger(
            audit_client=mock_client,
            auto_log_request_head=True,
            auto_log_response_head=True,
            auto_log_request_body=True,
            auto_log_response_body=True,
        )
        .set_action("a")
        .set_username("u")
        .set_fullname("f")
    )


ALL_METHODS = [
    "PUT",
    "PATCH",
    "DELETE",
    "POST",
    "GET",
    "HEAD",
    "OPTIONS",
    "CONNECT",
    "TRACE",
    "QUERY",
]


@pytest.fixture
def subject_client(parametrized_subject: AuditLogger) -> Iterator[TestClient]:
    """A fastapi test client for making requests."""

    async def body_handler(request: Request) -> Response:
        await parametrized_subject.append_request_body_to_message(request)
        await parametrized_subject.log()
        return Response(content="body")

    async def method_path_handler(request: Request) -> Response:
        parametrized_subject.append_request_method_path_to_message(request)
        await parametrized_subject.log()
        return Response(content="method")

    async def query_param_handler(request: Request) -> Response:
        parametrized_subject.append_request_query_params_to_message(request)
        await parametrized_subject.log()
        return Response(content="queryparams")

    async def headers_handler(request: Request) -> Response:
        parametrized_subject.append_request_headers_to_message(request)
        await parametrized_subject.log()
        return Response(content="headers")

    app = Starlette(
        routes=[
            Route(
                "/body",
                body_handler,
                methods=ALL_METHODS,
            ),
            Route(
                "/method",
                method_path_handler,
                methods=ALL_METHODS,
            ),
            Route(
                "/queryparams",
                query_param_handler,
                methods=ALL_METHODS,
            ),
            Route(
                "/headers",
                headers_handler,
                methods=ALL_METHODS,
            ),
        ]
    )
    with TestClient(app) as test_client:
        yield test_client


def parametrized_log(message: str) -> SubmitAuditLogMessageData:
    """A log message with the same fields prefilled as parametrized_subject."""
    return SubmitAuditLogMessageData(
        action="a", accountName="u", legalName="f", reason=None, message=message
    )


async def test_audit_logger_throws_without_action(
    subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It should throw if asked to log without an action."""
    with pytest.raises(RuntimeError):
        subject.append_message_chunk("m")
        subject.set_username("u")
        subject.set_fullname("f")
        await subject.log()
    decoy.verify(await mock_client.submit_log_message(matchers.Anything()), times=0)


async def test_audit_logger_throws_without_message(
    subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It should throw if asked to log without a message."""
    with pytest.raises(RuntimeError):
        subject.set_username("u")
        subject.set_fullname("f")
        subject.set_action("a")
        await subject.log()
    decoy.verify(await mock_client.submit_log_message(matchers.Anything()), times=0)


async def test_audit_logger_throws_without_username(
    subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It should throw if asked to log without a username."""
    with pytest.raises(RuntimeError):
        subject.append_message_chunk("m")
        subject.set_fullname("f")
        subject.set_action("a")
        await subject.log()
    decoy.verify(await mock_client.submit_log_message(matchers.Anything()), times=0)


async def test_audit_logger_throws_without_fullname(
    subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It should throw if asked to log without a fullname."""
    with pytest.raises(RuntimeError):
        subject.append_message_chunk("m")
        subject.set_username("u")
        subject.set_action("a")
        await subject.log()
    decoy.verify(await mock_client.submit_log_message(matchers.Anything()), times=0)


async def test_audit_logger_allows_missing_reason(
    subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It will log without a reason."""
    subject.append_message_chunk("m")
    subject.set_username("u")
    subject.set_fullname("f")
    subject.set_action("a")
    await subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            SubmitAuditLogMessageData(
                action="a", accountName="u", legalName="f", message="m", reason=None
            )
        ),
        times=1,
    )


async def test_audit_logger_sends_reason(
    subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It will log without a reason."""
    subject.append_message_chunk("m")
    subject.set_username("u")
    subject.set_fullname("f")
    subject.set_action("a")
    subject.set_user_note("n")
    await subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            SubmitAuditLogMessageData(
                action="a", accountName="u", legalName="f", message="m", reason="n"
            )
        ),
        times=1,
    )


async def test_audit_logger_allows_manual_messages_by_string(
    parametrized_subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It should allow appending message chunks."""
    parametrized_subject.append_message_chunk("m")
    parametrized_subject.append_message_chunk("e")
    await parametrized_subject.log()
    decoy.verify(await mock_client.submit_log_message(parametrized_log("m; e")))


async def test_audit_logger_allows_message_replacement(
    parametrized_subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It should allow setting a message directly."""
    parametrized_subject.append_message_chunk("m")
    parametrized_subject.set_message("hello world")
    await parametrized_subject.log()
    decoy.verify(await mock_client.submit_log_message(parametrized_log("hello world")))


async def test_audit_logger_does_not_log_if_not_authenticated(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    parametrized_subject.append_message_chunk("m")
    parametrized_subject.set_auth_details(AuthenticationNotRequiredResult())
    await parametrized_subject.log()
    decoy.verify(await mock_client.submit_log_message(matchers.Anything()), times=0)


async def test_audit_logger_uses_auth_result(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    parametrized_subject.append_message_chunk("m")
    parametrized_subject.set_auth_details(
        AuthenticatedResult(username="me", fullname="really me", scope="")
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            SubmitAuditLogMessageData(
                action="a",
                accountName="me",
                legalName="really me",
                reason=None,
                message="m",
            )
        )
    )


async def test_response_code_handles_no_response(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should note a missing reasonse."""
    parametrized_subject.append_response_code_to_message(None)
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Response code: No known code (internal error)")
        )
    )


async def test_response_code_adds_response_code(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should serialize code."""
    parametrized_subject.append_response_code_to_message(
        Response(content="hi", status_code=304, headers=None, media_type="text/plain")
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(parametrized_log("Response code: 304"))
    )


async def test_response_headers_handles_no_response(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should note a missing response."""
    parametrized_subject.append_response_headers_to_message(None)
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Response headers: none (no response)")
        )
    )


async def test_response_headers_handles_no_headers(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should have a special message for a headerless response."""
    parametrized_subject.append_response_headers_to_message(
        Response(content=None, status_code=304, headers=None)
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(parametrized_log("Response headers: none"))
    )


async def test_response_headers_adds_headers(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should serialize present response headers."""
    parametrized_subject.append_response_headers_to_message(
        Response(
            content="hi",
            status_code=304,
            headers={"x-some-stuff": "hi", "content-type": "gross"},
            media_type="text/plain",
        )
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Response headers: x-some-stuff=hi, content-type=gross")
        )
    )


async def test_response_body_handles_no_response(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should handle a missing response."""
    parametrized_subject.append_response_body_to_message(None)
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Response body: none (no response)")
        )
    )


async def test_response_body_handles_no_body(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should handle a bodyless response."""
    parametrized_subject.append_response_body_to_message(
        Response(content=None, status_code=500, headers=None)
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(parametrized_log("Response body: none"))
    )


async def test_response_body_handles_redirect(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should handle a bodyless response."""
    parametrized_subject.append_response_body_to_message(
        RedirectResponse(url="http://goaway.com", status_code=301, headers=None)
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(parametrized_log("Response body: none"))
    )


@pytest.mark.parametrize(
    "mediatype",
    [
        "text/plain",
        "text/plain; charset=utf8",
        "application/json",
        "application/xml",
        "text/html",
        "text/javascript",
    ],
)
async def test_response_body_handles_text_body(
    parametrized_subject: AuditLogger, mock_client: Client, decoy: Decoy, mediatype: str
) -> None:
    """It should handle a response with text in the body."""
    parametrized_subject.append_response_body_to_message(
        Response(
            content="sakdjhakjhfads",
            status_code=200,
            headers=None,
            media_type=mediatype,
        )
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Response body: sakdjhakjhfads")
        )
    )


@pytest.mark.parametrize(
    "mediatype",
    [
        "text/plain",
        "text/plain; charset=utf8",
        "application/json",
        "application/xml",
        "text/html",
        "text/javascript",
    ],
)
@pytest.mark.parametrize(
    "responsetype",
    [Response, PlainTextResponse, HTMLResponse],
)
async def test_response_body_handles_text_body_with_invalid_unicode(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    mediatype: str,
    responsetype: Type[Response],
) -> None:
    """It should handle a response with text in the body that needs escaping."""
    parametrized_subject.append_response_body_to_message(
        responsetype(
            content=b"sakdjhakjhfads\xc3\x28",
            media_type=mediatype,
        )
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            # surrogate escapes!
            parametrized_log("Response body: sakdjhakjhfads\udcc3(")
        )
    )


@pytest.mark.parametrize(
    "mediatype",
    [
        "text/plain",
        "text/plain; charset=utf8",
        "application/json",
        "application/xml",
        "text/html",
        "text/javascript",
    ],
)
async def test_response_body_handles_too_long_text_body(
    parametrized_subject: AuditLogger, mock_client: Client, decoy: Decoy, mediatype: str
) -> None:
    """It should handle a response with text in the body."""
    parametrized_subject.append_response_body_to_message(
        Response(
            content="a" * (MAX_LOG_CHUNK_SIZE + 1),
            status_code=200,
            headers=None,
            media_type=mediatype,
        )
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(
                f"Response body: {'a' * MAX_LOG_CHUNK_SIZE} (truncated after {MAX_LOG_CHUNK_SIZE} elements)"
            )
        )
    )


@pytest.mark.parametrize(
    "mediatype", ["application/octet-stream", "image/png", "video/mp4"]
)
async def test_response_body_handles_binary_body(
    parametrized_subject: AuditLogger, mock_client: Client, decoy: Decoy, mediatype: str
) -> None:
    """It should handle a response with a binary body by hexing it."""
    parametrized_subject.append_response_body_to_message(
        Response(
            content=b"\x01\x02\x03\x04\x05",
            status_code=200,
            headers=None,
            media_type=mediatype,
        )
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Response body: 0102030405")
        )
    )


@pytest.mark.parametrize(
    "mediatype", ["application/octet-stream", "image/png", "video/mp4"]
)
async def test_response_body_handles_binary_body_too_long(
    parametrized_subject: AuditLogger, mock_client: Client, decoy: Decoy, mediatype: str
) -> None:
    """It should handle a response with a binary body by hexing it."""
    parametrized_subject.append_response_body_to_message(
        Response(
            content=b"\x01\x02" * (MAX_LOG_CHUNK_SIZE // 2 + 1),
            status_code=200,
            headers=None,
            media_type=mediatype,
        )
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(
                "Response body: "
                + "0102" * (MAX_LOG_CHUNK_SIZE // 4)
                + f" (truncated after {MAX_LOG_CHUNK_SIZE} elements)"
            )
        )
    )


async def test_response_body_handles_json_response(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should log a json response."""
    parametrized_subject.append_response_body_to_message(
        JSONResponse(content={"hi": "there"})
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log('Response body: {"hi":"there"}')
        )
    )


async def test_response_body_handles_too_long_json_response(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
) -> None:
    """It should log a json response."""
    parametrized_subject.append_response_body_to_message(
        JSONResponse(content={"hi": "a" * MAX_LOG_CHUNK_SIZE})
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(
                'Response body: {"hi":"'
                + "a" * (MAX_LOG_CHUNK_SIZE - 7)
                + f" (truncated after {MAX_LOG_CHUNK_SIZE} elements)"
            )
        )
    )


async def test_response_body_handles_streaming(
    parametrized_subject: AuditLogger, mock_client: Client, decoy: Decoy
) -> None:
    """It should send a standin for streaming."""

    async def _fake_body() -> AsyncIterator[bytes]:
        yield b"1"

    parametrized_subject.append_response_body_to_message(
        StreamingResponse(_fake_body(), media_type="text/plain")
    )
    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Response body: <streaming>")
        )
    )


async def test_response_body_handles_file(
    parametrized_subject: AuditLogger, mock_client: Client, decoy: Decoy, tmp_path: Path
) -> None:
    """It should handle a filepath."""

    filepath = tmp_path / "hi.jpg"
    filepath.write_bytes(b"\x01\x02")

    parametrized_subject.append_response_body_to_message(
        FileResponse(path=filepath, filename="greetings.jpg")
    )

    await parametrized_subject.log()
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(
                f"Response body: <File path={filepath} name=greetings.jpg>"
            )
        )
    )


BODY_METHODS = ["POST", "PATCH", "PUT"]
NONBODY_METHODS = ["GET", "DELETE"]
COMMON_METHODS = BODY_METHODS + NONBODY_METHODS


@pytest.mark.parametrize("method", COMMON_METHODS)
async def test_logs_request_method_path(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log a request's method and route."""
    response = subject_client.request(method.lower(), "/method")
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(f"{method} to /method via http")
        )
    )


@pytest.mark.parametrize("method", NONBODY_METHODS)
async def test_logs_headers_bodyless(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log a request with no headers."""
    response = subject_client.request(method.lower(), "/headers")
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(
                "Headers: host=testserver, accept=*/*, accept-encoding=gzip, deflate, connection=keep-alive, user-agent=testclient"
            )
        )
    )


@pytest.mark.parametrize("method", BODY_METHODS)
async def test_logs_headers_embodied(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log a request with no headers."""
    response = subject_client.request(method.lower(), "/headers")
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(
                "Headers: host=testserver, content-length=0, accept=*/*, accept-encoding=gzip, deflate, connection=keep-alive, user-agent=testclient"
            )
        )
    )


@pytest.mark.parametrize("method", COMMON_METHODS)
async def test_logs_no_query_params(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log the absence of query params"""
    response = subject_client.request(method.lower(), "/queryparams")
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(parametrized_log("Query parameters: none"))
    )


@pytest.mark.parametrize("method", COMMON_METHODS)
async def test_logs_query_params(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log query params"""
    response = subject_client.request(method.lower(), "/queryparams?hello=true&t=f")
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Query parameters: hello=true, t=f")
        )
    )


@pytest.mark.parametrize("method", BODY_METHODS)
async def test_logs_handles_no_body(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log an empty body."""
    response = subject_client.request(method.lower(), "/body")
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(parametrized_log("Request body: none"))
    )


@pytest.mark.parametrize("method", BODY_METHODS)
async def test_logs_handles_form_data(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
    tmp_path: Path,
) -> None:
    """It should log a form-data body."""
    uploadfile = tmp_path / "file.txt"
    uploadfile.write_text("hello")
    response = subject_client.request(
        method.lower(),
        "/body",
        data={"hello": "friend"},
        files={"blah.txt": ("file.txt", "hello")},
    )
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(
                "Request body: form: hello=friend, blah.txt=<File filename=file.txt content-type=text/plain size=5>"
            )
        )
    )


@pytest.mark.parametrize("method", BODY_METHODS)
async def test_log_handles_text_data(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log an unstructured body."""
    response = subject_client.request(
        method.lower(),
        "/body",
        content=b"ajshfsad",
        headers={"content-type": "text/plain"},
    )
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(parametrized_log("Request body: ajshfsad"))
    )


@pytest.mark.parametrize("method", BODY_METHODS)
async def test_log_handles_unknown_data_as_bytes(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log an unstructured body."""
    response = subject_client.request(
        method.lower(),
        "/body",
        content=b"ajshfsad",
    )
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log("Request body: 616a736866736164")
        )
    )


@pytest.mark.parametrize("method", BODY_METHODS)
async def test_log_handles_json(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log json text."""
    response = subject_client.request(method.lower(), "/body", json={"hello": "world"})
    assert response.status_code == 200
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log('Request body: {"hello": "world"}')
        )
    )


@pytest.mark.parametrize("method", BODY_METHODS)
async def test_log_handles_long_json(
    parametrized_subject: AuditLogger,
    mock_client: Client,
    decoy: Decoy,
    subject_client: TestClient,
    method: str,
) -> None:
    """It should log json text."""
    response = subject_client.request(
        method.lower(), "/body", json={"hello": "a" * MAX_LOG_CHUNK_SIZE}
    )
    assert response.status_code == 200
    as_remaining = "a" * (MAX_LOG_CHUNK_SIZE - 11)
    decoy.verify(
        await mock_client.submit_log_message(
            parametrized_log(
                'Request body: {"hello": "'
                + as_remaining
                + " "
                + f"(truncated after {MAX_LOG_CHUNK_SIZE} elements)"
            )
        )
    )
