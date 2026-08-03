"""Bindings to audit-server's HTTP API.

This is just the bare minimum required by dependent servers to submit
audit log messages.
"""

from __future__ import annotations

import contextlib
import logging
import typing
from abc import ABC, abstractmethod
from datetime import datetime, timezone

import aiohttp
import pydantic

LOG_MESSAGE_ENDPOINT_PATH: typing.Final = "audit/internal/logMessage"
SETTINGS_ENDPOINT_PATH: typing.Final = "audit/external/settings"

_log = logging.getLogger(__name__)


class Client(ABC):
    """An interface for a dependent server to submit audit log messages to audit-server."""

    @abstractmethod
    async def submit_log_message(
        self, message: SubmitAuditLogMessageData
    ) -> SubmitAuditLogSuccessData:
        """Submit a single audit log message.

        If there's an internal error (e.g. the audit server is unconnectable),
        the implementation should raise it as an exception.
        """
        pass

    @abstractmethod
    async def get_settings(self) -> AuditSettingsResponseData:
        """Get the currently-configured audit settings."""
        pass


class LocalHTTPClient(Client):
    """A client implementation that talks to audit-server over a local HTTP connection."""

    def __init__(
        self,
        *,
        audit_server_uds: str | None = None,
        audit_server_url: str | None = None,
    ) -> None:
        """Construct the client.

        Params:
            audit_server_uds: e.g. `/path/to/socket`, to connect to audit-server via
                a Unix domain socket.
            audit_server_url: e.g. `http://localhost:1234`, to connect to audit-server
                via TCP.
        """
        if audit_server_uds is not None and audit_server_url is not None:
            raise ValueError(
                "Specify only one of audit_server_uds or audit_server_url."
            )

        if audit_server_uds is not None:
            connector = aiohttp.UnixConnector(path=audit_server_uds)
            session = aiohttp.ClientSession(
                connector=connector,
                # We're connecting over a Unix socket, so this URL is nonsensical,
                # but aiohttp seems to require it as a placeholder.
                # https://github.com/aio-libs/aiohttp/issues/11324.
                base_url="http://localhost",
            )
            _log.info(f"Built audit client to connect to socket at {audit_server_uds}")
        elif audit_server_url is not None:
            session = aiohttp.ClientSession(base_url=audit_server_url)
            _log.info(f"Built audit client to connect to url at {audit_server_url}")
        else:
            raise ValueError("Specify audit_server_uds or audit_server_url.")

        self._session = session
        self._exit_stack = contextlib.AsyncExitStack()

    async def __aenter__(self) -> typing.Self:
        """When entered as a context manager, open the underlying connection."""
        await self._exit_stack.enter_async_context(self._session)
        return self

    async def __aexit__(
        self, exc_type: object, exc_value: object, traceback: object
    ) -> None:
        """When exited as a context manager, close the underlying connection."""
        await self._exit_stack.aclose()

    @typing.override
    async def submit_log_message(
        self, message: SubmitAuditLogMessageData
    ) -> SubmitAuditLogSuccessData:
        request_body = SubmitAuditLogMessageRequestBody(data=message)
        async with self._session.post(
            LOG_MESSAGE_ENDPOINT_PATH,
            data=request_body.model_dump_json(),
            headers={"Content-Type": "application/json"},
        ) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = SubmitAuditLogMessageResponseBody.model_validate_json(
            response_bytes
        )
        return parsed_response.data

    @typing.override
    async def get_settings(self) -> AuditSettingsResponseData:
        async with self._session.get(SETTINGS_ENDPOINT_PATH) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = AuditSettingsResponseBody.model_validate_json(response_bytes)
        return parsed_response.data


class NoOpClient(Client):
    """A client implementation that doesn't actually contact audit-server.

    Use this when audit-server isn't configured (e.g. CRS disabled).
    It logs the message locally and returns a synthesized success response.
    """

    @typing.override
    async def submit_log_message(
        self, message: SubmitAuditLogMessageData
    ) -> SubmitAuditLogSuccessData:
        _log.info(
            "Audit log message (audit-server not configured): "
            "action=%s account_name=%s legal_name=%s reason=%s message=%s",
            message.action,
            message.accountName,
            message.legalName,
            message.reason,
            message.message,
        )
        return SubmitAuditLogSuccessData(loggedAt=datetime.now(timezone.utc))

    @typing.override
    async def get_settings(self) -> AuditSettingsResponseData:
        return AuditSettingsResponseData(
            requireReasonForInteraction=False, minLengthOfReasonForInteraction=0
        )


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class SubmitAuditLogMessageData(_StrictBaseModel):
    """The payload portion of a log-message request."""

    action: str
    accountName: str
    legalName: str
    message: str
    reason: str | None


class SubmitAuditLogSuccessData(_StrictBaseModel):
    """The payload of log-message success response."""

    loggedAt: datetime


class SubmitAuditLogMessageRequestBody(_StrictBaseModel):
    """Request envelope for the log-message."""

    data: SubmitAuditLogMessageData


class SubmitAuditLogMessageResponseBody(_StrictBaseModel):
    """Response envelope for log-message."""

    data: SubmitAuditLogSuccessData


class AuditSettingsResponseData(_StrictBaseModel):
    """Audit settings payload."""

    requireReasonForInteraction: bool
    minLengthOfReasonForInteraction: int | None = None


class AuditSettingsResponseBody(_StrictBaseModel):
    """Response envelope for audit settings."""

    data: AuditSettingsResponseData
