"""Route handlers for the audit-server settings endpoints.

The ``loggingEnabled`` setting is a special case with its own table and its own
internal-only routes under ``/audit/internal``. All other (generic) settings are
served under ``/audit/external``.
"""

from textwrap import dedent
from typing import Annotated

import fastapi

from server_utils.fastapi_utils.models.json_api import (
    RequestModel,
    SimpleBody,
)

from .models import (
    LoggingEnabledResponseData,
    PatchLoggingEnabledRequestData,
    PatchSettingsRequestData,
    SettingsResponseData,
)
from .store import SettingsStore, get_settings_store

router = fastapi.APIRouter()


@router.get(
    "/audit/internal/loggingEnabled",
    summary="Get the logging-enabled setting",
    description=dedent(
        """\
        Get the current logging-enabled setting.

        This is separated from the generic settings endpoints because it is a
        special case controlled through an internal-only API.
        """
    ),
)
async def get_logging_enabled_settings(  # noqa: D103
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[LoggingEnabledResponseData]:
    logging_enabled = settings_store.get_logging_enabled_settings()
    return SimpleBody.model_construct(data=logging_enabled)


@router.patch(
    "/audit/internal/loggingEnabled",
    summary="Change the logging-enabled setting",
    description="Enable or disable audit logging.",
)
async def patch_logging_enabled_settings(  # noqa: D103
    request_body: RequestModel[PatchLoggingEnabledRequestData],
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[LoggingEnabledResponseData]:
    logging_enabled = settings_store.patch_logging_enabled(request_body.data)
    return SimpleBody.model_construct(data=logging_enabled)


@router.get(
    "/audit/external/settings",
    summary="Get audit settings",
    description="Get the current audit-server settings.",
)
async def get_settings(  # noqa: D103
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    settings = settings_store.get_settings()
    return SimpleBody.model_construct(data=settings)


@router.patch(
    "/audit/external/settings",
    summary="Change audit settings",
    description=dedent(
        """\
        Change audit-server settings.

        Only fields present in the request body are updated. The new settings
        are returned.
        """
    ),
)
async def patch_settings(  # noqa: D103
    request_body: RequestModel[PatchSettingsRequestData],
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    new_settings = settings_store.patch_settings(request_body.data)
    return SimpleBody.model_construct(data=new_settings)


@router.delete(
    "/audit/external/settings",
    summary="Reset audit settings",
    description=dedent(
        """\
        Reset audit-server settings to their defaults.

        The new settings are returned.
        """
    ),
)
async def delete_settings(  # noqa: D103
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    new_settings = settings_store.reset_settings()
    return SimpleBody.model_construct(data=new_settings)
