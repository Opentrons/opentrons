from dataclasses import asdict
import logging
from typing import Dict, cast, Union, Any

from starlette import status
from fastapi import APIRouter, Depends

from opentrons_shared_data.errors import ErrorCodes
from opentrons.hardware_control import HardwareControlAPI
from opentrons.system import log_control
from opentrons_shared_data.pipette import mutable_configurations, types as pip_types
from opentrons.config import (
    reset as reset_util,
    robot_configs,
    advanced_settings,
    feature_flags as ff,
    get_opentrons_path,
)

from robot_server.errors import LegacyErrorResponse
from robot_server.hardware import get_hardware, get_robot_type
from robot_server.service.legacy import reset_odd
from robot_server.service.legacy.models import V1BasicResponse
from robot_server.service.legacy.models.settings import (
    AdvancedSettingsResponse,
    LogLevel,
    LogLevels,
    FactoryResetOptions,
    PipetteSettings,
    PipetteSettingsUpdate,
    RobotConfigs,
    MultiPipetteSettings,
    PipetteSettingsInfo,
    PipetteSettingsFields,
    FactoryResetOption,
    AdvancedSettingRequest,
    Links,
    AdvancedSetting,
)
from robot_server.persistence import PersistenceResetter, get_persistence_resetter

log = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    path="/settings",
    description="Change an advanced setting (feature flag)",
    response_model=AdvancedSettingsResponse,
    response_model_exclude_unset=True,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": LegacyErrorResponse},
    },
)
async def post_settings(
    update: AdvancedSettingRequest, hardware: HardwareControlAPI = Depends(get_hardware)
) -> AdvancedSettingsResponse:
    """Update advanced setting (feature flag)"""
    try:
        await advanced_settings.set_adv_setting(update.id, update.value)
        await hardware.set_status_bar_enabled(ff.status_bar_enabled())
    except ValueError as e:
        raise LegacyErrorResponse.from_exc(e).as_error(status.HTTP_400_BAD_REQUEST)
    except advanced_settings.SettingException as e:
        # Severe internal error
        raise LegacyErrorResponse.from_exc(e).as_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    return _create_settings_response()


@router.get(
    "/settings",
    description="Get a list of available advanced settings (feature "
    "flags) and their values",
    response_model=AdvancedSettingsResponse,
    response_model_exclude_unset=True,
)
async def get_settings() -> AdvancedSettingsResponse:
    """Get advanced setting (feature flags)"""
    return _create_settings_response()


def _create_settings_response() -> AdvancedSettingsResponse:
    """Create the feature flag settings response object"""
    data = advanced_settings.get_all_adv_settings()

    if advanced_settings.is_restart_required():
        links = Links(restart="/server/restart")
    else:
        links = Links()

    return AdvancedSettingsResponse(
        links=links,
        settings=[
            AdvancedSetting(
                id=s.definition.id,
                old_id=s.definition.old_id,
                title=s.definition.title,
                description=s.definition.description,
                restart_required=s.definition.restart_required,
                value=s.value,
            )
            for s in data.values()
            if s.definition.should_show()
        ],
    )


@router.post(
    path="/settings/log_level/local",
    description="Set the minimum level of logs saved locally",
    response_model=V1BasicResponse,
    responses={
        status.HTTP_422_UNPROCESSABLE_ENTITY: {"model": LegacyErrorResponse},
    },
)
async def post_log_level_local(
    log_level: LogLevel, hardware: HardwareControlAPI = Depends(get_hardware)
) -> V1BasicResponse:
    """Update local log level"""
    level = log_level.log_level
    if not level:
        raise LegacyErrorResponse(
            message="log_level must be set",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
    # Level name is upper case
    level_name = level.value.upper()
    # Set the log levels
    for logger_name in ("opentrons", "robot_server", "uvicorn"):
        logging.getLogger(logger_name).setLevel(level.level_id)
    # Update and save settings
    await hardware.update_config(log_level=level_name)
    robot_configs.save_robot_settings(hardware.config)

    return V1BasicResponse(message=f"log_level set to {level}")


@router.post(
    path="/settings/log_level/upstream",
    description=(
        "Set the minimum level of logs sent upstream via"
        " syslog-ng to Opentrons. Only available on"
        " a real robot."
    ),
    response_model=V1BasicResponse,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": LegacyErrorResponse},
    },
)
async def post_log_level_upstream(log_level: LogLevel) -> V1BasicResponse:
    log_level_value = log_level.log_level
    log_level_name = None if log_level_value is None else log_level_value.name
    ok_syslogs = {
        LogLevels.error.name: "err",
        LogLevels.warning.name: "warning",
        LogLevels.info.name: "info",
        LogLevels.debug.name: "debug",
    }

    syslog_level = "emerg"
    if log_level_name is not None:
        syslog_level = ok_syslogs[log_level_name]

    code, stdout, stderr = await log_control.set_syslog_level(syslog_level)

    if code != 0:
        msg = f"Could not reload config: {stdout} {stderr}"
        log.error(msg)
        raise LegacyErrorResponse(
            message=msg, errorCode=ErrorCodes.GENERAL_ERROR.value.code
        ).as_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if log_level_name:
        result = f"Upstreaming log level changed to {log_level_name}"
        getattr(log, log_level_name)(result)
    else:
        result = "Upstreaming logs disabled"
        log.info(result)

    return V1BasicResponse(message=result)


@router.get(
    "/settings/reset/options",
    description="Get the settings that can be reset as part of " "factory reset",
    response_model=FactoryResetOptions,
)
async def get_settings_reset_options(
    robot_type: str = Depends(get_robot_type),
) -> FactoryResetOptions:
    reset_options = reset_util.reset_options(robot_type).items()
    return FactoryResetOptions(
        options=[
            FactoryResetOption(id=k, name=v.name, description=v.description)
            for k, v in reset_options
        ]
    )


@router.post(
    "/settings/reset",
    description="Perform a factory reset of some robot data",
    responses={
        status.HTTP_403_FORBIDDEN: {"model": LegacyErrorResponse},
    },
)
async def post_settings_reset_options(
    factory_reset_commands: Dict[reset_util.ResetOptionId, bool],
    persistence_resetter: PersistenceResetter = Depends(get_persistence_resetter),
    robot_type: str = Depends(get_robot_type),
) -> V1BasicResponse:
    reset_options = reset_util.reset_options(robot_type)
    not_allowed_options = [
        option.value
        for option in list(factory_reset_commands.keys())
        if option not in reset_options.keys()
    ]
    if not_allowed_options:
        not_allowed_array_to_str = " ".join(not_allowed_options)
        raise LegacyErrorResponse(
            message=f"{not_allowed_array_to_str} is not a valid reset option.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_403_FORBIDDEN)

    options = set(k for k, v in factory_reset_commands.items() if v)
    reset_util.reset(options)

    if factory_reset_commands.get(reset_util.ResetOptionId.runs_history, False):
        await persistence_resetter.mark_directory_reset()

    if factory_reset_commands.get(reset_util.ResetOptionId.on_device_display, False):
        await reset_odd.mark_odd_for_reset_next_boot()

    # TODO (tz, 5-24-22): The order of a set is undefined because set's aren't ordered.
    # The message returned to the client will be printed in the wrong order.
    message = (
        "Options '{}' were reset".format(", ".join(o.name for o in options))
        if options
        else "Nothing to do"
    )
    return V1BasicResponse(message=message)


@router.get(
    "/settings/robot",
    description="Get the current robot config",
    response_model=RobotConfigs,
)
async def get_robot_settings(
    hardware: HardwareControlAPI = Depends(get_hardware),
) -> RobotConfigs:
    return asdict(hardware.config)


@router.get(
    "/settings/pipettes",
    description="List all settings for all known pipettes by id",
    response_model=MultiPipetteSettings,
    response_model_by_alias=True,
    response_model_exclude_unset=True,
)
async def get_pipette_settings() -> MultiPipetteSettings:
    res = {}
    for pipette_id in mutable_configurations.known_pipettes(
        get_opentrons_path("pipette_config_overrides_dir")
    ):
        # Have to convert to dict using by_alias due to bug in fastapi
        res[pipette_id] = _pipette_settings_from_config(
            pipette_id,
        )
    return res


@router.get(
    path="/settings/pipettes/{pipette_id}",
    description="Get the settings of a specific pipette by ID",
    response_model=PipetteSettings,
    response_model_by_alias=True,
    response_model_exclude_unset=True,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": LegacyErrorResponse},
    },
)
async def get_pipette_setting(pipette_id: str) -> PipetteSettings:
    if pipette_id not in mutable_configurations.known_pipettes(
        get_opentrons_path("pipette_config_overrides_dir")
    ):
        raise LegacyErrorResponse(
            message=f"{pipette_id} is not a valid pipette id",
            errorCode=ErrorCodes.PIPETTE_NOT_PRESENT.value.code,
        ).as_error(status.HTTP_404_NOT_FOUND)
    r = _pipette_settings_from_config(pipette_id)
    return r


@router.patch(
    path="/settings/pipettes/{pipette_id}",
    description="Change the settings of a specific pipette",
    response_model=PipetteSettings,
    response_model_by_alias=True,
    response_model_exclude_unset=True,
    responses={
        status.HTTP_412_PRECONDITION_FAILED: {"model": LegacyErrorResponse},
    },
)
async def patch_pipette_setting(
    pipette_id: str, settings_update: PipetteSettingsUpdate
) -> PipetteSettings:
    # Convert fields to dict of field name to value
    fields = settings_update.setting_fields or {}
    field_values = {k: None if v is None else v.value for k, v in fields.items()}
    if field_values:
        try:
            mutable_configurations.save_overrides(
                overrides=field_values,
                pipette_serial_number=pipette_id,
                pipette_override_path=get_opentrons_path(
                    "pipette_config_overrides_dir"
                ),
            )
        except ValueError as e:
            raise LegacyErrorResponse(
                message=str(e), errorCode=ErrorCodes.GENERAL_ERROR.value.code
            ).as_error(status.HTTP_412_PRECONDITION_FAILED)
    r = _pipette_settings_from_config(pipette_id)
    return r


def _pipette_settings_from_config(pipette_id: str) -> PipetteSettings:
    """
    Create a PipetteSettings object from pipette config for single pipette

    :param pc: pipette config module
    :param pipette_id: pipette id
    :return: PipetteSettings object
    """
    mutable_configs = mutable_configurations.list_mutable_configs(
        pipette_serial_number=pipette_id,
        pipette_override_path=get_opentrons_path("pipette_config_overrides_dir"),
    )
    converted_dict: Dict[str, Union[str, Dict[str, Any]]] = {}
    # TODO rather than doing this gross thing, we should
    # mess around with pydantic dataclasses.
    for k, v in mutable_configs.items():
        if isinstance(v, str):
            converted_dict[k] = v
        elif isinstance(v, pip_types.MutableConfig):
            converted_dict[k] = v.dict_for_encode()
        elif k == "quirks":
            converted_dict[k] = {q: b.dict_for_encode() for q, b in v.items()}
    fields = PipetteSettingsFields(**converted_dict)  # type: ignore

    # TODO(mc, 2020-09-17): s/fields/setting_fields (?)
    # need model and name?
    return PipetteSettings(  # type: ignore[call-arg]
        info=PipetteSettingsInfo(
            name=cast(str, mutable_configs.get("name", "")),
            model=cast(str, mutable_configs.get("model", "")),
        ),
        fields=fields,
    )
