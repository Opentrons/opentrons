"""server_utils.audit.audit_server.Client implementation for local log storage."""

import datetime
from typing import TextIO, override

from server_utils.audit.audit_server import (
    AuditSettingsResponseData as SUSettingsData,
)
from server_utils.audit.audit_server import (
    Client as SUClient,
)
from server_utils.audit.audit_server import (
    GetLoggingEnabledData,
    StoreRobotLogSuccessData,
)
from server_utils.audit.audit_server import (
    GetLogPeriodsData as SULogPeriodsData,
)
from server_utils.audit.audit_server import (
    PatchLoggingEnabledRequestData as SUEnabledRequestData,
)
from server_utils.audit.audit_server import (
    PatchLoggingEnabledResponseData as SUEnabledResponseData,
)
from server_utils.audit.audit_server import (
    SubmitAuditLogMessageData as SUSubmitData,
)
from server_utils.audit.audit_server import (
    SubmitAuditLogSuccessData as SUSuccessData,
)

from .log_ingest.models import AuditLogMessage
from audit_server.log_storage.log_data_manager import LogDataManager
from audit_server.settings.store import SettingsStore


class LocalClient(SUClient):
    """An 'audit client' that provides direct access to the log data manager."""

    def __init__(
        self, log_data_manager: LogDataManager, settings_store: SettingsStore
    ) -> None:
        """Build the LocalClient and provide the log data manager."""
        self._log_data_manager = log_data_manager
        self._settings_store = settings_store

    @override
    async def submit_log_message(self, message: SUSubmitData) -> SUSuccessData:
        """Submit a log locally."""
        ingest_time = datetime.datetime.now(datetime.timezone.utc)
        to_log = AuditLogMessage(
            action=message.action,
            accountName=message.accountName,
            legalName=message.legalName,
            message=message.message,
            reason=message.reason,
            loggedAt=ingest_time,
        )
        message_str = to_log.model_dump_json(indent=None)
        await self._log_data_manager.store_log(message_str)
        return SUSuccessData(loggedAt=ingest_time)

    @override
    async def get_settings(self) -> SUSettingsData:
        settings = self._settings_store.get_settings()
        return SUSettingsData(
            requireReasonForInteraction=settings.requireReasonForInteraction,
            minLengthOfReasonForInteraction=settings.minLengthOfReasonForInteraction,
        )

    @override
    async def store_robot_log(self, robot_log_file: TextIO) -> StoreRobotLogSuccessData:
        raise RuntimeError(
            "Should not be calling store robot log from audit server directly"
        )

    @override
    async def get_logging_enabled(self) -> GetLoggingEnabledData:
        return GetLoggingEnabledData(
            loggingEnabled=self._settings_store.get_logging_enabled()
        )

    @override
    async def set_logging_enabled(
        self, setting: SUEnabledRequestData
    ) -> SUEnabledResponseData:
        """Enable or disable logging."""
        raise NotImplementedError("Do not use the self client for this")

    @override
    async def get_current_log_period(self) -> SULogPeriodsData | None:
        log_periods = self._log_data_manager.get_log_periods()
        for log_period in log_periods:
            if log_period.endedAt is None:
                return SULogPeriodsData(
                    id=log_period.id,
                    startedAt=log_period.startedAt,
                    endedAt=log_period.endedAt,
                )
        return None
