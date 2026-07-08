"""Tests for audit server."""

import datetime
from typing import Any, Callable

from audit_server.log_ingest.models import AuditLogMessage, SubmitAuditLogMessageData


class RecentTimestampMatcher:
    def __eq__(self, other: object) -> bool:
        return isinstance(other, datetime.datetime) and _loggedat_is_recent_utc_iso(
            other
        )


class LogPayloadMatcher:
    """Decoy matcher for capturing a message."""

    def __init__(
        self,
        message: SubmitAuditLogMessageData,
        loggedAt: Any,
        extra: Callable[[str], bool] | None = None,
    ) -> None:
        self._message = message
        self._loggedAt = loggedAt
        self._extra = extra

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, str):
            return False
        incoming = AuditLogMessage.model_validate_json(other)
        return (
            incoming.action == self._message.action
            and incoming.accountName == self._message.accountName
            and incoming.legalName == self._message.legalName
            and incoming.message == self._message.message
            and incoming.reason == self._message.reason
            and incoming.loggedAt == self._loggedAt
            and (self._extra(other) if self._extra else True)
        )


def _loggedat_is_recent_utc_iso(parsed: datetime.datetime) -> bool:
    """Assert ``value`` is an ISO-8601 UTC datetime near the current wall clock."""

    if parsed.tzinfo is None:
        return False
    if parsed.utcoffset() != datetime.timedelta(0):
        return False
    # The route stamps loggedAt at request handling time; allow a generous skew so
    # the test isn't flaky on slow CI.
    now = datetime.datetime.now(datetime.timezone.utc)
    if (now - parsed).total_seconds() > 60:
        return False
    return True
