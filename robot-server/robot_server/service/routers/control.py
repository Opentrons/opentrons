import typing
from http import HTTPStatus
from starlette.responses import StreamingResponse
from fastapi import APIRouter, Query, HTTPException
from robot_server.service.models import V1ErrorMessage
from robot_server.service.models import control

router = APIRouter()


@router.post("/identify",
             description="Blink the OT-2's gantry lights so you can pick it "
                         "out of a crowd")
async def post_identify(
        seconds: int = Query(...,
                             description="Time to blink the lights for")) \
        -> V1ErrorMessage:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/modules",
            description="Describe the modules attached to the OT-2",
            response_model=control.Modules)
async def get_modules() -> control.Modules:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/modules/{serial}/data",
            description="Get live data for a specific module",
            summary="This is similar to the values in GET /modules, but for "
                    "only a specific currently-attached module",
            response_model=control.ModuleSerial)
async def get_module_serial(serial: str) -> control.ModuleSerial:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/modules/{serial}",
             description="Execute a command on a specific module",
             summary="Command a module to take an action. Valid actions depend"
                     " on the specific module attached, which is the model "
                     "value from GET /modules/{serial}/data or GET /modules",
             response_model=control.SerialCommandResponse)
async def post_serial_command(serial: str, command: control.SerialCommand)\
        -> control.SerialCommandResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/modules/{serial}/update",
             description="Initiate a firmware update on a specific module",
             summary="Command robot to flash its bundled firmware file for "
                     "this module's type to this specific module",
             response_model=V1ErrorMessage)
async def post_serial_update(serial: str) -> V1ErrorMessage:
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


@router.get("/pipettes",
            description="Get the pipettes currently attached",
            summary="This endpoint lists properties of the pipettes currently "
                    "attached to the robot like name, model, and mount. It "
                    "queries a cached value unless the refresh query parameter"
                    " is set to true, in which case it will actively scan for "
                    "pipettes. This requires disabling the pipette motors "
                    "(which is done automatically) and therefore should only "
                    "be done through user intent",
            response_model=control.Pipette)
async def get_pipettes(refresh: bool) -> control.Pipette:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/motors/engaged",
            description="Query which motors are engaged and holding",
            response_model=control.EngagedMotors)
async def get_engaged_motors() -> control.EngagedMotors:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/motors/disengage",
             description="Disengage a motor or set of motors",
             response_model=V1ErrorMessage)
async def post_disengage_motors(motors: typing.List[control.MotorName]) \
        -> V1ErrorMessage:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/robot/positions",
            description="Get a list of useful positions",
            response_model=control.RobotPositions)
async def get_robot_positions() -> control.RobotPositions:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/robot/move",
             description="Move the robot's gantry to a position (usually to a "
                         "position retrieved from GET /robot/positions)",
             response_model=V1ErrorMessage)
async def post_move_robot(robot_move_target: control.RobotMoveTarget)\
        -> V1ErrorMessage:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/robot/home",
             description="Home the robot",
             response_model=V1ErrorMessage)
async def post_home_robot(robot_home_target: control. RobotHomeTarget) \
        -> V1ErrorMessage:
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
