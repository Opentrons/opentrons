"""Router for /runs actions endpoints."""
import logging

from fastapi import APIRouter, Depends, status
from datetime import datetime
from typing import Union
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.json_api import RequestModel, SimpleBody, PydanticResponse

from ..run_store import RunNotFoundError
from ..run_data_manager import RunDataManager
from ..action_models import RunAction, RunActionCreate
from ..run_error_models import RunStoppedError, RunActionNotAllowedError
from ..dependencies import get_run_data_manager
from .base_router import RunNotFound, RunStopped

log = logging.getLogger(__name__)
actions_router = APIRouter()


class RunActionNotAllowed(ErrorDetails):
    """An error if one tries to issue an unsupported run action."""

    id: Literal["RunActionNotAllowed"] = "RunActionNotAllowed"
    title: str = "Run Action Not Allowed"


@actions_router.post(
    path="/runs/{runId}/actions",
    summary="Issue a control action to the run",
    description="Provide an action in order to control execution of the run.",
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[RunAction]},
        status.HTTP_409_CONFLICT: {
            "model": ErrorBody[Union[RunActionNotAllowed, RunStopped]],
        },
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def create_run_action(
    runId: str,
    request_body: RequestModel[RunActionCreate],
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
    action_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
) -> PydanticResponse[SimpleBody[RunAction]]:
    """Create a run control action.

    Arguments:
        runId: Run ID pulled from the URL.
        request_body: Input payload from the request body.
        run_data_manager: Current and historical run data management.
        action_id: Generated ID to assign to the control action.
        created_at: Timestamp to attach to the control action.
    """
    action = RunAction(
        id=action_id,
        actionType=request_body.data.actionType,
        createdAt=created_at,
    )

    try:
        run_data_manager.create_action(run_id=runId, run_action=action)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e
    except RunStoppedError:
        raise RunStopped(detail=f"Run {runId} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )
    except RunActionNotAllowedError as e:
        raise RunActionNotAllowed(detail=str(e)).as_error(status.HTTP_409_CONFLICT)
    return await PydanticResponse.create(
        content=SimpleBody.construct(data=action),
        status_code=status.HTTP_201_CREATED,
    )
