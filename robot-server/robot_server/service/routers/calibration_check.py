import typing

from opentrons.server.endpoints.calibration.util import StateMachine, \
    StateMachineError
from starlette import status as http_status_codes
from fastapi import APIRouter, Depends
from starlette.requests import Request

from opentrons.server.endpoints.calibration.session import SessionManager, \
    CheckCalibrationSession, CalibrationSession, CalibrationCheckTrigger
from opentrons import types
from robot_server.service.dependencies import \
    get_calibration_session_manager, get_hardware
from opentrons.server.endpoints.calibration import models
from robot_server.service.errors import RobotServerError, Error
from robot_server.service.models.json_api.resource_links import ResourceLink
from robot_server.service.models.json_api.request import RequestModel, \
    json_api_request
from robot_server.service.models.json_api.response import ResponseDataModel, \
    ResponseModel, json_api_response


CalibrationSessionStatusResponse = json_api_response(
    attributes_model=models.CalibrationSessionStatus)

PipetteRequest = json_api_request(attributes_model=models.SpecificPipette)
JogRequest = json_api_request(attributes_model=models.JogPosition)


router = APIRouter()


def get_current_session(session_type: models.SessionType,
                        api_router: APIRouter) -> CalibrationSession:
    """Get the current session or raise a RobotServerError"""
    manager = get_calibration_session_manager()
    session = manager.sessions.get(session_type.value)
    if not session:
        # There is no session raise error
        raise RobotServerError(
            status_code=http_status_codes.HTTP_404_NOT_FOUND,
            error=Error(
                title="No session",
                detail=f"No {session_type} session exists. Please create one.",
                links={
                    "createSession": api_router.url_path_for(
                        create_session.__name__,
                        session_type=session_type.value)
                     }
                 )
        )
    return session


def get_check_session() -> CheckCalibrationSession:
    """
    A dependency for handlers that require a current session.

    Get the current active check calibration session
    """
    from robot_server.service.app import app
    # Return an upcasted CalibrationSession
    return get_current_session(  # type: ignore
        session_type=models.SessionType.check,
        api_router=app.router)


@router.get('/{session_type}/session',
            response_model=CalibrationSessionStatusResponse,
            response_model_exclude_unset=True,)
async def get_session(
        request: Request,
        session_type: models.SessionType) -> CalibrationSessionStatusResponse:
    """
    Get the current session

    :param request: Starlette request
    :param session_type: Session type
    """
    session = get_current_session(session_type, request.app)
    return create_session_response(session, request)  # type: ignore


@router.post('/{session_type}/session',
             response_model=CalibrationSessionStatusResponse,
             status_code=http_status_codes.HTTP_201_CREATED,
             response_model_exclude_unset=True)
async def create_session(
        request: Request,
        session_type: models.SessionType,
        session_manager: SessionManager = Depends(
            get_calibration_session_manager),
        hardware=Depends(get_hardware))\
        -> CalibrationSessionStatusResponse:
    """
    Handler that creates a session

    :param request: The Starlete request object
    :param session_type: The session type requested
    :param session_manager: Dependency injected session manager
    :param hardware: Dependency injected hardware
    """
    current_session = session_manager.sessions.get(session_type)
    if not current_session:
        new_session = await CheckCalibrationSession.build(hardware)
        session_manager.sessions[session_type] = new_session
        return create_session_response(new_session, request)
    else:
        raise RobotServerError(
            status_code=http_status_codes.HTTP_409_CONFLICT,
            error=Error(
                title="Conflict",
                detail=f"A {session_type} session exists. Please delete to"
                       f" proceed.",
                links={
                    "deleteSession": request.app.url_path_for(
                        delete_session.__name__,
                        session_type=session_type.value)
                }
            )
        )


@router.delete('/{session_type}/session',
               response_model=CalibrationSessionStatusResponse,
               response_model_exclude_unset=True)
async def delete_session(
        request: Request,
        session_type: models.SessionType,
        session_manager: SessionManager = Depends(
            get_calibration_session_manager
        )) -> CalibrationSessionStatusResponse:
    """Delete session handler"""
    session = get_current_session(session_type, request.app)
    await session.delete_session()   # type: ignore
    del session_manager.sessions[session_type]
    return create_session_response(session, request)  # type: ignore


@router.post('/{session_type}/session/loadLabware',
             response_model=CalibrationSessionStatusResponse,
             response_model_exclude_unset=True)
async def load_labware(
        request: Request,
        session_type: models.SessionType,
        session: CheckCalibrationSession = Depends(get_check_session)) \
        -> CalibrationSessionStatusResponse:
    """Load labware handler"""
    await trigger_state(request, session, CalibrationCheckTrigger.load_labware)
    return create_session_response(session, request)


@router.post('/{session_type}/session/preparePipette',
             response_model=CalibrationSessionStatusResponse,
             response_model_exclude_unset=True)
async def prepare_pipette(
        request: Request,
        session_type: models.SessionType,
        pipette: PipetteRequest,
        session: CheckCalibrationSession = Depends(get_check_session)) \
        -> CalibrationSessionStatusResponse:
    """Prepare pipette handler"""
    await trigger_state(request, session,
                        CalibrationCheckTrigger.prepare_pipette,
                        pipette_id=pipette.data.attributes.pipetteId)
    return create_session_response(session, request)


@router.post('/{session_type}/session/pickUpTip',
             response_model=CalibrationSessionStatusResponse,
             response_model_exclude_unset=True)
async def pick_up_tip(
        request: Request,
        session_type: models.SessionType,
        pipette: PipetteRequest,
        session: CheckCalibrationSession = Depends(get_check_session)) \
        -> CalibrationSessionStatusResponse:
    """Pick up tip handler"""
    await trigger_state(request, session,
                        CalibrationCheckTrigger.pick_up_tip,
                        pipette_id=pipette.data.attributes.pipetteId)
    return create_session_response(session, request)


@router.post('/{session_type}/session/invalidateTip',
             response_model=CalibrationSessionStatusResponse,
             response_model_exclude_unset=True)
async def invalidate_tip(
        request: Request,
        session_type: models.SessionType,
        pipette: PipetteRequest,
        session: CheckCalibrationSession = Depends(get_check_session)) \
        -> CalibrationSessionStatusResponse:
    """Invalidate tip handler"""
    await trigger_state(request, session,
                        CalibrationCheckTrigger.invalidate_tip,
                        pipette_id=pipette.data.attributes.pipetteId)
    return create_session_response(session, request)


@router.post('/{session_type}/session/confirmTip',
             response_model=CalibrationSessionStatusResponse,
             response_model_exclude_unset=True)
async def confirm_tip(
        request: Request,
        session_type: models.SessionType,
        pipette: PipetteRequest,
        session: CheckCalibrationSession = Depends(get_check_session)) \
        -> CalibrationSessionStatusResponse:
    """Confirm tip handler"""
    await trigger_state(request, session,
                        CalibrationCheckTrigger.confirm_tip_attached,
                        pipette_id=pipette.data.attributes.pipetteId)
    return create_session_response(session, request)


@router.post('/{session_type}/session/jog',
             response_model=CalibrationSessionStatusResponse,
             response_model_exclude_unset=True)
async def jog_handler(
        request: Request,
        session_type: models.SessionType,
        jog: JogRequest,
        session: CheckCalibrationSession = Depends(get_check_session)) \
        -> CalibrationSessionStatusResponse:
    """Jog handler"""
    await trigger_state(request, session,
                        CalibrationCheckTrigger.jog,
                        pipette_id=jog.data.attributes.pipetteId,
                        vector=types.Point(x=jog.data.attributes.vector[0],
                                           y=jog.data.attributes.vector[1],
                                           z=jog.data.attributes.vector[2]))
    return create_session_response(session, request)


@router.post('/{session_type}/session/confirmStep',
             response_model=CalibrationSessionStatusResponse,
             response_model_exclude_unset=True)
async def confirm_step(
        request: Request,
        session_type: models.SessionType,
        pipette: PipetteRequest,
        session: CheckCalibrationSession = Depends(get_check_session)) \
        -> CalibrationSessionStatusResponse:
    """Confirm step handler"""
    await trigger_state(request, session,
                        CalibrationCheckTrigger.confirm_step,
                        pipette_id=pipette.data.attributes.pipetteId)
    return create_session_response(session, request)


async def trigger_state(request: Request,
                        state_machine: StateMachine,
                        trigger: str,
                        *args, **kwargs):
    """Trigger a state transition"""
    try:
        await state_machine.trigger_transition(trigger, *args, **kwargs)
    except StateMachineError as e:
        raise RobotServerError(
            status_code=http_status_codes.HTTP_409_CONFLICT,
            error=Error(
                title="Exception",
                detail=str(e),
                links=create_next_step_links(
                    state_machine, request.app)   # type: ignore
            )
        )


TRIGGER_TO_NAME: typing.Dict[str, str] = {
    CalibrationCheckTrigger.load_labware: load_labware.__name__,
    CalibrationCheckTrigger.prepare_pipette: prepare_pipette.__name__,
    CalibrationCheckTrigger.jog: jog_handler.__name__,
    CalibrationCheckTrigger.pick_up_tip: pick_up_tip.__name__,
    CalibrationCheckTrigger.confirm_tip_attached: confirm_tip.__name__,
    CalibrationCheckTrigger.invalidate_tip: invalidate_tip.__name__,
    CalibrationCheckTrigger.confirm_step: confirm_step.__name__,
    CalibrationCheckTrigger.exit: delete_session.__name__,
    # CalibrationCheckTrigger.reject_calibration: "reject_calibration",
    # CalibrationCheckTrigger.no_pipettes: "no_pipettes",
}


def create_next_step_links(session: CheckCalibrationSession,
                           api_router: APIRouter) \
        -> typing.Dict[str, ResourceLink]:
    """Create the links for next steps in the process"""
    links = {}
    for trigger in session.get_potential_triggers():
        route_name = TRIGGER_TO_NAME.get(trigger)
        if route_name:
            url = api_router.url_path_for(
                route_name,
                session_type=models.SessionType.check.value)

            params = session.format_params(trigger)
            if url:
                links[trigger] = ResourceLink(
                    href=url,
                    meta={
                        'params': params
                    }
                )
    return links


def create_session_response(session: CheckCalibrationSession,
                            request: Request) \
        -> CalibrationSessionStatusResponse:
    """Create session response"""
    links = create_next_step_links(session,
                                   request.app)
    instruments = {
        str(k): models.AttachedPipette(model=v.model,
                                      name=v.name,
                                      tip_length=v.tip_length,
                                      has_tip=v.has_tip,
                                      tiprack_id=v.tiprack_id)
        for k, v in session.pipette_status().items()
    }
    labware = [
            models.LabwareStatus(alternatives=data.alternatives,
                                slot=data.slot,
                                id=data.id,
                                forPipettes=data.forPipettes,
                                loadName=data.loadName,
                                namespace=data.namespace,
                                version=data.version) for data in
            session.labware_status.values()
        ]

    status = models.CalibrationSessionStatus(
        instruments=instruments,
        currentStep=session.current_state_name,
        labware=labware,
    )
    return CalibrationSessionStatusResponse(
        data=ResponseDataModel.create(status, resource_id="check"),
        links=links,
    )
