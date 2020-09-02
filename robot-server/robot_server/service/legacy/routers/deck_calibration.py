from uuid import UUID

from opentrons.config import robot_configs
from starlette import status
from fastapi import APIRouter, Depends
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import ThreadManager
import opentrons.deck_calibration.endpoints as dc

from robot_server.service.dependencies import get_hardware
from robot_server.service.errors import V1HandlerError
from robot_server.service.legacy.models import V1BasicResponse
from robot_server.service.legacy.models.deck_calibration import DeckStart, \
    DeckStartResponse, DeckCalibrationDispatch, PipetteDeckCalibration, \
    CalibrationStatus, DeckCalibrationStatus, DeckCalibrationData, MatrixType

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
        hardware: ThreadManager = Depends(get_hardware)) \
        -> DeckStartResponse:
    try:
        res = await dc.create_session(command.force, hardware)
        return DeckStartResponse(token=UUID(res.token),
                                 pipette=PipetteDeckCalibration(**res.pipette))
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


@router.get("/calibration/status",
            description="Get the calibration status",
            response_model=CalibrationStatus)
async def get_calibration_status(
        hardware: ThreadManager = Depends(get_hardware)) -> CalibrationStatus:
    robot_conf = robot_configs.load()
    if ff.enable_calibration_overhaul():
        deck_cal = hardware.robot_calibration.deck_calibration
        deck_cal_data = DeckCalibrationData(
            type=MatrixType.attitude,
            matrix=deck_cal.attitude,
            lastModified=deck_cal.last_modified,
            pipetteCalibratedWith=deck_cal.pipette_calibrated_with,
            tiprack=deck_cal.tiprack)
    else:
        deck_cal_data = DeckCalibrationData(
            type=MatrixType.affine,
            matrix=robot_conf.gantry_calibration)

    return CalibrationStatus(
        deckCalibration=DeckCalibrationStatus(
            status=hardware.validate_calibration(),
            data=deck_cal_data),
        instrumentCalibration=robot_conf.instrument_offset)
