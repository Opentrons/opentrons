"""server_utils.audit.audit_server.Client implementation for local log storage."""

import datetime
from typing import override

from server_utils.audit.audit_server import (
    Client as SUClient,
)
from server_utils.audit.audit_server import (
    SubmitAuditLogMessageData as SUSubmitData,
)
from server_utils.audit.audit_server import (
    SubmitAuditLogSuccessData as SUSuccessData,
)

from .log_ingest.models import AuditLogMessage
from audit_server.log_storage.log_data_manager import LogDataManager


class LocalClient(SUClient):
    """An 'audit client' that provides direct access to the log data manager."""

    def __init__(self, log_data_manager: LogDataManager) -> None:
        """Build the LocalClient and provide the log data manager."""
        self._log_data_manager = log_data_manager

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
