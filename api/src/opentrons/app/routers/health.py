import inspect

from fastapi import APIRouter, Depends
from opentrons import config, protocol_api
from opentrons.app.dependencies import get_hardware
from opentrons.hardware_control import HardwareAPILike
from opentrons.protocols.types import APIVersion
from opentrons.app.models.health import Health, Links
from opentrons import __version__
from opentrons.config import feature_flags

router = APIRouter()


@router.get("/health",
            response_model=Health,
            description="Retrieve some useful information about supported API "
                        "versions, names, and so on",
            summary="The /health endpoint is a good one to check to see if "
                    "you're communicating with an OT-2 with a properly booted "
                    "API server. If it returns OK, all is well. It also can be"
                    " used to pull information like the robot software version"
                    " and name.",
            response_description="OT-2 /health response")
async def get_health(
        hardware: HardwareAPILike = Depends(get_hardware)) -> Health:
    return Health(name=config.name(),
                  api_version=__version__,
                  fw_version=hardware.fw_version,
                  logs=['/logs/serial.log', '/logs/api.log'],
                  system_version=config.OT_SYSTEM_VERSION,
                  protocol_api_version=[protocol_api.MAX_SUPPORTED_VERSION],
                  links=Links(
                      apiLog='/logs/api.log',
                      serialLog='/logs/serial.log',
                      apiSpec="/openapi.json"
                  ))
