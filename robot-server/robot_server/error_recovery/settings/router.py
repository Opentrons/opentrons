"""FastAPI endpoint functions to implement `/errorRecovery/settings`."""


from typing import Annotated

import fastapi

from robot_server.service.json_api import PydanticResponse, RequestModel, SimpleBody
from .models import RequestData, ResponseData
from .store import ErrorRecoverySettingStore, get_error_recovery_setting_store


router = fastapi.APIRouter()
_PATH = "/errorRecovery/settings"


@PydanticResponse.wrap_route(
    router.get,
    path=_PATH,
    summary="Get current error recovery settings",
)
async def get_error_recovery_settings(  # noqa: D103
    store: Annotated[
        ErrorRecoverySettingStore, fastapi.Depends(get_error_recovery_setting_store)
    ]
) -> PydanticResponse[SimpleBody[ResponseData]]:
    return await _get_current_response(store)


@PydanticResponse.wrap_route(
    router.patch,
    path=_PATH,
    summary="Set error recovery settings",
)
async def patch_error_recovery_settings(  # noqa: D103
    request_body: RequestModel[RequestData],
    store: Annotated[
        ErrorRecoverySettingStore, fastapi.Depends(get_error_recovery_setting_store)
    ],
) -> PydanticResponse[SimpleBody[ResponseData]]:
    store.set_is_disabled(is_disabled=not request_body.data.enabled)
    return await _get_current_response(store)


@PydanticResponse.wrap_route(
    router.delete,
    path=_PATH,
    summary="Reset error recovery settings to defaults",
)
async def delete_error_recovery_settings(  # noqa: D103
    store: Annotated[
        ErrorRecoverySettingStore, fastapi.Depends(get_error_recovery_setting_store)
    ],
) -> PydanticResponse[SimpleBody[ResponseData]]:
    store.set_is_disabled(None)
    return await _get_current_response(store)


async def _get_current_response(
    store: ErrorRecoverySettingStore,
) -> PydanticResponse[SimpleBody[ResponseData]]:
    is_enabled = not store.get_is_disabled()
    return await PydanticResponse.create(
        SimpleBody.construct(data=ResponseData.construct(enabled=is_enabled))
    )
