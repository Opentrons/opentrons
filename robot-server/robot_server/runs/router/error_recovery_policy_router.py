"""Router for /runs/{runId}/errorRecoveryPolicy endpoints."""

from textwrap import dedent
from typing import Annotated

from fastapi import Depends, status

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
)

from ..dependencies import get_run_data_manager
from ..error_recovery_models import ErrorRecoveryPolicy
from ..run_data_manager import RunDataManager, RunNotCurrentError
from .base_router import RunStopped
from robot_server.errors.error_responses import ErrorBody

error_recovery_policy_router = LightRouter()


@PydanticResponse.wrap_route(
    error_recovery_policy_router.put,
    path="/runs/{runId}/errorRecoveryPolicy",
    summary="Set a run's error recovery policy",
    description=dedent("""
        Update how to handle different kinds of command failures.

        For this to have any effect, error recovery must also be enabled globally.
        See `PATCH /errorRecovery/settings`.
        """),
    responses={
        status.HTTP_200_OK: {"model": SimpleEmptyBody},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunStopped]},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change run error recovery policy")),
    ],
)
async def put_error_recovery_policy(
    runId: str,
    request_body: RequestModel[ErrorRecoveryPolicy],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
) -> PydanticResponse[SimpleEmptyBody]:
    """Set a run's error recovery policy.

    Arguments:
        runId: Run ID pulled from URL.
        request_body:  Request body with the new run policy.
        run_data_manager: Current and historical run data management.
    """
    rules = request_body.data.policyRules
    try:
        run_data_manager.set_error_recovery_rules(run_id=runId, rules=rules)
    except RunNotCurrentError as e:
        raise RunStopped(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e

    return await PydanticResponse.create(
        content=SimpleEmptyBody.model_construct(),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    error_recovery_policy_router.get,
    path="/runs/{runId}/errorRecoveryPolicy",
    summary="Get a run's current error recovery policy",
    description="See `PUT /runs/{runId}/errorRecoveryPolicy`.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[ErrorRecoveryPolicy]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunStopped]},
    },
)
async def get_error_recovery_policy(
    runId: str,
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
) -> PydanticResponse[SimpleBody[ErrorRecoveryPolicy]]:
    """Get a run's current error recovery policy.

    Arguments:
        runId: Run ID pulled from URL.
        run_data_manager: Current and historical run data management.
    """
    try:
        rules = run_data_manager.get_error_recovery_rules(run_id=runId)
    except RunNotCurrentError as e:
        raise RunStopped(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e

    return await PydanticResponse.create(
        content=SimpleBody.model_construct(
            data=ErrorRecoveryPolicy.model_construct(policyRules=rules)
        ),
        status_code=status.HTTP_200_OK,
    )
