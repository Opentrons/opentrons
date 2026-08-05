"""Base router for /runs endpoints.

Contains routes dealing primarily with `Run` models.
"""

import logging
from datetime import datetime
from pathlib import Path
from textwrap import dedent
from typing import (
    Annotated,
    Callable,
    Dict,
    Final,
    Literal,
    Optional,
    Union,
    assert_type,
)

from fastapi import Depends, Query, status
from pydantic import BaseModel, Field

from opentrons.hardware_control.modules.absorbance_reader import AbsorbanceReader
from opentrons.hardware_control.types import EstopState
from opentrons.protocol_engine import (
    errors as pe_errors,
)
from opentrons.protocol_engine.commands.absorbance_reader import CloseLid, OpenLid
from opentrons.protocol_engine.commands.move_labware import MoveLabware
from opentrons.protocol_engine.resources.camera_provider import CameraProvider
from opentrons.protocol_engine.types import CSVRuntimeParamPaths, DeckSlotLocation
from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.robot.types import RobotTypeEnum
from server_utils.audit.audit_server import (
    Client as AuditClient,
)
from server_utils.audit.audit_server import (
    NoCurrentLogPeriodError,
)
from server_utils.audit.fastapi import get_audit_client, get_audit_logger
from server_utils.auth.resource_server.authorization_checker import (
    check as check_authorization,
)
from server_utils.auth.resource_server.fastapi import (
    AuthorizationError,
    RequireAuthenticationResult,
    get_access_control_status,
    require_authentication,
    require_scopes,
)
from server_utils.auth.resource_server.types import (
    AuthorizationNotRequiredResult,
    AuthorizedResult,
)
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api import (
    Body,
    MultiBody,
    MultiBodyMeta,
    PydanticResponse,
    RequestModel,
    ResourceLink,
    SimpleBody,
    SimpleEmptyBody,
    SimpleMultiBody,
)

from ..dependencies import (
    get_run_auto_deleter,
    get_run_data_manager,
    get_run_store,
)
from ..run_auto_deleter import RunAutoDeleter
from ..run_data_manager import (
    RunDataManager,
    RunNotCompleteError,
    RunNotCurrentError,
    RunSignoffRequiredError,
)
from ..run_download_utils import collect_run_log
from ..run_models import (
    ActiveNozzleLayout,
    BadRun,
    CommandLinkNoMeta,
    FlexStackerState,
    NozzleLayoutConfig,
    PlaceLabwareState,
    Run,
    RunCreate,
    RunCurrentState,
    RunNotFoundError,
    RunUpdate,
    TipState,
)
from ..run_orchestrator_store import RunConflictError
from ..run_store import RunStore
from robot_server.camera.fastapi_dependencies import (
    get_camera_provider,
)
from robot_server.data_files.data_files_store import DataFilesStore
from robot_server.data_files.dependencies import (
    get_data_files_directory,
    get_data_files_store,
)
from robot_server.data_files.models import FileIdNotFound, FileIdNotFoundError
from robot_server.data_files.zip_utils import create_download_staging_dir
from robot_server.deck_configuration.fastapi_dependencies import (
    get_deck_configuration_store,
)
from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.errors.error_responses import ErrorBody, ErrorDetails
from robot_server.hardware import (
    HardwareStateStore,
    get_hardware_state_store,
    get_robot_type_enum,
)
from robot_server.persistence.fastapi_dependencies import get_persistence_directory_root
from robot_server.protocols.dependencies import get_protocol_store
from robot_server.protocols.protocol_store import (
    ProtocolNotFoundError,
    ProtocolStore,
)
from robot_server.protocols.router import ProtocolNotFound
from robot_server.robot.control.dependencies import require_estop_in_good_state
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.notifications import get_pe_notify_publishers

log = logging.getLogger(__name__)
base_router = LightRouter()

_DEFAULT_COMMAND_ERROR_LIST_LENGTH: Final = 20


class RunNotFound(ErrorDetails):
    """An error if a given run is not found."""

    id: Literal["RunNotFound"] = "RunNotFound"
    title: str = "Run Not Found"
    errorCode: str = ErrorCodes.GENERAL_ERROR.value.code


class RunAlreadyActive(ErrorDetails):
    """An error if one tries to create a new run while one is already active."""

    id: Literal["RunAlreadyActive"] = "RunAlreadyActive"
    title: str = "Run Already Active"
    errorCode: str = ErrorCodes.ROBOT_IN_USE.value.code


class RunNotIdle(ErrorDetails):
    """An error if one tries to delete a run that is not idle."""

    id: Literal["RunNotIdle"] = "RunNotIdle"
    title: str = "Run is not idle."
    detail: str = (
        "Run is currently active. Allow the run to finish or"
        " stop it with a `stop` action before attempting to modify it."
    )
    errorCode: str = ErrorCodes.ROBOT_IN_USE.value.code


class RunStopped(ErrorDetails):
    """An error if one tries to modify a stopped run."""

    id: Literal["RunStopped"] = "RunStopped"
    title: str = "Run Stopped"
    errorCode: str = ErrorCodes.GENERAL_ERROR.value.code


class RunNotComplete(ErrorDetails):
    """An error if one tries to sign a run that has not completed."""

    id: Literal["RunNotComplete"] = "RunNotComplete"
    title: str = "Run Not Complete"
    errorCode: str = ErrorCodes.GENERAL_ERROR.value.code


class RunSignoffRequired(ErrorDetails):
    """An error if an action requires the run to be signed off first."""

    id: Literal["RunSignoffRequired"] = "RunSignoffRequired"
    title: str = "Run Signoff Required"
    errorCode: str = ErrorCodes.GENERAL_ERROR.value.code


class NoCurrentAuditLogFound(ErrorDetails):
    """An error if audit logging is enabled but no current log period could be found."""

    id: Literal["NoCurrentAuditLogFound"] = "NoCurrentAuditLogFound"
    title: str = "No Current Audit Log Found"
    errorCode: str = ErrorCodes.GENERAL_ERROR.value.code


class AllRunsLinks(BaseModel):
    """Links returned along with a collection of runs."""

    current: Optional[ResourceLink] = Field(
        None,
        description="Path to the currently active run, if a run is active.",
    )


class CurrentStateLinks(BaseModel):
    """Links returned with the current state of a run."""

    lastCompleted: Optional[CommandLinkNoMeta] = Field(
        None,
        description="Path to the last completed command when current state was reported, if any.",
    )


async def get_run_data_from_url(
    runId: str,
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
) -> Union[Run, BadRun]:
    """Get the data of a run.

    Args:
        runId: Run ID pulled from URL.
        run_data_manager: Current and historical run data management.
    """
    try:
        run_data = run_data_manager.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return run_data


@PydanticResponse.wrap_route(
    base_router.post,
    path="/runs",
    summary="Create a run",
    description=dedent("""
        Create a new run to track robot interaction.

        When too many runs already exist, old ones will be automatically deleted
        to make room for the new one.
        """),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[Run]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[ProtocolNotFound]},
        status.HTTP_422_UNPROCESSABLE_ENTITY: {"model": ErrorBody[FileIdNotFound]},
        status.HTTP_409_CONFLICT: {
            "model": ErrorBody[
                Union[RunAlreadyActive, RunSignoffRequired, NoCurrentAuditLogFound]
            ]
        },
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("create protocol run")),
    ],
)
async def create_run(  # noqa: C901
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
    run_id: Annotated[str, Depends(get_unique_id)],
    created_at: Annotated[datetime, Depends(get_current_time)],
    run_auto_deleter: Annotated[RunAutoDeleter, Depends(get_run_auto_deleter)],
    data_files_directory: Annotated[Path, Depends(get_data_files_directory)],
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    check_estop: Annotated[bool, Depends(require_estop_in_good_state)],
    deck_configuration_store: Annotated[
        DeckConfigurationStore, Depends(get_deck_configuration_store)
    ],
    camera_provider: Annotated[CameraProvider, Depends(get_camera_provider)],
    notify_publishers: Annotated[Callable[[], None], Depends(get_pe_notify_publishers)],
    access_control_status: Annotated[bool, Depends(get_access_control_status)],
    audit_client: Annotated[AuditClient, Depends(get_audit_client)],
    request_body: Optional[RequestModel[RunCreate]] = None,
) -> PydanticResponse[SimpleBody[Union[Run, BadRun]]]:
    """Create a new run.

    Arguments:
        request_body: Optional request body with run creation data.
        run_data_manager: Current and historical run data management.
        protocol_store: Protocol resource storage.
        run_id: Generated ID to assign to the run.
        created_at: Timestamp to attach to created run.
        run_auto_deleter: An interface to delete old resources to make room for
            the new run.
        data_files_directory: Persistence directory for data files.
        data_files_store: Database of data file resources.
        resources to make room for the new run.
        check_estop: Dependency to verify the estop is in a valid state.
        deck_configuration_store: Dependency to fetch the deck configuration.
        camera_provider: Dependency to provide access to the Camera Settings to the run.
        notify_publishers: Utilized by the engine to notify publishers of state changes.
        access_control_status: Whether access control (Compliance Ready Software) is
            currently enabled on the robot.
        audit_client: Client to get log period info from
    """
    protocol_id = request_body.data.protocolId if request_body is not None else None
    offsets = request_body.data.labwareOffsets if request_body is not None else []
    rtp_values = (
        request_body.data.runTimeParameterValues if request_body is not None else None
    )
    rtp_files = (
        request_body.data.runTimeParameterFiles if request_body is not None else None
    )

    rtp_paths: Optional[CSVRuntimeParamPaths] = None
    try:
        if rtp_files:
            rtp_paths = {
                name: data_files_directory
                / file_id
                / data_files_store.get(file_id).name
                for name, file_id in rtp_files.items()
            }
    except FileIdNotFoundError as e:
        raise FileIdNotFound(detail=str(e)).as_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    protocol_resource = None

    deck_configuration = await deck_configuration_store.get_deck_configuration()

    logging_enabled = await audit_client.get_logging_enabled()
    if logging_enabled.loggingEnabled:
        try:
            log_period = await audit_client.get_current_log_period()
        except NoCurrentLogPeriodError as e:
            raise NoCurrentAuditLogFound(detail=str(e)).as_error(
                status.HTTP_409_CONFLICT
            )
    else:
        log_period = None

    # TODO (tz, 5-16-22): same error raised twice.
    #  Check if we can consolidate to one place.
    if protocol_id is not None:
        try:
            protocol_resource = protocol_store.get(protocol_id=protocol_id)
        except ProtocolNotFoundError as e:
            raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    # TODO(mc, 2022-05-13): move inside `RunDataManager` or return data
    # to pass to `RunDataManager.create`. Right now, runs may be deleted
    # even if a new create is unable to succeed due to a conflict
    run_auto_deleter.make_room_for_new_run()

    try:
        run_data = await run_data_manager.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=offsets,
            deck_configuration=deck_configuration,
            camera_provider=camera_provider,
            run_time_param_values=rtp_values,
            run_time_param_paths=rtp_paths,
            protocol=protocol_resource,
            notify_publishers=notify_publishers,
            access_control_status=access_control_status,
            log_period_id=str(log_period.id) if log_period is not None else None,
        )
    except RunConflictError as e:
        raise RunAlreadyActive(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e
    except RunSignoffRequiredError as e:
        raise RunSignoffRequired(detail=str(e)).as_error(
            status.HTTP_409_CONFLICT
        ) from e
    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    log.info(f'Created protocol run "{run_id}" from protocol "{protocol_id}".')

    return await PydanticResponse.create(
        content=SimpleBody.model_construct(data=run_data),
        status_code=status.HTTP_201_CREATED,
    )


@PydanticResponse.wrap_route(
    base_router.get,
    path="/runs",
    summary="Get all runs",
    description=(
        "Get a list of all active and inactive runs, in order from oldest to newest."
    ),
    responses={
        status.HTTP_200_OK: {"model": MultiBody[Union[Run, BadRun], AllRunsLinks]},
    },
)
async def get_runs(
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    pageLength: Annotated[
        Optional[int],
        Query(
            description=(
                "The maximum number of runs to return."
                " If this is less than the total number of runs,"
                " the most-recently created runs will be returned."
                " If this is omitted or `null`, all runs will be returned."
            ),
        ),
    ] = None,
) -> PydanticResponse[MultiBody[Union[Run, BadRun], AllRunsLinks]]:
    """Get all runs, in order from least-recently to most-recently created.

    Args:
        pageLength: Maximum number of items to return.
        run_data_manager: Current and historical run data management.
    """
    data = run_data_manager.get_all(length=pageLength)
    current_run_id = run_data_manager.current_run_id
    meta = MultiBodyMeta(cursor=0, totalLength=len(data))
    links = AllRunsLinks(
        current=(
            ResourceLink.model_construct(href=f"/runs/{current_run_id}")
            if current_run_id is not None
            else None
        )
    )

    return await PydanticResponse.create(
        content=MultiBody.model_construct(data=data, links=links, meta=meta),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    base_router.get,
    path="/runs/{runId}",
    summary="Get a run",
    description="Get a specific run by its unique identifier.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[Union[Run, BadRun]]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def get_run(
    run_data: Annotated[Run, Depends(get_run_data_from_url)],
) -> PydanticResponse[SimpleBody[Union[Run, BadRun]]]:
    """Get a run by its ID.

    Args:
        run_data: Data of the run specified in the runId url parameter.
    """
    return await PydanticResponse.create(
        content=SimpleBody.model_construct(data=run_data),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    base_router.delete,
    path="/runs/{runId}",
    summary="Delete a run",
    description="Delete a specific run by its unique identifier.",
    responses={
        status.HTTP_200_OK: {"model": SimpleEmptyBody},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {
            "model": ErrorBody[Union[RunNotIdle, RunSignoffRequired]]
        },
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("delete protocol run")),
    ],
)
async def remove_run(
    runId: str,
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    access_control_status: Annotated[bool, Depends(get_access_control_status)],
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete a run by its ID.

    Arguments:
        runId: Run ID pulled from URL.
        run_data_manager: Current and historical run data management.
        access_control_status: Whether access control (Compliance Ready Software) is
            currently enabled on the robot.
    """
    try:
        await run_data_manager.delete(
            run_id=runId, access_control_status=access_control_status
        )

    except RunConflictError as e:
        raise RunNotIdle().as_error(status.HTTP_409_CONFLICT) from e
    except RunSignoffRequiredError as e:
        raise RunSignoffRequired(detail=str(e)).as_error(
            status.HTTP_409_CONFLICT
        ) from e
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    return await PydanticResponse.create(
        content=SimpleEmptyBody.model_construct(),
        status_code=status.HTTP_200_OK,
    )


def _require_signoff_scope(
    authentication: RequireAuthenticationResult,
) -> None:
    authorization_result = check_authorization(
        authentication, {Scope.RUN_SIGNOFF_WRITE}
    )
    if not isinstance(
        authorization_result, (AuthorizationNotRequiredResult, AuthorizedResult)
    ):
        raise AuthorizationError(authorization_result, {Scope.RUN_SIGNOFF_WRITE})


@PydanticResponse.wrap_route(
    base_router.patch,
    path="/runs/{runId}",
    summary="Update a run",
    description="Update a specific run, returning the updated resource.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[Run]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {
            "model": ErrorBody[
                RunStopped | RunNotIdle | RunNotComplete | RunSignoffRequired
            ]
        },
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("update protocol run")),
    ],
)
async def update_run(  # noqa: C901
    runId: str,
    request_body: RequestModel[RunUpdate],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    run_store: Annotated[RunStore, Depends(get_run_store)],
    audit_client: Annotated[AuditClient, Depends(get_audit_client)],
    persistence_directory_root: Annotated[
        Path, Depends(get_persistence_directory_root)
    ],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
    access_control_status: Annotated[bool, Depends(get_access_control_status)],
    authentication: Annotated[
        RequireAuthenticationResult, Depends(require_authentication)
    ],
) -> PydanticResponse[SimpleBody[Union[Run, BadRun]]]:
    """Update a run by its ID.

    Args:
        runId: Run ID pulled from URL.
        request_body: Update data from request body.
        run_data_manager: Current and historical run data management.
        run_store: Store for run data management.
        audit_client: Client to send run log data to audit server.
        persistence_directory_root: Persistence directory used for download staging.
        protocol_store: Store for protocol storage access.
        access_control_status: Whether access control (Compliance Ready Software) is
            currently enabled on the robot.
        authentication: The authenticated user, if any.
    """
    if request_body.data.signedBy is not None:
        _require_signoff_scope(authentication)

    try:
        run_data: Run | BadRun | None = None
        if request_body.data.signedBy is not None:
            # Depending on settings, updating `current` may require `signedBy`
            # to have already been set, so we need to process `signedBy` first.
            run_data = run_data_manager.set_signed_by(
                run_id=runId, signed_by=request_body.data.signedBy
            )
        if request_body.data.current is not None:
            # `current` can either be set to false or not be set at all.
            assert_type(request_body.data.current, Literal[False])
            run_data = await run_data_manager.uncurrent(
                run_id=runId, access_control_status=access_control_status
            )

            # Send run log to audit server if logging enabled
            logging_enabled_response = await audit_client.get_logging_enabled()
            if logging_enabled_response.loggingEnabled:
                staging_dir = create_download_staging_dir(persistence_directory_root)
                staging_path = Path(staging_dir.name)

                run_log_entry = collect_run_log(
                    run_id=runId,
                    run=run_store.get(runId),
                    run_data_manager=run_data_manager,
                    protocol_store=protocol_store,
                    staging_dir=staging_path,
                )
                if run_log_entry is not None:
                    file_path, _ = run_log_entry
                    with open(file_path, "r") as fh:
                        await audit_client.store_robot_log(robot_log_file=fh)
                staging_dir.cleanup()

        if run_data is None:
            run_data = run_data_manager.get(runId)
    except RunConflictError as e:
        raise RunNotIdle(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e
    except RunNotCurrentError as e:
        raise RunStopped(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e
    except RunNotCompleteError as e:
        raise RunNotComplete(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e
    except RunSignoffRequiredError as e:
        raise RunSignoffRequired(detail=str(e)).as_error(
            status.HTTP_409_CONFLICT
        ) from e
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    return await PydanticResponse.create(
        content=SimpleBody.model_construct(data=run_data),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    base_router.get,
    path="/runs/{runId}/commandErrors",
    summary="Get a list of all command errors in the run",
    description=(
        "Get a list of all command errors in the run. "
        "\n\n"
        "The errors are returned in order from oldest to newest."
        "\n\n"
        "This endpoint returns the command error. Use "
        "`GET /runs/{runId}/commands/{commandId}` to get all "
        "information available for a given command."
    ),
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[pe_errors.ErrorOccurrence]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunStopped]},
    },
)
async def get_run_commands_error(
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    runId: str,
    pageLength: Annotated[
        int,
        Query(
            description="The maximum number of command errors in the list to return.",
        ),
    ] = _DEFAULT_COMMAND_ERROR_LIST_LENGTH,
    cursor: Annotated[
        Optional[int],
        Query(
            description=(
                "The starting index of the desired first command error in the list."
                " If unspecified, a cursor will be selected automatically"
                " based on the last error added, and the slice of errors returned "
                " is the previous `pageLength` errors."
            ),
        ),
    ] = None,
) -> PydanticResponse[SimpleMultiBody[pe_errors.ErrorOccurrence]]:
    """Get a summary of a set of command errors in a run.

    Arguments:
        runId: Requested run ID, from the URL
        cursor: Cursor index for the collection response.
        pageLength: Maximum number of items to return.
        run_data_manager: Run data retrieval interface.
    """
    try:
        all_errors_count = run_data_manager.get_command_errors_count(run_id=runId)

        if cursor is None:
            cursor = max(all_errors_count - 1, 0)
            cursor = max(cursor - pageLength + 1, 0)
            cursor = min(cursor, all_errors_count)

        command_error_slice = run_data_manager.get_command_error_slice(
            run_id=runId,
            cursor=cursor,
            length=pageLength,
        )
    except RunNotCurrentError as e:
        raise RunStopped(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e

    meta = MultiBodyMeta(
        cursor=command_error_slice.cursor,
        totalLength=command_error_slice.total_length,
    )

    return await PydanticResponse.create(
        content=SimpleMultiBody.model_construct(
            data=command_error_slice.commands_errors,
            meta=meta,
        ),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    base_router.get,
    path="/runs/{runId}/currentState",
    summary="Get a run's current state.",
    description=dedent("""
        Get current state associated with a run if the run is current.
        "\n\n"
        Note that this endpoint is experimental and subject to change.
        """),
    responses={
        status.HTTP_200_OK: {"model": Body[RunCurrentState, CurrentStateLinks]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunStopped]},
    },
)
async def get_current_state(  # noqa: C901
    runId: str,
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    hardware_store: Annotated[HardwareStateStore, Depends(get_hardware_state_store)],
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
) -> PydanticResponse[Body[RunCurrentState, CurrentStateLinks]]:
    """Get current state associated with a run if the run is current.

    Arguments:
        runId: Run ID pulled from URL.
        run_data_manager: Run data retrieval interface.
        hardware_store: Robot-server store of hardware status.
        robot_type: The type of robot.
    """
    try:
        run = run_data_manager.get(run_id=runId)
    except RunNotCurrentError as e:
        raise RunStopped(detail=str(e)).as_error(status.HTTP_409_CONFLICT)

    active_nozzle_maps = run_data_manager.get_nozzle_maps(run_id=runId)
    nozzle_layouts = {
        pipetteId: ActiveNozzleLayout.model_construct(
            startingNozzle=nozzle_map.starting_nozzle,
            activeNozzles=nozzle_map.active_nozzles,
            config=NozzleLayoutConfig(nozzle_map.configuration.value.lower()),
        )
        for pipetteId, nozzle_map in active_nozzle_maps.items()
    }

    tip_states = {
        pipette_id: TipState.model_construct(hasTip=has_tip)
        for pipette_id, has_tip in run_data_manager.get_tip_attached(
            run_id=runId
        ).items()
    }

    current_command = run_data_manager.get_current_command(run_id=runId)

    estop_engaged = False
    place_labware = None
    if robot_type == RobotTypeEnum.FLEX:
        estop_engaged = hardware_store.get_estop_state() in [
            EstopState.PHYSICALLY_ENGAGED,
            EstopState.LOGICALLY_ENGAGED,
        ]

        command = (
            run_data_manager.get_command(runId, current_command.command_id)
            if current_command
            else None
        )

        # Labware state when estop is engaged
        if isinstance(command, MoveLabware):
            location = command.params.newLocation
            if isinstance(location, DeckSlotLocation):
                for labware in run.labware:
                    if labware.id == command.params.labwareId:
                        place_labware = PlaceLabwareState(
                            location=location,
                            labwareURI=labware.definitionUri,
                            shouldPlaceDown=False,
                        )
                        break
        # Handle absorbance reader lid
        elif isinstance(command, (OpenLid, CloseLid)):
            for mod in run.modules:
                if (
                    not isinstance(mod, AbsorbanceReader)
                    and mod.id != command.params.moduleId
                ):
                    continue
                for hw_mod in hardware_store.attached_modules:
                    if (
                        mod.location is not None
                        and hw_mod.serial_number == mod.serialNumber
                    ):
                        location = mod.location
                        # TODO: Not the best location for this, we should
                        # remove this once we are no longer defining the plate reader lid
                        # as a labware.
                        labware_uri = "opentrons/opentrons_flex_lid_absorbance_plate_reader_module/1"
                        place_labware = PlaceLabwareState(
                            location=location,
                            labwareURI=labware_uri,
                            shouldPlaceDown=estop_engaged,
                        )
                        break
                if place_labware:
                    break

    flex_stacker_substates = run_data_manager.get_flex_stacker_substate(run_id=runId)
    flex_stacker_states: Dict[str, FlexStackerState] | None
    if len(flex_stacker_substates) > 0:
        flex_stacker_states = {}
        for module_id in flex_stacker_substates:
            primary_uri: str | None = None
            adapter_uri: str | None = None
            lid_uri: str | None = None
            primary_def = flex_stacker_substates[module_id].pool_primary_definition
            adapter_def = flex_stacker_substates[module_id].pool_adapter_definition
            lid_def = flex_stacker_substates[module_id].pool_lid_definition
            if primary_def is not None:
                primary_uri = (
                    primary_def.namespace
                    + "/"
                    + primary_def.parameters.loadName
                    + "/"
                    + str(primary_def.version)
                )
            if adapter_def is not None:
                adapter_uri = (
                    adapter_def.namespace
                    + "/"
                    + adapter_def.parameters.loadName
                    + "/"
                    + str(adapter_def.version)
                )
            if lid_def is not None:
                lid_uri = (
                    lid_def.namespace
                    + "/"
                    + lid_def.parameters.loadName
                    + "/"
                    + str(lid_def.version)
                )
            max_count = flex_stacker_substates[module_id].get_max_pool_count()
            if max_count is None:
                max_count = 0

            flex_stacker_states[module_id] = FlexStackerState.model_construct(
                primaryLabwareURI=primary_uri,
                adapterLabwareURI=adapter_uri,
                lidLabwareURI=lid_uri,
                count=len(flex_stacker_substates[module_id].get_contained_labware()),
                maxCount=max_count,
            )
    else:
        flex_stacker_states = None

    last_completed_command = run_data_manager.get_last_completed_command(run_id=runId)
    links = CurrentStateLinks.model_construct(
        lastCompleted=(
            CommandLinkNoMeta.model_construct(
                id=last_completed_command.command_id,
                href=f"/runs/{runId}/commands/{last_completed_command.command_id}",
            )
            if last_completed_command is not None
            else None
        )
    )

    return await PydanticResponse.create(
        content=Body.model_construct(
            data=RunCurrentState.model_construct(
                estopEngaged=estop_engaged,
                activeNozzleLayouts=nozzle_layouts,
                tipStates=tip_states,
                placeLabwareState=place_labware,
                flexStackerStates=flex_stacker_states,
            ),
            links=links,
        ),
        status_code=status.HTTP_200_OK,
    )
