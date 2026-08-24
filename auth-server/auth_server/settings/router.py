from textwrap import dedent
from typing import Annotated

import fastapi

from server_utils.audit.audit_server import (
    Client as AuditClient,
)
from server_utils.audit.audit_server import (
    PatchLoggingEnabledRequestData,
)
from server_utils.audit.fastapi import (
    get_audit_client,
    get_audit_logger,
    get_supplied_user_notes,
)
from server_utils.auth.resource_server.fastapi import (
    RequireAuthenticationResult,
    require_authentication,
    require_scopes,
)
from server_utils.auth.resource_server.types import AuthenticatedResult
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import (
    RequestModel,
    SimpleBody,
)

from .models import (
    AUTH_SERVER_AUDIT_SYSTEM_FULLNAME,
    AUTH_SERVER_AUDIT_SYSTEM_NAME,
    AccessControlResponseData,
    PatchSettingsRequestData,
    SettingsResponseData,
)
from .store import AccessControlAlreadySetError, SettingsStore, get_settings_store
from auth_server.oauth2.backend import Backend
from auth_server.oauth2.fastapi_dependencies import get_oauth2_backend
from auth_server.settings.models import PatchAccessControlRequestData
from auth_server.users.dependencies import get_user_store
from auth_server.users.store import UserStore

router = fastapi.APIRouter()


def _patch_enables_password_complexity(
    patch: PatchSettingsRequestData,
    current_settings: SettingsResponseData,
) -> bool:
    """Return whether a settings patch enables password complexity requirements."""
    patch_data = patch.model_dump(exclude_unset=True)

    if patch_data.get("passwordComplexitySpecialCharacters") is True:
        if current_settings.passwordComplexitySpecialCharacters is not True:
            return True

    if "passwordComplexityMinimumLength" in patch_data:
        new_min_length = patch_data["passwordComplexityMinimumLength"]
        current_min_length = current_settings.passwordComplexityMinimumLength
        if new_min_length is not None and (
            current_min_length is None or new_min_length > current_min_length
        ):
            return True

    return False


@router.get(
    "/auth/settings",
    summary="Get auth settings",
    description="Get the current authorization and authentication setings.",
)
async def get_settings(  # noqa: D103
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    settings = settings_store.get_settings()
    return SimpleBody.model_construct(data=settings)


@router.get(
    "/auth/settings/accessControlEnabled",
    summary="Get access control enabled settings",
    description="Get the current access control enabled settings.\
    This is seperated from the main settings endpoint because it is a special case that we do not want to change often.",
)
async def get_access_control_enabled_settings(  # noqa: D103
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[AccessControlResponseData]:
    accessControlEnabled = settings_store.get_access_control_settings()
    return SimpleBody.model_construct(data=accessControlEnabled)


@router.patch(
    "/auth/settings/accessControlEnabled",
    summary="Change access control enabled settings",
    description="Change the access control enabled settings.",
    dependencies=[
        fastapi.Depends(require_scopes(Scope.AUTH_SETTINGS_WRITE)),
        fastapi.Depends(get_audit_logger("update CRS enabled")),
    ],
)
async def patch_access_control_settings(  # noqa: D103
    request_body: RequestModel[PatchAccessControlRequestData],
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
    audit_client: Annotated[AuditClient, fastapi.Depends(get_audit_client)],
    authentication: Annotated[
        RequireAuthenticationResult, fastapi.Depends(require_authentication)
    ],
    user_notes: Annotated[str | None, fastapi.Depends(get_supplied_user_notes)],
) -> SimpleBody[AccessControlResponseData]:
    """Change the access control enabled settings."""
    try:
        accessControlResponseData = settings_store.patch_access_control(
            request_body.data
        )
    except AccessControlAlreadySetError:
        raise fastapi.HTTPException(
            status_code=422,
            detail="Access control enabled cannot be modified once enabled.",
        )
    if request_body.data.accessControlEnabled is not None:
        if isinstance(authentication, AuthenticatedResult):
            request = PatchLoggingEnabledRequestData(
                loggingEnabled=request_body.data.accessControlEnabled,
                accountName=authentication.username,
                legalName=authentication.fullname,
                reason=user_notes,
            )
        else:
            request = PatchLoggingEnabledRequestData(
                loggingEnabled=request_body.data.accessControlEnabled,
                accountName=AUTH_SERVER_AUDIT_SYSTEM_NAME,
                legalName=AUTH_SERVER_AUDIT_SYSTEM_FULLNAME,
                reason=None,
            )
        await audit_client.set_logging_enabled(request)
    return SimpleBody.model_construct(data=accessControlResponseData)


@router.patch(
    "/auth/settings",
    summary="Change auth settings",
    description=dedent("""\
        Change authorization and authentication settings.

        The new settings are returned.
        """),
    dependencies=[
        fastapi.Depends(require_scopes(Scope.AUTH_SETTINGS_WRITE)),
        fastapi.Depends(get_audit_logger("edit CRS settings")),
    ],
)
async def patch_settings(  # noqa: D103
    request_body: RequestModel[PatchSettingsRequestData],
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
    user_store: Annotated[UserStore, fastapi.Depends(get_user_store)],
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> SimpleBody[SettingsResponseData]:
    current_settings = settings_store.get_settings()
    new_settings = settings_store.patch_settings(request_body.data)
    if _patch_enables_password_complexity(request_body.data, current_settings):
        if (request_body.data.passwordComplexitySpecialCharacters is True or request_body.data.passwordComplexityMinimumLength is not None):
            user_store.mark_all_reset_password()
        oauth2_backend.revoke_all_tokens()
    return SimpleBody.model_construct(data=new_settings)


@router.delete(
    "/auth/settings",
    summary="Reset auth settings",
    description=dedent("""\
        Reset authorization and authentication settings to their defaults.

        The new settings are returned.
        """),
    dependencies=[
        fastapi.Depends(require_scopes(Scope.AUTH_SETTINGS_WRITE)),
        fastapi.Depends(get_audit_logger("reset CRS settings")),
    ],
)
async def delete_settings(  # noqa: D103
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    settings_store.reset_settings()
    new_settings = settings_store.get_settings()
    return SimpleBody.model_construct(data=new_settings)
