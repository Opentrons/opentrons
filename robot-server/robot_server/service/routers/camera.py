import logging
import os
import tempfile
from http import HTTPStatus

from fastapi import APIRouter, HTTPException
from starlette.background import BackgroundTask
from starlette.responses import StreamingResponse
from opentrons.system import camera


log = logging.getLogger(__name__)

router = APIRouter()

JPG = "image/jpg"


@router.post("/camera/picture",
             description="Capture an image from the OT-2's onboard camera "
                         "and return it",
             responses={
                 HTTPStatus.OK: {
                     "content": {JPG: {}},
                     "description": "The image"
                 }
             })
async def post_picture_capture() -> StreamingResponse:
    """Take a picture"""
    filename = tempfile.mktemp(suffix=".jpg")

    try:
        await camera.take_picture(filename)
        log.info("Image taken at %s", filename)
        return StreamingResponse(open(filename, 'rb'),
                                 media_type=JPG,
                                 background=BackgroundTask(func=_cleanup,
                                                           filename=filename))
    except camera.CameraException as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                            detail=str(e))


def _cleanup(filename: str) -> None:
    """Clean up after sending the response"""
    try:
        if os.path.exists(filename):
            log.info("Deleting image at %s", filename)
            os.remove(filename)
    except OSError:
        pass
