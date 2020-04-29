import typing
from fastapi import APIRouter

from pydantic import BaseModel, Field

from opentrons.server.endpoints.calibration import models, session

from robot_server.service.models.control import Point
from robot_server.service.models.json_api import request, response


router = APIRouter()


class CheckCommand(BaseModel):
    """A basic calibration check command"""
    command: session.CalibrationCheckTrigger = \
        Field(...,
              description="The calibration check command to issue to session")

    vector: typing.Optional[Point] = \
        Field(...,
              description=f"A point in deck coordinates (x, y, z). Mandatory "
                          f"if command is "
                          f"{session.CalibrationCheckTrigger.jog.value}",
              min_items=3,
              max_items=3)


StatusDataModel = response.ResponseDataModel[models.CalibrationSessionStatus]
StatusModel = response.ResponseModel[StatusDataModel]

RequestDataModel = request.RequestDataModel[CheckCommand]
RequestModel = request.RequestModel[RequestDataModel]


@router.post("/session/{session_id}/check_command",
             response_model=StatusModel)
async def calibration_command(session_id: str,
                              command_details: RequestModel) -> StatusModel:
    """Issue a calibration check command to the session"""
    pass
