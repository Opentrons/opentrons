import inspect

from fastapi import APIRouter, Depends
from opentrons import config, protocol_api
from opentrons.hardware_control import HardwareAPILike
from opentrons.protocols.types import APIVersion
from opentrons import __version__
from opentrons.config import feature_flags
from robot_server.service.models.health import Health, Links
from robot_server.service.dependencies import get_hardware

router = APIRouter()


@router.get("/health",
            response_model=Health,
            description="Retrieve some useful information about supported API "
                        "versions, names, and so on",
            summary="The /health endpoint is a good one to check to see if "
                    "you're communicating with an OT-2 with a properly booted "
                    "API server. If it returns OK, all is well. It also can "
                    "be used to pull information like the robot software "
                    "version and name.",
            response_description="OT-2 /health response")
async def get_health(
        hardware: HardwareAPILike = Depends(get_hardware)) -> Health:
    static_paths = ['/logs/serial.log', '/logs/api.log']
    # This conditional handles the case where we have just changed the
    # use protocol api v2 feature flag, so it does not match the type
    # of hardware we're actually using.
    fw_version = hardware.fw_version  # type: ignore
    if inspect.isawaitable(fw_version):
        fw_version = await fw_version

    if feature_flags.use_protocol_api_v2():
        max_supported = protocol_api.MAX_SUPPORTED_VERSION
    else:
        max_supported = APIVersion(1, 0)

    return Health(name=config.name(),
                  api_version=__version__,
                  fw_version=fw_version,
                  logs=static_paths,
                  system_version=config.OT_SYSTEM_VERSION,
                  protocol_api_version=list(max_supported),
                  links=Links(
                      apiLog='/logs/api.log',
                      serialLog='/logs/serial.log',
                      apiSpec="/openapi.json"
                  ))
