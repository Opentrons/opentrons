"""Attach an audit logger when a mutating request is about to be rejected."""

from __future__ import annotations

import urllib
from typing import Final

from starlette.requests import Request

from .audit_logger import AuditLogger
from .audit_server import Client
from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
)
from server_utils.fastapi_utils.app_state import AppStateAccessor

# Must match the key used by install_audit_client in server_utils.audit.fastapi.
_audit_client_accessor = AppStateAccessor[Client]("audit_client")

_MUTATING_HTTP_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})
_USER_NOTES_HEADER: Final = "Opentrons-User-Notes"
PERMISSION_DENIED_MESSAGE: Final = "Permission denied: insufficient scope"


def attach_permission_denied_audit_logger(
    request: Request,
    authentication: AuthenticatedResult | AuthenticationNotRequiredResult,
) -> None:
    """Attach a fallback AuditLogger for an authenticated mutating request that will be denied.

    No-op for non-mutating methods, unauthenticated results, a missing audit client,
    or when an AuditLogger is already present on the request.
    """
    if request.method not in _MUTATING_HTTP_METHODS:
        return
    if not isinstance(authentication, AuthenticatedResult):
        return
    existing = getattr(request.state, "audit_logger", None)
    if isinstance(existing, AuditLogger):
        return
    audit_client = _audit_client_accessor.get_from(request.app.state)
    if audit_client is None:
        return

    audit_logger = AuditLogger(
        audit_client=audit_client,
        auto_log_request_head=True,
        auto_log_response_head=True,
        auto_log_request_body=True,
        auto_log_response_body=True,
        auto_log_request_full_headers=False,
        request=request,
    )
    audit_logger.set_action_from_request(request)
    audit_logger.set_auth_details(authentication)
    audit_logger.set_user_note(_peek_user_notes_header(request))
    audit_logger.append_message_chunk(PERMISSION_DENIED_MESSAGE)
    request.state.audit_logger = audit_logger


def _peek_user_notes_header(request: Request) -> str | None:
    """Read `Opentrons-User-Notes` without enforcing presence or length."""
    raw = request.headers.get(_USER_NOTES_HEADER)
    if raw is None:
        return None
    try:
        decoded = urllib.parse.unquote(raw).strip()
    except Exception:
        return None
    return decoded or None
