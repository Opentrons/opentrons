from pydantic import BaseModel, Field

from typing import Optional
from typing_extensions import Literal
from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
    ResourceLink,
    PydanticResponse,
    Body,
    NotifyBody
)

from robot_server.notifications import notification_client

##TOME: You'll want some sort of base class with a status code living somewhere else.
class BaseNotificationResponse(BaseModel):
    statusCode: Optional[int] = 200

# class NotifyBody(Body):
#     statusCode: Field(..., description="test")

class RunNotFound(ErrorDetails):
    """An error if a given run is not found."""

    id: Literal["RunNotFound"] = "RunNotFound"
    title: str = "Run Not Found"

#TOME: This works.
class NotifyNoCurrentRunFound(ErrorDetails):
    """An error if there is no current run to fetch."""

    id: Literal["NoCurrentRunFound"] = "NoCurrentRunFound"
    title: str = "No current run found"
    statusCode: int = 404


class RunAlreadyActive(ErrorDetails):
    """An error if one tries to create a new run while one is already active."""

    id: Literal["RunAlreadyActive"] = "RunAlreadyActive"
    title: str = "Run Already Active"


class ProtocolRunIsActive(ErrorDetails):
    """An error if one tries to create a maintenance run while a protocol run is active."""

    id: Literal["ProtocolRunIsActive"] = "ProtocolRunIsActive"
    title: str = "Protocol Run Is Active"


class RunNotIdle(ErrorDetails):
    """An error if one tries to delete a run that is not idle."""

    id: Literal["RunNotIdle"] = "RunNotIdle"
    title: str = "Run is not idle."
    detail: str = (
        "Run is currently active. Allow the run to finish or"
        " stop it with a `stop` action before attempting to modify it."
    )


class RunStopped(ErrorDetails):
    """An error if one tries to modify a stopped run."""

    id: Literal["RunStopped"] = "RunStopped"
    title: str = "Run Stopped"


class AllRunsLinks(BaseModel):
    """Links returned along with a collection of runs."""

    current: Optional[ResourceLink] = Field(
        None,
        description="Path to the currently active run, if a run is active.",
    )

#TOME: Double check that the async logic is correct. You also probably want to return actual stuff.
#TOME: When you type, you don't want it to strictly contain the current run ID. It just needs to strictly contain the topic and the message.
#TOME: I think you'll need some way to send status code, since you do utilize that on the client side from time to time...

TOPIC_PREFIX = "robot-server/maintenance_runs"

async def notify_maintenance_run(
        topic,
        message,
        current_run_id = None,
    ):

    if topic == TOPIC_PREFIX:
        #TOME: You'd want some assertion check here to make sure current run id exists. 
        if message is not None:
            links = AllRunsLinks(
                current=ResourceLink.construct(href=f"/maintenance_runs/{current_run_id}")
            )
            payload = NotifyBody.construct(data=message, links=links, statusCode=200)
        else:
            payload = NotifyNoCurrentRunFound(detail="No maintenance run currently running.")
    
    await notification_client.publish(topic=topic, message=payload)