from textwrap import dedent
from typing import Annotated

import fastapi

from server_utils.auth.resource_server.fastapi_dependencies import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import (
    RequestModel,
    SimpleBody,
)

from .models import PatchSettingsRequestData, SettingsResponseData
from .settings_data_manager import SettingsDataManager, get_settings_data_manager

router = fastapi.APIRouter()


@router.get(
    "/auth/settings",
    summary="Get auth settings",
    description="Get the current authorization and authentication setings.",
)
async def get_settings(  # noqa: D103
    settings_data_manager: Annotated[
        SettingsDataManager, fastapi.Depends(get_settings_data_manager)
    ],
) -> SimpleBody[SettingsResponseData]:
    settings = settings_data_manager.get()
    return SimpleBody.model_construct(data=settings)


@router.patch(
    "/auth/settings",
    summary="Change auth settings",
    description=dedent(
        """\
        Change authorization and authentication settings.

        The new settings are returned.
        """
    ),
    dependencies=[fastapi.Depends(require_scopes(Scope.AUTH_SETTINGS_WRITE))],
)
async def patch_settings(  # noqa: D103
    request_body: RequestModel[PatchSettingsRequestData],
    settings_data_manager: Annotated[
        SettingsDataManager, fastapi.Depends(get_settings_data_manager)
    ],
) -> SimpleBody[SettingsResponseData]:
    settings_data_manager.patch(request_body.data)
    new_settings = settings_data_manager.get()
    return SimpleBody.model_construct(data=new_settings)


@router.delete(
    "/auth/settings",
    summary="Reset auth settings",
    description=dedent(
        """\
        Reset authorization and authentication settings to their defaults.

        The new settings are returned.
        """
    ),
    dependencies=[fastapi.Depends(require_scopes(Scope.AUTH_SETTINGS_WRITE))],
)
async def delete_settings(  # noqa: D103
    settings_data_manager: Annotated[
        SettingsDataManager, fastapi.Depends(get_settings_data_manager)
    ],
) -> SimpleBody[SettingsResponseData]:
    settings_data_manager.reset()
    new_settings = settings_data_manager.get()
    return SimpleBody.model_construct(data=new_settings)
