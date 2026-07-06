"""Route handlers for the audit-server settings endpoints.

The ``loggingEnabled`` setting is a special case with its own table and its own
internal-only routes under ``/audit/internal``. All other (generic) settings are
served under ``/audit/external``.
"""

import datetime
from textwrap import dedent
from typing import Annotated

import fastapi

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
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
from audit_server.log_ingest.models import AuditLogMessage
from audit_server.log_storage.dependency import get_log_data_manager
from audit_server.log_storage.log_data_manager import LogDataManager

router = fastapi.APIRouter()

MESSAGE_LOG_ENABLE = "Logging was enabled."
MESSAGE_LOG_DISABLE = "Logging was disabled."
ACTION_LOG_ENABLE = "log-enable"
ACTION_LOG_DISABLE = "log-disable"


@PydanticResponse.wrap_route(
    router.get,
    path="/audit/internal/loggingEnabled",
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
) -> PydanticResponse[SimpleBody[LoggingEnabledResponseData]]:
    logging_enabled = settings_store.get_logging_enabled()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(
            data=LoggingEnabledResponseData(loggingEnabled=logging_enabled)
        ),
    )


@PydanticResponse.wrap_route(
    router.patch,
    path="/audit/internal/loggingEnabled",
    summary="Change the logging-enabled setting",
    description="Enable or disable audit logging.",
)
async def patch_logging_enabled_settings(  # noqa: D103
    request_body: RequestModel[PatchLoggingEnabledRequestData],
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
) -> PydanticResponse[SimpleBody[LoggingEnabledResponseData]]:
    was_logging_enabled = settings_store.get_logging_enabled()
    if was_logging_enabled and not request_body.data.loggingEnabled:
        message = AuditLogMessage(
            action=ACTION_LOG_DISABLE,
            accountName=request_body.data.accountName,
            legalName=request_body.data.legalName,
            message=MESSAGE_LOG_DISABLE,
            reason=request_body.data.reason,
            loggedAt=datetime.datetime.now(datetime.timezone.utc),
        )
        await log_data_manager.store_log(message.model_dump_json(indent=None))
    is_logging_enabled = settings_store.patch_logging_enabled(
        request_body.data.loggingEnabled
    )
    if is_logging_enabled and not was_logging_enabled:
        await log_data_manager.rotate_periods()
        message = AuditLogMessage(
            action=ACTION_LOG_ENABLE,
            accountName=request_body.data.accountName,
            legalName=request_body.data.legalName,
            message=MESSAGE_LOG_ENABLE,
            reason=request_body.data.reason,
            loggedAt=datetime.datetime.now(datetime.timezone.utc),
        )
        await log_data_manager.store_log(message.model_dump_json(indent=None))

    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(
            data=LoggingEnabledResponseData(loggingEnabled=is_logging_enabled)
        ),
    )


@PydanticResponse.wrap_route(
    router.get,
    path="/audit/external/settings",
    summary="Get audit settings",
    description="Get the current audit-server settings.",
)
async def get_settings(  # noqa: D103
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> PydanticResponse[SimpleBody[SettingsResponseData]]:
    settings = settings_store.get_settings()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(data=settings),
    )


@PydanticResponse.wrap_route(
    router.patch,
    path="/audit/external/settings",
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
) -> PydanticResponse[SimpleBody[SettingsResponseData]]:
    new_settings = settings_store.patch_settings(request_body.data)
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(data=new_settings),
    )


@PydanticResponse.wrap_route(
    router.delete,
    path="/audit/external/settings",
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
) -> PydanticResponse[SimpleBody[SettingsResponseData]]:
    new_settings = settings_store.reset_settings()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(data=new_settings),
    )
