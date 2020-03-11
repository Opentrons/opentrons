from http import HTTPStatus
from fastapi import APIRouter, HTTPException, Query

from robot_server.service.models import V1ErrorMessage
from robot_server.service.models.settings import AdvancedSettings, LogLevel, \
    FactoryResetOptions, FactoryResetCommands, PipetteSettings, \
    PipetteSettingsUpdate, RobotConfigs, MultiPipetteSettings, \
    LogIdentifier, LogFormat

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
             response_model=V1ErrorMessage)
async def post_log_level_local(log_level: LogLevel) -> V1ErrorMessage:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/settings/log_level/upstream",
             description="Set the minimum level of logs sent upstream to "
                         "Opentrons. Only available on a real robot",
             response_model=V1ErrorMessage)
async def post_log_level_upstream(log_level: LogLevel)\
        -> V1ErrorMessage:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


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


@router.get("/logs/{syslog_identifier}",
            description="Get logs from the robot")
async def get_logs(syslog_identifier: LogIdentifier,
                   format: LogFormat = LogFormat.text,
                   records: int = Query(500000,
                                        description="Number of records to "
                                                    "retrieve",
                                        gt=0,
                                        le=100000)) -> str:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")
