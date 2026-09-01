"""Modules routes."""

from typing import Annotated, Dict, List

from fastapi import Depends, status

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import module_calibration
from opentrons.protocol_engine.types import Vec3f
from opentrons_shared_data.errors.exceptions import APIRemoved
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api import (
    MultiBodyMeta,
    PydanticResponse,
    SimpleMultiBody,
)

from .module_data_mapper import ModuleDataMapper
from .module_identifier import ModuleIdentifier
from .module_models import AttachedModule, ModuleCalibrationData
from robot_server.errors.error_responses import (
    LegacyErrorResponse,
)
from robot_server.hardware import get_hardware
from robot_server.versioning import get_requested_version

modules_router = LightRouter()


@PydanticResponse.wrap_route(
    modules_router.get,
    path="/modules",
    summary="Get attached modules.",
    description="Get a list of all modules currently attached to the robot.",
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[AttachedModule]},
    },
)
async def get_attached_modules(
    requested_version: Annotated[int, Depends(get_requested_version)],
    hardware: Annotated[HardwareControlAPI, Depends(get_hardware)],
    module_identifier: Annotated[ModuleIdentifier, Depends(ModuleIdentifier)],
    module_data_mapper: Annotated[ModuleDataMapper, Depends(ModuleDataMapper)],
) -> PydanticResponse[SimpleMultiBody[AttachedModule]]:
    """Get a list of all attached modules."""
    if requested_version <= 2:
        raise LegacyErrorResponse.from_exc(
            APIRemoved(
                api_element="/modules v2",
                current_version="3",
                extra_message="The V2 response of GET /modules has been removed. Set the header opentrons-api-version: 3 to get the V3 response.",
            )
        ).as_error(status.HTTP_410_GONE)

    # Load any the module calibrations
    module_calibrations: Dict[str, module_calibration.ModuleCalibrationOffset] = {
        mod.module_id: mod for mod in module_calibration.load_all_module_calibrations()
    }

    response_data: List[AttachedModule] = []
    for mod in await hardware.get_attached_modules():
        device_summary = await mod.get_state_summary()
        serial_number = device_summary.device_info["serial"]
        calibrated = module_calibrations.get(serial_number)
        module_identity = module_identifier.identify(device_summary.device_info)

        response_data.append(
            module_data_mapper.map_data(
                model=device_summary.model,
                has_available_update=device_summary.has_available_update,
                module_identity=module_identity,
                live_data=device_summary.live_data,
                usb_port=device_summary.usb_port,
                module_offset=(
                    ModuleCalibrationData.model_construct(
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
                    else None
                ),
            )
        )

    return await PydanticResponse.create(
        content=SimpleMultiBody.model_construct(
            data=response_data,
            meta=MultiBodyMeta(cursor=0, totalLength=len(response_data)),
        ),
        status_code=status.HTTP_200_OK,
    )
