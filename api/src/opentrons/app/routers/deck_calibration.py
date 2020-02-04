import typing
from fastapi import APIRouter, HTTPException
from opentrons.app.models import V1ErrorMessage
from opentrons.app.models.deck_calibration import DeckStart, DeckStartResponse, DeckCalibrationDispatch

router = APIRouter()


@router.post("/calibration/deck/start",
             description="Begin (or restart) a deck calibration session",
             responses={
                 201: {"model": DeckStartResponse},
                 403: {"model": V1ErrorMessage},
                 409: {"model": V1ErrorMessage}
             })
async def post_calibration_deck_start(command: DeckStart = DeckStart()) -> DeckStartResponse:
    raise HTTPException(500, "not implemented")


@router.post("/calibration/deck",
             description="Execute a deck calibration action",
             response_model=V1ErrorMessage)
async def post_calibration_deck(operation: DeckCalibrationDispatch) -> V1ErrorMessage:
    raise HTTPException(500, "not implemented")
