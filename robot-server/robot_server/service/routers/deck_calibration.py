from starlette import status
from fastapi import APIRouter, Depends
from opentrons.hardware_control import HardwareAPILike
import opentrons.deck_calibration.endpoints as dc

from robot_server.service.dependencies import get_hardware
from robot_server.service.exceptions import V1HandlerError
from robot_server.service.models import V1BasicResponse
from robot_server.service.models.deck_calibration import DeckStart, \
    DeckStartResponse, DeckCalibrationDispatch

router = APIRouter()


@router.post("/calibration/deck/start",
             description="Begin (or restart) a deck calibration session",
             responses={
                 status.HTTP_403_FORBIDDEN: {"model": V1BasicResponse},
                 status.HTTP_409_CONFLICT: {"model": V1BasicResponse}
             },
             response_model=DeckStartResponse,
             status_code=status.HTTP_201_CREATED)
async def post_calibration_deck_start(
        command: DeckStart = DeckStart(),
        hardware: HardwareAPILike = Depends(get_hardware)) \
        -> DeckStartResponse:
    try:
        res = await dc.create_session(command.force, hardware)
        return DeckStartResponse(token=res.token, pipette=res.pipette)
    except dc.SessionForbidden as e:
        raise V1HandlerError(status_code=status.HTTP_403_FORBIDDEN,
                             message=str(e))
    except dc.SessionInProgress as e:
        raise V1HandlerError(status_code=status.HTTP_409_CONFLICT,
                             message=str(e))


@router.post("/calibration/deck",
             description="Execute a deck calibration action",
             response_model=V1BasicResponse,
             responses={
                 418: {"model": V1BasicResponse},
                 status.HTTP_403_FORBIDDEN: {"model": V1BasicResponse},
                 status.HTTP_400_BAD_REQUEST: {"model": V1BasicResponse},
             })
async def post_calibration_deck(operation: DeckCalibrationDispatch) \
        -> V1BasicResponse:
    try:
        res = await dc.dispatch(
            token=str(operation.token),
            command=operation.command,
            command_data=operation.dict(exclude={'token', 'command'},
                                        exclude_none=True))

        if not res.success:
            raise AssertionError(res.message)

        return V1BasicResponse(message=res.message)
    except dc.NoSessionInProgress as e:
        message = str(e)
        status_code = 418
    except dc.SessionForbidden as e:
        message = str(e)
        status_code = status.HTTP_403_FORBIDDEN
    except AssertionError as e:
        message = str(e)
        status_code = status.HTTP_400_BAD_REQUEST
    except Exception as e:
        message = f'Exception {type(e)} raised by dispatch of {operation}: {e}'
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    raise V1HandlerError(status_code=status_code, message=message)
