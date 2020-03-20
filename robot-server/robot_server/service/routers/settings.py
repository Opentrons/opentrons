import logging
from http import HTTPStatus
from fastapi import APIRouter, HTTPException

from opentrons.system import log_control

from robot_server.service.models import V1BasicResponse
from robot_server.service.exceptions import V1HandlerError
from robot_server.service.models.settings import AdvancedSettings, LogLevel, \
    FactoryResetOptions, FactoryResetCommands, PipetteSettings, \
    PipetteSettingsUpdate, RobotConfigs, MultiPipetteSettings

log = logging.getLogger(__name__)

router = APIRouter()


@router.post("/settings",
             description="Change an advanced setting (feature flag)",
             response_model=AdvancedSettings)
async def post_settings() -> AdvancedSettings:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/settings",
            description="Get a list of available advanced settings (feature "
                        "flags) and their values",
            response_model=AdvancedSettings)
async def get_settings() -> AdvancedSettings:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/settings/log_level/local",
             description="Set the minimum level of logs saved locally",
             response_model=V1BasicResponse)
async def post_log_level_local(log_level: LogLevel) -> V1BasicResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/settings/log_level/upstream",
             description="Set the minimum level of logs sent upstream via"
                         " syslog-ng to Opentrons. Only available on"
                         " a real robot.",
             response_model=V1BasicResponse)
async def post_log_level_upstream(log_level: LogLevel) -> V1BasicResponse:
    log_level_value = log_level.log_level
    log_level_name = None if log_level_value is None else log_level_value.name
    ok_syslogs = {
        "error": "err",
        "warning": "warning",
        "info": "info",
        "debug": "debug"
    }

    syslog_level = "emerg"
    if log_level_name is not None:
        syslog_level = ok_syslogs[log_level_name]

    code, stdout, stderr = await log_control.set_syslog_level(syslog_level)

    if code != 0:
        msg = f"Could not reload config: {stdout} {stderr}"
        log.error(msg)
        raise V1HandlerError(status_code=500, message=msg)

    if log_level_name:
        result = f"Upstreaming log level changed to {log_level_name}"
        getattr(log, log_level_name)(result)
    else:
        result = "Upstreaming logs disabled"
        log.info(result)

    return V1BasicResponse(status=200, message=result)


@router.get("/settings/reset/options",
            description="Get the settings that can be reset as part of "
                        "factory reset",
            response_model=FactoryResetOptions)
async def get_settings_reset_options() -> FactoryResetOptions:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/settings/reset",
             description="Perform a factory reset of some robot data")
async def post_settings_reset_options(
        factory_reset_commands: FactoryResetCommands):  # type: ignore
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/settings/robot",
            description="Get the current robot config",
            response_model=RobotConfigs)
async def get_robot_settings() -> RobotConfigs:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/settings/pipettes",
            description="List all settings for all known pipettes by id",
            response_model=MultiPipetteSettings)
async def get_pipette_settings() -> MultiPipetteSettings:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/settings/pipettes/{pipetteId}",
            description="Get the settings of a specific pipette by ID",
            response_model=PipetteSettings)
async def get_pipette_setting(pipette_id: str) -> PipetteSettings:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.patch("/settings/pipettes/{pipetteId}",
              description="Change the settings of a specific pipette",
              response_model=PipetteSettings)
async def post_pipette_setting(
        pipette_id: str,
        settings_update: PipetteSettingsUpdate) \
        -> PipetteSettings:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")
