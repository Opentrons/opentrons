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
    "/settings",
)
async def get_settings(
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    """Change the key-server settings."""
    settings = store.get()
    return SimpleBody.model_construct(data=settings)


@router.patch(
    "/settings",
)
async def patch_settings(
    request_body: RequestModel[PatchSettingsRequestData],
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    """Change the key-server settings."""
    store.patch(request_body.data)
    new_settings = store.get()
    return SimpleBody.model_construct(data=new_settings)


@router.delete(
    "/settings",
)
async def delete_settings(
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SimpleBody[SettingsResponseData]:
    """Reset the key-server settings."""
    store.reset()
    new_settings = store.get()
    return SimpleBody.model_construct(data=new_settings)
