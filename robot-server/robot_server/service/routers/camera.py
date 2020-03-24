from http import HTTPStatus

from fastapi import APIRouter
from starlette.responses import StreamingResponse


router = APIRouter()


@router.post("/camera/picture",
             description="Capture an image from the OT-2's onboard camera "
                         "and return it",
             responses={
                 HTTPStatus.OK: {
                     "content": {"image/png": {}},
                     "description": "The image"
                 }
             })
async def post_picture_capture() -> StreamingResponse:
    return StreamingResponse(
        content=iter([]),
        status_code=HTTPStatus.OK,
        media_type="image/png"
    )
