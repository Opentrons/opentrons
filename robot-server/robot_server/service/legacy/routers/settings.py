import logging
from dataclasses import asdict
from typing import Annotated, Dict, List, Optional

import aiohttp
from fastapi import APIRouter, Depends, Header
from fastapi.responses import RedirectResponse
from starlette import status

from opentrons.config import (
    advanced_settings,
)
from opentrons.config import (
    feature_flags as ff,
)
from opentrons.config import (
    reset as reset_util,
)
from opentrons.config.types import OT3Config
from opentrons.hardware_control import (
    HardwareControlAPI,
)
from opentrons.hardware_control.types import HardwareFeatureFlags
from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.robot.types import RobotTypeEnum
from server_utils.audit.fastapi import get_audit_logger, get_supplied_user_notes
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.app_state import (
    AppState,
    get_app_state,
)
from server_utils.persistence.persistence_directory import PersistenceResetter

from robot_server.deck_configuration.fastapi_dependencies import (
    get_deck_configuration_store_failsafe,
)
from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.errors.error_responses import LegacyErrorResponse
from robot_server.hardware import (
    clean_up_hardware,
    get_hardware,
    get_hardware_resource,
    get_ot2_hardware,
    get_robot_type_enum,
    start_initializing_hardware,
)
from robot_server.persistence.fastapi_dependencies import (
    get_images_resetter,
    get_persistence_resetter,
)
from robot_server.persistence.images_directory import ImagesResetter
from robot_server.runs.dependencies import (
    mark_light_control_startup_finished,
    start_light_control_task,
)
from robot_server.service.legacy import reset_odd
from robot_server.service.legacy.models import V1BasicResponse
from robot_server.service.legacy.models.settings import (
    AdvancedSetting,
    AdvancedSettingRequest,
    AdvancedSettingsResponse,
    FactoryResetOption,
    FactoryResetOptions,
    Links,
    LogLevel,
    MultiPipetteSettings,
    PipetteSettings,
    PipetteSettingsUpdate,
    RobotConfigs,
)
from robot_server.service.pyro_utils.pyro_resource import (
    start_initializing_pyro_resource,
)

log = logging.getLogger(__name__)

router = APIRouter()


async def _set_oem_mode_request(
    enable: bool, authorization_header: str | None, user_notes_header: str | None
) -> int:
    """PUT request to set the OEM Mode for the system server."""
    headers: dict[str, str] = {}
    if authorization_header is not None:
        headers["Authorization"] = authorization_header
    if user_notes_header is not None:
        headers["Opentrons-User-Notes"] = user_notes_header

    async with aiohttp.ClientSession() as session:
        async with session.put(
            "http://127.0.0.1:31950/system/oem_mode/enable",
            headers=headers,
            json={"enable": enable},
        ) as resp:
            return resp.status


async def _hardware_subprocess_transition(enable: bool, app_state: AppState) -> None:
    """Request to transition the source of the hardware api between inner-process and subprocess."""
    if enable:
        # cleanup state/kill any local hardware API
        await clean_up_hardware(app_state)
        # todo(chb: 04-09-2026): Send SystemD socket request to opentrons-hardware-controller to start subprocess

    else:
        # cleanup state
        await clean_up_hardware(app_state)

        # todo(chb: 04-09-2026): Send SystemD socket request to opentrons-hardware-controller to end subprocess

    # rerun the hardware API setup
    start_initializing_hardware(
        app_state=app_state,
        pyro_task=start_initializing_pyro_resource(app_state=app_state),
        callbacks=[
            (start_light_control_task, True),
            (mark_light_control_startup_finished, False),
        ],
    )


@router.post(
    path="/settings",
    summary="Change a setting",
    description="Change an advanced setting (feature flag)",
    response_model=AdvancedSettingsResponse,
    response_model_exclude_unset=True,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": LegacyErrorResponse},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change feature flag")),
    ],
)
async def post_settings(
    update: AdvancedSettingRequest,
    hardware: Annotated[HardwareControlAPI, Depends(get_hardware)],
    app_state: Annotated[AppState, Depends(get_app_state)],
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
    user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
    authorization: Annotated[str | None, Header()] = None,
) -> AdvancedSettingsResponse:
    """Update advanced setting (feature flag)"""
    try:
        # send request to system server if this is the enableOEMMode setting
        if update.id == "enableOEMMode" and robot_type == RobotTypeEnum.FLEX:
            resp = await _set_oem_mode_request(
                # Unlike opentrons.advanced_settings, system-server cannot store
                # `None`/`null` to restore to default. Storing `False` instead is close
                # enough.
                update.value if update.value is not None else False,
                # Forward along the client's authorization and reason, if it has them
                authorization_header=authorization,
                user_notes_header=user_notes,
            )
            if resp != 200:
                # TODO: raise correct error here
                raise Exception(f"Something went wrong setting OEM Mode. err: {resp}")

        await advanced_settings.set_adv_setting(update.id, update.value)
        if update.id == "enableHardwareSubprocess" and robot_type == RobotTypeEnum.FLEX:
            enable = update.value is True
            if enable:
                # systemd starts the Pyro units  only on the next boot, once the flags file is true.
                # A live transition here tears down in-process hardware and 503s if
                # the nameserver is not already running, which blocks CRS enable.
                log.info(
                    "Persisted enableHardwareSubprocess=true; restart required to start Pyro"
                )
            else:
                await _hardware_subprocess_transition(
                    enable=False,
                    app_state=app_state,
                )
                hardware = await get_hardware_resource(app_state)

        hardware.hardware_feature_flags = HardwareFeatureFlags.build_from_ff()
        await hardware.set_status_bar_enabled(ff.status_bar_enabled())
    except ValueError as e:
        raise LegacyErrorResponse.from_exc(e).as_error(status.HTTP_400_BAD_REQUEST)
    except advanced_settings.SettingException as e:
        # Severe internal error
        raise LegacyErrorResponse.from_exc(e).as_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    return _create_settings_response(robot_type)


@router.get(
    "/settings",
    summary="Get settings",
    description="Get a list of available advanced settings (feature "
    "flags) and their values",
    response_model=AdvancedSettingsResponse,
    response_model_exclude_unset=True,
)
async def get_settings(
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
) -> AdvancedSettingsResponse:
    """Get advanced setting (feature flags)"""
    return _create_settings_response(robot_type)


def _create_settings_response(robot_type: RobotTypeEnum) -> AdvancedSettingsResponse:
    """Create the feature flag settings response object"""
    data = advanced_settings.get_all_adv_settings(robot_type)

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
    summary="Set the local log level",
    description="Permanently moved to `POST /system/settings/log_level/local`.",
    status_code=status.HTTP_308_PERMANENT_REDIRECT,
    response_class=RedirectResponse,
)
async def post_log_level_local() -> RedirectResponse:
    """Redirect to the system-server log level endpoint."""
    return RedirectResponse(
        url="/system/settings/log_level/local",
        status_code=status.HTTP_308_PERMANENT_REDIRECT,
    )


@router.post(
    path="/settings/log_level/upstream",
    summary="Set the upstream log level",
    description=(
        "Set the minimum level of logs sent upstream via"
        " syslog-ng to Opentrons."
        " Removed in robot software v7.2.0."
    ),
    response_model=LegacyErrorResponse,
    deprecated=True,
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change legacy log upstreaming")),
    ],
)
async def post_log_level_upstream(log_level: LogLevel) -> V1BasicResponse:
    raise LegacyErrorResponse(
        message="API Discontinued - log streaming removed",
        errorCode=str(ErrorCodes.API_REMOVED),
    ).as_error(status.HTTP_410_GONE)


@router.get(
    "/settings/reset/options",
    summary="Get the things that can be reset",
    description="Get the robot settings and data that can be reset through `POST /settings/reset`.",
    response_model=FactoryResetOptions,
)
async def get_settings_reset_options(
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
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
    summary="Reset specific settings or data",
    description=(
        "Perform a reset of the requested robot settings or data."
        "\n\n"
        "The valid properties are given by `GET /settings/reset/options`."
        "\n\n"
        "You should always restart the robot after using this endpoint to"
        " reset something."
    ),
    responses={
        status.HTTP_403_FORBIDDEN: {"model": LegacyErrorResponse},
        status.HTTP_503_SERVICE_UNAVAILABLE: {"model": LegacyErrorResponse},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("reset settings")),
    ],
)
async def post_settings_reset_options(
    factory_reset_commands: Dict[reset_util.ResetOptionId, bool],
    persistence_resetter: Annotated[
        PersistenceResetter, Depends(get_persistence_resetter)
    ],
    images_resetter: Annotated[ImagesResetter, Depends(get_images_resetter)],
    deck_configuration_store: Annotated[
        Optional[DeckConfigurationStore], Depends(get_deck_configuration_store_failsafe)
    ],
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
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

    failed_commands: List[reset_util.ResetOptionId] = []

    reset_util.reset(options, robot_type)

    if factory_reset_commands.get(reset_util.ResetOptionId.runs_history, False):
        await persistence_resetter.mark_directory_reset()
        await images_resetter.mark_directory_reset()

    if factory_reset_commands.get(reset_util.ResetOptionId.on_device_display, False):
        await reset_odd.mark_odd_for_reset_next_boot()

    if factory_reset_commands.get(reset_util.ResetOptionId.deck_configuration, False):
        if deck_configuration_store:
            await deck_configuration_store.delete()
        else:
            failed_commands.append(reset_util.ResetOptionId.deck_configuration)

    if failed_commands:
        raise LegacyErrorResponse(
            message=f"Some options could not be reset: {failed_commands}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(
            # 503 because this condition can happen if someone tries to reset something
            # before our persistence layer has fully initialized. It will start working
            # after initialization finishes.
            status.HTTP_503_SERVICE_UNAVAILABLE
        )
    else:
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
    hardware: Annotated[HardwareControlAPI, Depends(get_hardware)],
) -> RobotConfigs:
    config = await hardware.update_config()
    if isinstance(config, OT3Config):
        return config.model_dump()
    return asdict(config)


@router.get(
    "/settings/pipettes",
    description="List all settings for all known pipettes by id. Only available on OT-2.",
    response_model=MultiPipetteSettings,
    response_model_by_alias=True,
    response_model_exclude_unset=True,
)
async def get_pipette_settings(
    hardware: Annotated[None, Depends(get_ot2_hardware)],
) -> MultiPipetteSettings:
    # get_ot2_hardware should always raise and we never get here
    raise NotImplementedError()


@router.get(
    path="/settings/pipettes/{pipette_id}",
    description="Get the settings of a specific pipette by ID. Only available on OT-2.",
    response_model=PipetteSettings,
    response_model_by_alias=True,
    response_model_exclude_unset=True,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": LegacyErrorResponse},
    },
)
async def get_pipette_setting(
    pipette_id: str, hardware: Annotated[None, Depends(get_ot2_hardware)]
) -> PipetteSettings:
    # get_ot2_hardware should always raise and we never get here
    raise NotImplementedError()


@router.patch(
    path="/settings/pipettes/{pipette_id}",
    description="Change the settings of a specific pipette. Only available on OT-2.",
    response_model=PipetteSettings,
    response_model_by_alias=True,
    response_model_exclude_unset=True,
    responses={
        status.HTTP_412_PRECONDITION_FAILED: {"model": LegacyErrorResponse},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change OT-2 pipette settings")),
    ],
)
async def patch_pipette_setting(
    pipette_id: str,
    settings_update: PipetteSettingsUpdate,
    hardware: Annotated[None, Depends(get_ot2_hardware)],
) -> PipetteSettings:
    # get_ot2_hardware should always raise and we never get here
    raise NotImplementedError()
