import typing
from fastapi import APIRouter
from opentrons.server.endpoints.calibration import models, session
from robot_server.service.models.json_api import request, response

StatusDataModel = response.ResponseDataModel[models.CalibrationSessionStatus]
StatusModel = response.ResponseModel[StatusDataModel]

RequestDataModel = request.RequestDataModel[typing.Union[models.JogPosition, models.SpecificPipette]]
RequestModel = request.RequestModel[RequestDataModel]


router = APIRouter()


@router.post("/session/check/{session_id}",
             response_model=StatusModel)
async def calibration_command(command: session.CalibrationCheckTrigger,
                              command_details: RequestModel) -> StatusModel:
    """"""
    session_id = command_details.data.id
    ## Is session_id a valid check session?
    return StatusModel({})

