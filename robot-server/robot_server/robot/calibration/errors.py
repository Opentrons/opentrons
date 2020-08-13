from http import HTTPStatus

from robot_server.service.errors import ErrorDef, ErrorCreateDef


class CalibrationError(ErrorDef):
    NO_PIPETTE_ON_MOUNT = ErrorCreateDef(
        status_code=HTTPStatus.FORBIDDEN,
        title='No Pipette Attached',
        format_string='No pipette present on {mount} mount')
    NO_PIPETTE_ATTACHED = ErrorCreateDef(
        status_code=HTTPStatus.FORBIDDEN,
        title='No Pipette Attached',
        format_string='Cannot start {flow} with fewer than one pipette')
    BAD_LABWARE_DEF = ErrorCreateDef(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        title='Bad Labware Definition',
        format_string='Bad definition for tip rack under calibration')
    BAD_STATE_TRANSITION = ErrorCreateDef(
        status_code=HTTPStatus.CONFLICT,
        title='Illegal State Transition',
        format_string='The action {action} may not occur in the state {state}'
    )
    NO_STATE_TRANSITION = ErrorCreateDef(
        status_code=HTTPStatus.CONFLICT,
        title='No State Transition',
        format_string='No transition available for state {state}'
    )
    ERROR_DURING_TRANSITION = ErrorCreateDef(
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
        title='Error During State Transition',
        format_string='Event {action} failed to transition '
                      'from {state}: {error}'
    )
