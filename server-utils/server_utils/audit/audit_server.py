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

LOGGING_ENABLED_ENDPOINT_PATH: typing.Final = "audit/internal/loggingEnabled"
LOG_MESSAGE_ENDPOINT_PATH: typing.Final = "audit/internal/logMessage"
SETTINGS_ENDPOINT_PATH: typing.Final = "audit/external/settings"
STORE_ROBOT_LOG_ENDPOINT_PATH = "/audit/internal/storeRobotLog"
GET_LOGGING_ENABLED_ENDPOINT_PATH = "/audit/internal/loggingEnabled"
GET_LOG_PERIODS = "/audit/external/logPeriods"

_log = logging.getLogger(__name__)


class Client(ABC):
    """An interface for a dependent server to submit audit log messages and robot logs to audit-server."""

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

    @abstractmethod
    async def store_robot_log(
        self, robot_log_file: typing.TextIO
    ) -> StoreRobotLogSuccessData:
        """Store a robot log file and rotate the log period.

        If there's an internal error (e.g. the audit server is unconnectable),
        the implementation should raise it as an exception.
        """
        pass

    @abstractmethod
    async def get_logging_enabled(self) -> GetLoggingEnabledData:
        """Get if the robot has audit logging enabled."""
        pass

    @abstractmethod
    async def set_logging_enabled(
        self, setting: PatchLoggingEnabledRequestData
    ) -> PatchLoggingEnabledResponseData:
        """Enable or disable logging."""

    @abstractmethod
    async def get_current_log_period(self) -> GetLogPeriodsData | None:
        """Get the current log period, if any."""
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

    @typing.override
    async def store_robot_log(
        self, robot_log_file: typing.TextIO
    ) -> StoreRobotLogSuccessData:
        async with self._session.post(
            STORE_ROBOT_LOG_ENDPOINT_PATH, data={"file": robot_log_file}
        ) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = StoreRobotLogResponseBody.model_validate_json(response_bytes)
        return parsed_response.data

    @typing.override
    async def get_logging_enabled(self) -> GetLoggingEnabledData:
        async with self._session.get(GET_LOGGING_ENABLED_ENDPOINT_PATH) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = GetLoggingEnabledResponseBody.model_validate_json(
            response_bytes
        )
        return parsed_response.data

    @typing.override
    async def set_logging_enabled(
        self, setting: PatchLoggingEnabledRequestData
    ) -> PatchLoggingEnabledResponseData:
        """Enable or disable logging."""
        request_body = PatchLoggingEnabledRequestBody(data=setting)
        async with self._session.patch(
            LOGGING_ENABLED_ENDPOINT_PATH,
            data=request_body.model_dump_json(),
            headers={"Content-Type": "application/json"},
        ) as response:
            response_bytes = await response.read()
        parsed_response = PatchLoggingEnabledResponseBody.model_validate_json(
            response_bytes
        )
        return parsed_response.data

    @typing.override
    async def get_current_log_period(self) -> GetLogPeriodsData | None:
        async with self._session.get(GET_LOG_PERIODS) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = GetLogPeriodsResponseBody.model_validate_json(response_bytes)
        for log_period in parsed_response.data:
            if log_period.endedAt is None:
                return log_period
        return None


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

    @typing.override
    async def store_robot_log(
        self, robot_log_file: typing.TextIO
    ) -> StoreRobotLogSuccessData:
        _log.info(
            f"Store robot log (audit-server not configured): {robot_log_file.name}"
        )
        return StoreRobotLogSuccessData(loggingEnabled=False)

    @typing.override
    async def get_logging_enabled(self) -> GetLoggingEnabledData:
        _log.info("Get logging enabled (audit-server not configured): Returning false")
        return GetLoggingEnabledData(loggingEnabled=False)

    @typing.override
    async def set_logging_enabled(
        self, setting: PatchLoggingEnabledRequestData
    ) -> PatchLoggingEnabledResponseData:
        """Enable or disable logging."""
        return PatchLoggingEnabledResponseData(loggingEnabled=False)

    @typing.override
    async def get_current_log_period(self) -> GetLogPeriodsData | None:
        _log.info(
            "Get current log period (audit-server not configured): Returning None"
        )
        return None


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


class StoreRobotLogSuccessData(_StrictBaseModel):
    """The payload of a store robot log success response."""

    loggingEnabled: bool


class PatchLoggingEnabledResponseData(_StrictBaseModel):
    """A response with the current logging-enabled setting."""

    loggingEnabled: bool


class StoreRobotLogResponseBody(_StrictBaseModel):
    """Response envelope for store robot log."""

    data: StoreRobotLogSuccessData


class GetLoggingEnabledData(_StrictBaseModel):
    """The payload of a get logging enabled response."""

    loggingEnabled: bool


class GetLoggingEnabledResponseBody(_StrictBaseModel):
    """Response envelope for get logging enabled."""

    data: GetLoggingEnabledData


class PatchLoggingEnabledRequestData(_StrictBaseModel):
    """A request to change the logging-enabled setting."""

    loggingEnabled: bool
    accountName: str
    legalName: str
    reason: str | None


class PatchLoggingEnabledRequestBody(_StrictBaseModel):
    """Request envelope for logging-enabled."""

    data: PatchLoggingEnabledRequestData


class PatchLoggingEnabledResponseBody(_StrictBaseModel):
    """Response envelope for logging-enabled."""

    data: PatchLoggingEnabledResponseData


class GetLogPeriodsData(_StrictBaseModel):
    """The payload of a get log periods response."""

    id: int
    startedAt: datetime
    endedAt: datetime | None


class GetLogPeriodsResponseBody(_StrictBaseModel):
    """Response envelope for get log periods."""

    data: list[GetLogPeriodsData]
