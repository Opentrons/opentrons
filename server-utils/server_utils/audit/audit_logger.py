"""A client wrapper for doing audit logs."""

from .audit_server import Client as AuditClient
from .audit_server import SubmitAuditLogMessageData
from server_utils.auth.resource_server.authorization_checker import (
    AuthorizedResult,
)


class AuditLogger:
    """An interface to submit audit logs."""

    def __init__(self, audit_client: AuditClient) -> None:
        """Build an audit logger around an audit server client."""
        self._audit_client = audit_client

    async def log(
        self,
        *,
        auth_details: AuthorizedResult,
        action: str,
        message: str,
        reason: str | None,
    ) -> None:
        """Submit an audit log message.

        If this method raises, the audit log failed and the caller must forward the error to the user
        - actions may not continue if they were not logged.

        The action may be any string, but should be something terse and unique to the callsite.

        The message must be human readable, but should contain enough details of the action that a
        human can understand what occurred based on the log.

        If the caller has already fetched full user details, this form of logging may be helpful; it
        does not fetch any further information from the auth server. Otherwise, log_as_current_user may be better.
        """
        await self._audit_client.submit_log_message(
            SubmitAuditLogMessageData(
                action=action,
                accountName=auth_details.username,
                legalName=auth_details.fullname,
                message=message,
                reason=reason,
            )
        )
