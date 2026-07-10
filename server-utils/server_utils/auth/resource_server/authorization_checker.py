"""Interfaces that endpoints can use to check whether an HTTP client is authorized to do something.

This module should be framework-agnostic, not tied to FastAPI or whatever.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Generic, TypeAlias, TypeVar, override

from ..scopes import Scope, parse_scopes
from .auth_server import (
    Client as AuthServerClient,
)
from .auth_server import (
    RequireReasonForInteractionSettingsResponse,
    RequireReasonForInteractionSettingsResponseData,
)
from server_utils.fastapi_utils.models.json_api import RequestModel

_log = logging.getLogger(__name__)

RequestDataT = TypeVar("RequestDataT")


@dataclass(frozen=True)
class DocumentedInteraction(Generic[RequestDataT]):
    """An interaction that may require audit user notes alongside request payload data."""

    user_notes: str | None
    request_data: RequestDataT

    @staticmethod
    def from_request_model(
        request: RequestModel[RequestDataT],
        *,
        user_notes: str | None,
    ) -> DocumentedInteraction[RequestDataT]:
        """Build from request payload data and audit notes from the request header."""
        return DocumentedInteraction(
            user_notes=user_notes,
            request_data=request.data,
        )


class MissingUserNotesError(Exception):
    """Raised when user notes are required for an interaction but were not supplied."""


class AuthorizationChecker(ABC):
    """An interface to check whether an HTTP client is authorized to do something."""

    @abstractmethod
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        """Check whether an HTTP request is authorized.

        Params:
            token: The OAuth 2 access token carried by the request,
                or `None` if it didn't carry such a token.

            required_scopes: The authorization scopes to check against. The request
                passes if the token is authorized for all of these.
        """
        pass

    @abstractmethod
    async def get_require_reason_for_interaction_settings(
        self,
    ) -> RequireReasonForInteractionSettingsResponse:
        """Return require-reason-for-interaction settings."""
        pass

    async def is_reason_for_interaction_required(self) -> bool:
        """Return whether auth-server requires a reason for interaction."""
        settings = await self.get_require_reason_for_interaction_settings()
        return settings.data.requireReasonForInteraction

    async def record_documented_interaction(
        self,
        interaction: DocumentedInteraction[RequestDataT],
        *,
        resource_id: str,
        recorded_at: datetime,
        require_reason_for_interaction: bool | None = None,
    ) -> None:
        """When required, validate ``user_notes`` and record the interaction for audit.

        Params:
            require_reason_for_interaction: When ``None``, read from auth-server
                settings via ``is_reason_for_interaction_required()``. Callers
                that already resolved the setting locally may pass an explicit value.
        """
        if require_reason_for_interaction is None:
            require_reason_for_interaction = (
                await self.is_reason_for_interaction_required()
            )
        if not require_reason_for_interaction:
            return

        if interaction.user_notes is None:
            raise MissingUserNotesError(
                "Opentrons-User-Notes is required when require-reason-for-interaction is enabled."
            )

        self._log_documented_interaction(
            interaction=interaction,
            resource_id=resource_id,
            recorded_at=recorded_at,
        )

    def _log_documented_interaction(
        self,
        *,
        interaction: DocumentedInteraction[RequestDataT],
        resource_id: str,
        recorded_at: datetime,
    ) -> None:
        """Log (and later persist) a documented interaction."""
        # TODO(TZ, 5-8-26): persist audit entry in auth-server.
        request_data = interaction.request_data
        if hasattr(request_data, "model_dump"):
            request_data_summary = request_data.model_dump()
        else:
            request_data_summary = repr(request_data)

        _log.info(
            "Documented interaction "
            "(persist audit entry TODO): resource_id=%s recorded_at=%s "
            "note_len=%s request_data=%s",
            resource_id,
            recorded_at.isoformat(),
            len(interaction.user_notes or ""),
            request_data_summary,
        )


class AlwaysAllowedAuthorizationChecker(AuthorizationChecker):
    """An `AuthorizationChecker` that always allows access."""

    @override
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        """See base class for documentation."""
        return AuthorizationNotRequiredResult()

    @override
    async def get_require_reason_for_interaction_settings(
        self,
    ) -> RequireReasonForInteractionSettingsResponse:
        """Require-reason is disabled when access control is not configured."""
        return RequireReasonForInteractionSettingsResponse(
            data=RequireReasonForInteractionSettingsResponseData(
                requireReasonForInteraction=False
            )
        )


class AuthServerAuthorizationChecker(AuthorizationChecker):
    """An `AuthorizationChecker` that queries auth-server to check authorization."""

    def __init__(self, client: AuthServerClient) -> None:
        self._client = client

    @override
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        """See base class for documentation."""
        if token is None:
            # The client is trying to access a protected resource without providing a token.
            # We allow this if and only if access control is disabled.
            access_control_enabled = (
                await self._client.get_auth_settings()
            ).data.accessControlEnabled
            if access_control_enabled:
                return MissingTokenResult()
            else:
                return AuthorizationNotRequiredResult()

        else:
            token_info = await self._client.introspect_token(token)

            provided_scopes = parse_scopes(token_info.scope)
            missing_scopes = required_scopes - provided_scopes

            if not token_info.active:
                return NotAnActiveTokenResult()
            elif missing_scopes:
                return InsufficientScopeResult(provided_scopes)
            elif token_info.username is None:
                # This should never happen in practice. Although token_info.username is
                # optional according to the OAuth 2 specs, our implementation in
                # auth-server should always return it.
                raise RuntimeError(
                    "Username not present in token introspection response."
                    " This is a bug in auth-server."
                )
            elif token_info.ot_fullname is None:
                # Similarly, our custom fullname field should be returned always.
                raise RuntimeError(
                    "Fullname not present in token introspection response."
                    " This is a bug in auth-server."
                )
            else:
                return AuthorizedResult(
                    username=token_info.username, fullname=token_info.ot_fullname
                )

    @override
    async def is_reason_for_interaction_required(self) -> bool:
        """Require reason only when access control (ACM) is on and the setting is enabled."""
        access_control_enabled = (
            await self._client.get_auth_settings()
        ).data.accessControlEnabled
        if not access_control_enabled:
            return False
        settings = await self.get_require_reason_for_interaction_settings()
        return settings.data.requireReasonForInteraction

    @override
    async def get_require_reason_for_interaction_settings(
        self,
    ) -> RequireReasonForInteractionSettingsResponse:
        return await self._client.get_require_reason_for_interaction_settings()


@dataclass
class AuthorizationNotRequiredResult:
    """Authorization was neither provided nor required--access control mode is disabled."""

    pass


@dataclass
class AuthorizedResult:
    """The request is authorized with a valid access token."""

    username: str
    fullname: str
    """The user who issued the request."""


@dataclass
class InsufficientScopeResult:
    """The provided access token is valid, but it isn't authorized with all the required scopes."""

    provided_scopes: set[Scope]
    """The scopes carried by the access token."""


@dataclass
class MissingTokenResult:
    """No access token was provided."""

    pass


@dataclass
class NotAnActiveTokenResult:
    """The provided access token is expired, or was never valid to begin with."""

    pass


Result: TypeAlias = (
    AuthorizationNotRequiredResult
    | AuthorizedResult
    | InsufficientScopeResult
    | MissingTokenResult
    | NotAnActiveTokenResult
)
