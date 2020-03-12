from http import HTTPStatus

from opentrons.hardware_control import HardwareAPILike
from opentrons.hardware_control.types import Axis
from opentrons.types import Mount
from starlette.responses import StreamingResponse
from fastapi import APIRouter, Query, HTTPException, Depends

from robot_server.service.dependencies import get_hardware
from robot_server.service.exceptions import V1HandlerError
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
            response_model=control.RobotPositionsResponse)
async def get_robot_positions() -> control.RobotPositionsResponse:
    """
    Positions determined experimentally by issuing move commands. Change
    pipette position offsets the mount to the left or right such that a user
    can easily access the pipette mount screws with a screwdriver. Attach tip
    position places either pipette roughly in the front-center of the deck area
    """
    robot_positions = control.RobotPositions(
        change_pipette=control.ChangePipette(target=control.MotionTarget.mount,
                                             left=[300, 40, 30],
                                             right=[95, 30, 30]),
        attach_tip=control.AttachTip(target=control.MotionTarget.pipette,
                                     point=[200, 90, 150])
    )
    return control.RobotPositionsResponse(positions=robot_positions)


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
async def post_home_robot(
        robot_home_target: control.RobotHomeTarget,
        hardware: HardwareAPILike = Depends(get_hardware)) \
        -> V1BasicResponse:
    """Home the robot or one of the pipettes"""
    mount = robot_home_target.mount
    target = robot_home_target.target

    if target == control.HomeTarget.pipette:
        await hardware.home([Axis.by_mount(Mount[mount.upper()])])
        await hardware.home_plunger(Mount[mount.upper()])
        message = f"Pipette on {mount} homed successfully"
    elif target == control.HomeTarget.robot:
        await hardware.home()
        message = "Homing robot."
    else:
        raise V1HandlerError(message=f"{target} is invalid", status_code=400)

    return V1BasicResponse(message=message)


@router.get("/robot/lights",
            description="Get the current status of the OT-2's rail lights",
            response_model=control.RobotLightState)
async def get_robot_light_state(
        hardware: HardwareAPILike = Depends(get_hardware)) \
        -> control.RobotLightState:
    on = hardware.get_lights()
    return control.RobotLightState(on=on.get('rails', False))


@router.post("/robot/lights",
             description="Turn the rail lights on or off",
             response_model=control.RobotLightState)
async def post_robot_light_state(
        robot_light_state: control.RobotLightState,
        hardware: HardwareAPILike = Depends(get_hardware)) \
        -> control.RobotLightState:
    await hardware.set_lights(rails=robot_light_state.on)
    return robot_light_state
