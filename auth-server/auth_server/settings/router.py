from textwrap import dedent
from typing import Annotated

import fastapi

from server_utils.fastapi_utils.models.json_api import (
    RequestModel,
    SimpleBody,
)

from .models import PatchSettingsRequestData, SettingsResponseData
from .store import SettingsStore, get_settings_store

router = fastapi.APIRouter()


@router.get(
    "/auth/settings",
    summary="Get auth settings",
    description="Get the current authorization and authentication setings.",
)
async def get_settings(  # noqa: D103
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    settings = store.get()
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
)
async def patch_settings(  # noqa: D103
    request_body: RequestModel[PatchSettingsRequestData],
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)]
) -> SimpleBody[SettingsResponseData]:
    store.patch(request_body.data)
    new_settings = store.get()
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
)
async def delete_settings(  # noqa: D103
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    store.reset()
    new_settings = store.get()
    return SimpleBody.model_construct(data=new_settings)
