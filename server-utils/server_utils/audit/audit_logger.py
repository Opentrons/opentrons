"""FastAPI dependencies for audit logging."""

from logging import getLogger
from typing import Literal, Self, TypeAlias

from starlette.requests import Request
from starlette.responses import FileResponse, Response, StreamingResponse

from .audit_server import Client as AuditClient
from .audit_server import SubmitAuditLogMessageData
from server_utils.auth.resource_server.fastapi import (
    RequireAuthenticationResult,
)
from server_utils.auth.resource_server.types import AuthenticatedResult

MAX_LOG_CHUNK_SIZE = 1 * 1024
TRUNCATION_MESSAGE = f"(truncated after {MAX_LOG_CHUNK_SIZE} elements)"

_LOG = getLogger(__name__)

MessageStyle: TypeAlias = Literal["auto", "auto-head", "manual"]


class AuditLogger:
    """Records documented interactions for audit when auth-server requires it."""

    def __init__(
        self,
        *,
        audit_client: AuditClient,
        message_style: MessageStyle,
    ) -> None:
        self._audit_client = audit_client
        self._action: str | None = None
        self._message_chunks: list[str] = []
        self._username: str | None = None
        self._fullname: str | None = None
        self._user_note: str | None = None
        self.message_style = message_style
        self.did_log = False
        self.should_log = True

    def set_action_from_request(self: Self, request: Request) -> Self:
        """Set the action to log based on the request.

        This will be {METHOD} {ROUTE}:
        - METHOD will be the HTTP method
        - ROUTE will be the HTTP route

        To set a custom action, use set_action().
        """
        return self.set_action(f"{request.method.upper()} {request.url.path}")

    def set_action(self: Self, action: str) -> Self:
        """Set the action to log. To infer from the request use set_action_from_request."""
        self._action = action
        return self

    def append_request_method_path_to_message(self: Self, request: Request) -> Self:
        """Append the request method, path, and scheme to message."""
        self._message_chunks.append(
            f"{request.method} to {request.url.path} via {request.url.scheme}"
        )
        return self

    def append_request_headers_to_message(self: Self, request: Request) -> Self:
        """Append the request headers to message."""
        if len(request.headers) >= 0:
            self._message_chunks.append(
                f"Headers: {', '.join(f'{key}={value}' for key, value in request.headers.items())}"
            )
        else:
            self._message_chunks.append("Headers: none")
        return self

    def append_request_query_params_to_message(self: Self, request: Request) -> Self:
        """Append the request query params to message."""
        if len(request.query_params) > 0:
            self._message_chunks.append(
                f"Query parameters: {', '.join(f'{key}={value}' for key, value in request.query_params.items())}"
            )
        else:
            self._message_chunks.append("Query parameters: none")
        return self

    def append_request_head_to_message(self: Self, request: Request) -> Self:
        """Append material from the query head (aka not the body) to the message."""
        self.append_request_method_path_to_message(request)
        self.append_request_query_params_to_message(request)
        self.append_request_headers_to_message(request)
        return self

    async def append_request_body_to_message(self: Self, request: Request) -> Self:
        """Append the (possibly-summarized) request body to the message.

        Specifically,
        - If the request has no body, note that
        - If the request has a Content-Type that is not multipart/form-data,
          - append up to 1 kilo... units of the body
             - if the body is larger than 1 K, note that it was truncated at 1K
        - If the request has a Content-Type that is multipart/form-data,
          - append up to 1K of the following
             - The key and value of text fields
             - The key, filename, media-type, and size of file fields

        Note that this function will in many cases attempt to read the request body.
        It should probably not be called until after the route handler has run, and
        not be used for requests that are intended to handle large request bodies.

        Kilo units is used because this is probably going to be truncating to unicode
        codepoints, but in some cases it will be bytes. This is a choice for implementation
        simplicity since this is meant to generate a summary and the exact limits aren't
        important. If the exact content of the message is very important to you, use
        appen_message_chunk.
        """
        if "form-data" in request.headers.get(
            "content-type", "application/octet-stream"
        ):
            chunk = "Request body: form:"
            subchunks: list[str] = []
            parsed_entries = 0
            try:
                async with request.form() as form:
                    for key, value in form.items():
                        if isinstance(value, (str, bytes)):
                            subchunks.append(f"{key}={str(value)}")
                        else:
                            subchunks.append(
                                f"{key}=<File filename={value.filename} content-type={value.content_type} size={value.size}>"
                            )
                        parsed_entries += 1
            except BaseException as exc:
                subchunks.append(
                    f"<could not be further parsed after {parsed_entries} entries: {str(exc)}>"
                )
            self._message_chunks.append(f"{chunk} {', '.join(subchunks)}")
            return self
        body_chunk = "Request body: "
        try:
            body_payload = await request.body()
            body_chunk += self._decode_body(
                body_payload,
                request.headers.get("content-type", "application/octet-stream"),
            )
        except BaseException as exc:
            body_chunk += f"<could not be retrieved: {str(exc)}>"
        self._message_chunks.append(body_chunk)
        return self

    def append_response_head_to_message(self: Self, response: Response | None) -> Self:
        """Append the response head (everything but the body) to message."""
        self.append_response_code_to_message(response)
        self.append_response_headers_to_message(response)
        return self

    def append_response_code_to_message(self: Self, response: Response | None) -> Self:
        """Append the response code and its stringification to message."""
        if response is None:
            self._message_chunks.append("Response code: No known code (internal error)")
        else:
            self._message_chunks.append(f"Response code: {response.status_code}")
        return self

    def append_response_headers_to_message(
        self: Self, response: Response | None
    ) -> Self:
        """Append the response headers to the message."""
        if response is None:
            self._message_chunks.append("Response headers: none (no response)")
        elif len(response.headers) == 0:
            self._message_chunks.append("Response headers: none")
        else:
            self._message_chunks.append(
                f"Response headers: {', '.join(f'{key}={value}' for key, value in response.headers.items())}"
            )
        return self

    @staticmethod
    def _decode_body(body: bytes, media_type: str) -> str:
        if len(body) == 0:
            return "none"
        # this is not a full list of things that might be text, but it's a good list of things to
        # try to decode
        if not (
            media_type.startswith("text")
            or "json" in media_type
            or "xml" in media_type
            or "yaml" in media_type
        ):
            if len(body) > MAX_LOG_CHUNK_SIZE // 2:
                body = body[: MAX_LOG_CHUNK_SIZE // 2]
                return body.hex() + " " + TRUNCATION_MESSAGE
            return body.hex()
        try:
            maybe_decoded = body.decode("utf-8", errors="surrogateescape")
        except UnicodeDecodeError:
            if len(body) > MAX_LOG_CHUNK_SIZE // 2:
                body = body[: MAX_LOG_CHUNK_SIZE // 2]
            return body.hex() + " " + TRUNCATION_MESSAGE

        if len(maybe_decoded) > MAX_LOG_CHUNK_SIZE:
            return maybe_decoded[:MAX_LOG_CHUNK_SIZE] + " " + TRUNCATION_MESSAGE
        return maybe_decoded

    def append_response_body_to_message(self: Self, response: Response | None) -> Self:
        """Append the response body to the message.

        The response body will be appended by text up to 1K in size; if it's larger,
        it will be truncated and the truncation noted.
        """
        if response is None:
            self._message_chunks.append("Response body: none (no response)")
            return self
        if isinstance(response, StreamingResponse):
            self._message_chunks.append("Response body: <streaming>")
            return self
        if isinstance(response, FileResponse):
            self._message_chunks.append(
                f"Response body: <File path={response.path} name={response.filename}>"
            )
            return self
        if not hasattr(response, "body") or len(response.body) == 0:
            self._message_chunks.append("Response body: none")
            return self
        self._message_chunks.append(
            f"Response body: {self._decode_body(response.body, response.headers['content-type'])}"
        )
        return self

    async def append_message_from_request_response(
        self: Self, request: Request, response: Response | None
    ) -> Self:
        """Set the message to log based on the HTTP transaction.

        This will be a stringification of the route's path params and body, and where
        possible the result.

        For more, see append_request_head_to_message, append_request_body_to_message,
        append_response_head_to_message, and append_response_body_to_message.
        """
        self.append_message_from_request_response_head(request, response)
        await self.append_request_body_to_message(request)
        self.append_response_body_to_message(response)

        return self

    def append_message_from_request_response_head(
        self: Self, request: Request, response: Response | None
    ) -> Self:
        """Set the message to log based on the non-body parts of the HTTP transaction."""
        self.append_request_head_to_message(request)
        self.append_response_head_to_message(response)
        return self

    def append_message_chunk(self: Self, chunk: str) -> Self:
        """Append a message chunk."""
        if len(chunk) > MAX_LOG_CHUNK_SIZE:
            chunk = f"{chunk[:MAX_LOG_CHUNK_SIZE]} {TRUNCATION_MESSAGE}"
        self._message_chunks.append(chunk)
        return self

    def set_message(self: Self, message: str) -> Self:
        """Set the message to log directly. This will overwrite previous messages."""
        if len(message) > MAX_LOG_CHUNK_SIZE:
            message = f"{message[:MAX_LOG_CHUNK_SIZE]} {TRUNCATION_MESSAGE}"
        self._message_chunks = [message]
        return self

    def set_username(self: Self, username: str) -> Self:
        """Set the username to be used in the log directly."""
        self._username = username
        return self

    def set_fullname(self: Self, fullname: str) -> Self:
        """Set the full name to be used in the log directly."""
        self._fullname = fullname
        return self

    def set_auth_details(self: Self, auth_details: RequireAuthenticationResult) -> Self:
        """Set the username and fullname to be used in the log from auth details."""
        if isinstance(auth_details, AuthenticatedResult):
            self._fullname = auth_details.fullname
            self._username = auth_details.username
        else:
            _LOG.warning(f"Will not send audit log because auth was {auth_details}")
            self.should_log = False
        return self

    def set_user_note(self: Self, user_note: str | None) -> Self:
        """Set the user note to be included in the log."""
        self._user_note = user_note
        return self

    def _log_details_or_fail(self) -> SubmitAuditLogMessageData:
        if self._action is None:
            raise RuntimeError("No action set for log. This is a server bug.")
        if self._username is None:
            raise RuntimeError("No username set for log. This is a server bug.")
        if self._fullname is None:
            raise RuntimeError("No fullname set for log. This is a server bug.")
        if len(self._message_chunks) == 0:
            raise RuntimeError("No message set for log. This is a server bug.")
        message = "; ".join(self._message_chunks)
        return SubmitAuditLogMessageData(
            action=self._action,
            accountName=self._username,
            legalName=self._fullname,
            message=message,
            reason=self._user_note,
        )

    async def log(self) -> None:
        """Record the configured log."""
        if self.should_log and not self.did_log:
            await self._audit_client.submit_log_message(self._log_details_or_fail())

        self.did_log = True
