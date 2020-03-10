from http import HTTPStatus
from fastapi import APIRouter, HTTPException
from robot_server.service.models import V1BasicResponse
from robot_server.service.models.deck_calibration import DeckStart, \
    DeckStartResponse, DeckCalibrationDispatch

router = APIRouter()


@router.post("/calibration/deck/start",
             description="Begin (or restart) a deck calibration session",
             responses={
                 HTTPStatus.CREATED: {"model": DeckStartResponse},
                 HTTPStatus.FORBIDDEN: {"model": V1BasicResponse},
                 HTTPStatus.CONFLICT: {"model": V1BasicResponse}
             })
async def post_calibration_deck_start(command: DeckStart = DeckStart()) \
        -> DeckStartResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/calibration/deck",
             description="Execute a deck calibration action",
             response_model=V1BasicResponse)
async def post_calibration_deck(operation: DeckCalibrationDispatch) \
        -> V1BasicResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")
