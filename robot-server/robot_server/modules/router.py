"""Modules routes."""
from fastapi import APIRouter, Depends, status
from typing import List

from opentrons.hardware_control import HardwareControlAPI

from robot_server.hardware import get_hardware
from robot_server.versioning import get_requested_version
from robot_server.service.legacy.routers.modules import (
    get_modules as legacy_get_attached_modules,
)
from robot_server.service.json_api import (
    SimpleMultiBody,
    MultiBodyMeta,
    PydanticResponse,
)

from .module_models import AttachedModule
from .module_identifier import ModuleIdentifier
from .module_data_mapper import ModuleDataMapper

modules_router = APIRouter()


@modules_router.get(
    path="/modules",
    summary="Get attached modules.",
    description="Get a list of all modules currently attached to the robot.",
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[AttachedModule]},
    },
)
async def get_attached_modules(
    requested_version: int = Depends(get_requested_version),
    hardware: HardwareControlAPI = Depends(get_hardware),
    module_identifier: ModuleIdentifier = Depends(ModuleIdentifier),
    module_data_mapper: ModuleDataMapper = Depends(ModuleDataMapper),
) -> PydanticResponse[SimpleMultiBody[AttachedModule]]:
    """Get a list of all attached modules."""
    if requested_version <= 2:
        return await legacy_get_attached_modules(  # type: ignore[return-value]
            hardware=hardware,
        )

    response_data: List[AttachedModule] = []
    for mod in hardware.attached_modules:
        module_identity = module_identifier.identify(mod.device_info)
        response_data.append(
            module_data_mapper.map_data(
                model=mod.model(),
                has_available_update=mod.has_available_update(),
                module_identity=module_identity,
                live_data=mod.live_data,
                usb_port=mod.usb_port,
            )
        )

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(
            data=response_data,
            meta=MultiBodyMeta(cursor=0, totalLength=len(response_data)),
        ),
        status_code=status.HTTP_200_OK,
    )
