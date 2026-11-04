"""FastAPI endpoint functions to implement `/accessControl/settings`."""

from typing import Annotated

import fastapi

from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
)

from .models import RequestData, ResponseData
from .store import AccessControlSettingStore, get_access_control_setting_store

router = LightRouter()
_PATH = "/accessControl/settings"


@PydanticResponse.wrap_route(
    router.get,
    path=_PATH,
    summary="Get current access control settings",
)
async def get_access_control_settings(  # noqa: D103
    store: Annotated[
        AccessControlSettingStore, fastapi.Depends(get_access_control_setting_store)
    ],
) -> PydanticResponse[SimpleBody[ResponseData]]:
    return await PydanticResponse.create(
        SimpleBody.model_construct(data=store.get_all())
    )


@PydanticResponse.wrap_route(
    router.patch,
    path=_PATH,
    summary="Set access control settings",
    dependencies=[fastapi.Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE))],
)
async def patch_access_control_settings(  # noqa: D103
    request_body: RequestModel[RequestData],
    store: Annotated[
        AccessControlSettingStore, fastapi.Depends(get_access_control_setting_store)
    ],
) -> PydanticResponse[SimpleBody[ResponseData]]:
    updated = store.patch(request_body.data)
    return await PydanticResponse.create(SimpleBody.model_construct(data=updated))


@PydanticResponse.wrap_route(
    router.delete,
    path=_PATH,
    summary="Reset access control settings to defaults",
    dependencies=[fastapi.Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE))],
)
async def delete_access_control_settings(  # noqa: D103
    store: Annotated[
        AccessControlSettingStore, fastapi.Depends(get_access_control_setting_store)
    ],
) -> PydanticResponse[SimpleBody[ResponseData]]:
    store.reset_all()
    return await PydanticResponse.create(
        SimpleBody.model_construct(data=store.get_all())
    )
