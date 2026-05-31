"""Shared FastAPI dependencies for robot_server."""

from collections.abc import AsyncGenerator
from datetime import datetime
from typing import Annotated

from fastapi import Depends, Request

from server_utils.auth.resource_server.authorization_checker import (
    AuthorizationChecker,
    DocumentedInteraction,
)
from server_utils.auth.resource_server.fastapi import get_authorization_checker
from server_utils.fastapi_utils.documented_interaction import get_supplied_user_notes

from robot_server.service.dependencies import get_current_time

_MUTATING_HTTP_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


class AuditLogger:
    """Records documented interactions for audit when auth-server requires it."""

    def __init__(
        self,
        *,
        user_notes: str | None,
        created_at: datetime,
        authorization_checker: AuthorizationChecker,
    ) -> None:
        self._user_notes = user_notes
        self._created_at = created_at
        self._authorization_checker = authorization_checker
        self.did_log = False

    async def log(self, *, resource_id: str, request_data: object) -> None:
        """Record what was mutated. Must be called when audit is required for this request."""
        await _record_documented_interaction(
            resource_id=resource_id,
            request_data=request_data,
            user_notes=self._user_notes,
            created_at=self._created_at,
            authorization_checker=self._authorization_checker,
        )
        self.did_log = True


async def get_audit_logger(
    request: Request,
    user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
    created_at: Annotated[datetime, Depends(get_current_time)],
    authorization_checker: Annotated[
        AuthorizationChecker, Depends(get_authorization_checker)
    ],
) -> AsyncGenerator[AuditLogger, None]:
    """Yield an audit logger and ensure the route recorded the interaction when required."""
    audit_logger = AuditLogger(
        user_notes=user_notes,
        created_at=created_at,
        authorization_checker=authorization_checker,
    )
    yield audit_logger
    if request.method not in _MUTATING_HTTP_METHODS:
        return
    if (
        not audit_logger.did_log
        and await authorization_checker.is_reason_for_interaction_required()
    ):
        raise RuntimeError(
            "Internal error: the endpoint forgot to send anything to the audit log."
            " This is a server bug."
        )


async def _record_documented_interaction(
    *,
    resource_id: str,
    request_data: object,
    user_notes: str | None,
    created_at: datetime,
    authorization_checker: AuthorizationChecker,
) -> None:
    await authorization_checker.record_documented_interaction(
        DocumentedInteraction(user_notes=user_notes, request_data=request_data),
        resource_id=resource_id,
        recorded_at=created_at,
    )
