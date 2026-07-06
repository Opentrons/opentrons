"""Tests for audit server."""

import datetime
from typing import Any, Callable

from audit_server.log_ingest.models import AuditLogMessage, SubmitAuditLogMessageData


class RecentTimestampMatcher:
    def __eq__(self, other: object) -> bool:
        assert isinstance(other, datetime.datetime)
        return bool(_assert_loggedat_is_recent_utc_iso(other))


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
        assert isinstance(other, str)
        incoming = AuditLogMessage.model_validate_json(other)
        assert incoming.action == self._message.action
        assert incoming.accountName == self._message.accountName
        assert incoming.legalName == self._message.legalName
        assert incoming.message == self._message.message
        assert incoming.reason == self._message.reason
        assert incoming.loggedAt == self._loggedAt
        if self._extra:
            self._extra(other)
        return True


def _assert_loggedat_is_recent_utc_iso(parsed: datetime.datetime) -> datetime.datetime:
    """Assert ``value`` is an ISO-8601 UTC datetime near the current wall clock."""

    assert parsed.tzinfo is not None, f"loggedAt {parsed!r} must include tz info"
    assert parsed.utcoffset() == datetime.timedelta(0), (
        f"loggedAt {parsed!r} must be UTC"
    )
    # The route stamps loggedAt at request handling time; allow a generous skew so
    # the test isn't flaky on slow CI.
    now = datetime.datetime.now(datetime.timezone.utc)
    assert abs((now - parsed).total_seconds()) < 60, (
        f"loggedAt {parsed!r} is too far from now {now.isoformat()}"
    )
    return parsed
