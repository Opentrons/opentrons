"""Modules routes."""
from fastapi import APIRouter, Depends, status
from typing import List, Dict

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import module_calibration
from opentrons.protocol_engine.types import Vec3f

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

from .module_models import AttachedModule, ModuleCalibrationData
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

    # Load any the module calibrations
    module_calibrations: Dict[str, module_calibration.ModuleCalibrationOffset] = {
        mod.module_id: mod for mod in module_calibration.load_all_module_calibrations()
    }

    response_data: List[AttachedModule] = []
    for mod in hardware.attached_modules:
        serial_number = mod.device_info["serial"]
        calibrated = module_calibrations.get(serial_number)
        module_identity = module_identifier.identify(mod.device_info)

        response_data.append(
            module_data_mapper.map_data(
                model=mod.model(),
                has_available_update=mod.has_available_update(),
                module_identity=module_identity,
                live_data=mod.live_data,
                usb_port=mod.usb_port,
                module_offset=ModuleCalibrationData.construct(
                    offset=Vec3f(
                        x=calibrated.offset.x,
                        y=calibrated.offset.y,
                        z=calibrated.offset.z,
                    ),
                    slot=calibrated.slot,
                    source=calibrated.status.source,
                    last_modified=calibrated.last_modified,
                )
                if calibrated
                else None,
            )
        )

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(
            data=response_data,
            meta=MultiBodyMeta(cursor=0, totalLength=len(response_data)),
        ),
        status_code=status.HTTP_200_OK,
    )
