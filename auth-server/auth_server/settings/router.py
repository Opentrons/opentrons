from textwrap import dedent
from typing import Annotated

import fastapi

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import (
    RequestModel,
    SimpleBody,
)

from .models import (
    AccessControlResponseData,
    PatchSettingsRequestData,
    SettingsResponseData,
)
from .store import AccessControlAlreadySetError, SettingsStore, get_settings_store
from auth_server.settings.models import PatchAccessControlRequestData

router = fastapi.APIRouter()


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
) -> SimpleBody[SettingsResponseData]:
    new_settings = settings_store.patch_settings(request_body.data)
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
