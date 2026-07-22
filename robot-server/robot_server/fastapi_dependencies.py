"""Shared FastAPI dependencies for robot_server."""

from collections.abc import AsyncGenerator
from datetime import datetime
from logging import getLogger
from typing import Annotated

from fastapi import Depends, Request

from server_utils.audit.audit_logger import AuditLogger as AuditServerLogger
from server_utils.audit.audit_server import Client as AuditClient
from server_utils.audit.fastapi import get_audit_client
from server_utils.fastapi_utils.documented_interaction import get_supplied_user_notes

from robot_server.service.dependencies import get_current_time

_MUTATING_HTTP_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})

_LOG = getLogger(__name__)


class AuditLogger:
    """Records documented interactions for audit when auth-server requires it."""

    def __init__(
        self,
        *,
        user_notes: str | None,
        created_at: datetime,
        audit_server_logger: AuditServerLogger,
    ) -> None:
        self._audit_server_logger = audit_server_logger
        self._user_notes = user_notes
        self._created_at = created_at
        self.did_log = False

    async def log(self, *, resource_id: str, request_data: object) -> None:
        """Record what was mutated. Must be called when audit is required for this request."""
        # TODO: Actually log things.
        # await self._audit_server_logger.log()
        _LOG.info(
            f"Audit log: ${resource_id} ${request_data} ${self._user_notes} at ${self._created_at}"
        )
        self.did_log = True


async def get_audit_logger(
    request: Request,
    user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
    created_at: Annotated[datetime, Depends(get_current_time)],
    audit_client: Annotated[AuditClient, Depends(get_audit_client)],
) -> AsyncGenerator[AuditLogger, None]:
    """Yield an audit logger and ensure the route recorded the interaction when required."""
    audit_logger = AuditLogger(
        user_notes=user_notes,
        created_at=created_at,
        audit_server_logger=AuditServerLogger(audit_client=audit_client),
    )
    yield audit_logger
    if request.method not in _MUTATING_HTTP_METHODS:
        return
    if not audit_logger.did_log:
        raise RuntimeError(
            "Internal error: the endpoint forgot to send anything to the audit log."
            " This is a server bug."
        )
