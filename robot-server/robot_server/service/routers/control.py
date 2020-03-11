from http import HTTPStatus
from starlette.responses import StreamingResponse
from fastapi import APIRouter, Query, HTTPException
from robot_server.service.models import V1BasicResponse
from robot_server.service.models import control

router = APIRouter()


@router.post("/identify",
             description="Blink the OT-2's gantry lights so you can pick it "
                         "out of a crowd")
async def post_identify(
        seconds: int = Query(...,
                             description="Time to blink the lights for")) \
        -> V1BasicResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


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


@router.get("/robot/positions",
            description="Get a list of useful positions",
            response_model=control.RobotPositions)
async def get_robot_positions() -> control.RobotPositions:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/robot/move",
             description="Move the robot's gantry to a position (usually to a "
                         "position retrieved from GET /robot/positions)",
             response_model=V1BasicResponse)
async def post_move_robot(robot_move_target: control.RobotMoveTarget)\
        -> V1BasicResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/robot/home",
             description="Home the robot",
             response_model=V1BasicResponse)
async def post_home_robot(robot_home_target: control. RobotHomeTarget) \
        -> V1BasicResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/robot/lights",
            description="Get the current status of the OT-2's rail lights",
            response_model=control.RobotLightState)
async def get_robot_light_state() -> control.RobotLightState:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/robot/lights",
             description="Turn the rail lights on or off",
             response_model=control.RobotLightState)
async def post_robot_light_state(robot_light_state: control.RobotLightState) \
        -> control.RobotLightState:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")
