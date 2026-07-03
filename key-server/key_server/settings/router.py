from typing import Annotated

import fastapi

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
)

from .models import PatchSettingsRequestData, SettingsResponseData
from .store import SettingsStore, get_settings_store

router = fastapi.APIRouter()


@PydanticResponse.wrap_route(
    router.get,
    path="/keys/external/settings",
    summary="Get the key-server settings",
    responses={fastapi.status.HTTP_200_OK: {"model": SimpleBody[SettingsResponseData]}},
)
async def get_settings(
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> PydanticResponse[SimpleBody[SettingsResponseData]]:
    """Change the key-server settings."""
    settings = store.get()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(data=settings),
    )


@PydanticResponse.wrap_route(
    router.patch,
    path="/keys/external/settings",
    summary="Alter the key-server settings",
    responses={fastapi.status.HTTP_200_OK: {"model": SimpleBody[SettingsResponseData]}},
)
async def patch_settings(
    request_body: RequestModel[PatchSettingsRequestData],
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> PydanticResponse[SimpleBody[SettingsResponseData]]:
    """Change the key-server settings."""
    store.patch(request_body.data)
    new_settings = store.get()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(data=new_settings),
    )


@PydanticResponse.wrap_route(
    router.delete,
    path="/keys/external/settings",
    summary="Reset the key server settings to defaults",
    responses={fastapi.status.HTTP_200_OK: {"model": SimpleBody[SettingsResponseData]}},
)
async def delete_settings(
    store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> PydanticResponse[SimpleBody[SettingsResponseData]]:
    """Reset the key-server settings."""
    store.reset()
    new_settings = store.get()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody.model_construct(data=new_settings),
    )
