from http import HTTPStatus
from fastapi import APIRouter, HTTPException
from opentrons.app.models import V1ErrorMessage
from opentrons.app.models.deck_calibration import DeckStart, \
    DeckStartResponse, DeckCalibrationDispatch

router = APIRouter()


@router.post("/calibration/deck/start",
             description="Begin (or restart) a deck calibration session",
             responses={
                 HTTPStatus.CREATED: {"model": DeckStartResponse},
                 HTTPStatus.FORBIDDEN: {"model": V1ErrorMessage},
                 HTTPStatus.CONFLICT: {"model": V1ErrorMessage}
             })
async def post_calibration_deck_start(command: DeckStart = DeckStart()) \
        -> DeckStartResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/calibration/deck",
             description="Execute a deck calibration action",
             response_model=V1ErrorMessage)
async def post_calibration_deck(operation: DeckCalibrationDispatch) \
        -> V1ErrorMessage:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")
