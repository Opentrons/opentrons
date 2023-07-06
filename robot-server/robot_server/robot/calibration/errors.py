from http import HTTPStatus

from opentrons_shared_data.errors import ErrorCodes
from robot_server.service.errors import ErrorDef, ErrorCreateDef


class CalibrationError(ErrorDef):
    NO_PIPETTE_ON_MOUNT = ErrorCreateDef(
        status_code=HTTPStatus.FORBIDDEN,
        title="No Pipette Attached",
        format_string="No pipette present on {mount} mount",
        error_code=ErrorCodes.PIPETTE_NOT_PRESENT.value.code,
    )
    NO_PIPETTE_ATTACHED = ErrorCreateDef(
        status_code=HTTPStatus.FORBIDDEN,
        title="No Pipette Attached",
        format_string="Cannot start {flow} with fewer than one pipette",
        error_code=ErrorCodes.PIPETTE_NOT_PRESENT.value.code,
    )
    BAD_LABWARE_DEF = ErrorCreateDef(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        title="Bad Labware Definition",
        format_string="Bad definition for tip rack under calibration",
        error_code=ErrorCodes.GENERAL_ERROR.value.code,
    )
    BAD_STATE_TRANSITION = ErrorCreateDef(
        status_code=HTTPStatus.CONFLICT,
        title="Illegal State Transition",
        format_string="The action {action} may not occur in the state {state}",
        error_code=ErrorCodes.GENERAL_ERROR.value.code,
    )
    NO_STATE_TRANSITION = ErrorCreateDef(
        status_code=HTTPStatus.CONFLICT,
        title="No State Transition",
        format_string="No transition available for state {state}",
        error_code=ErrorCodes.GENERAL_ERROR.value.code,
    )
    UNMET_STATE_TRANSITION_REQ = ErrorCreateDef(
        status_code=HTTPStatus.CONFLICT,
        title="Unmet State Transition Requirement",
        format_string="The command handler {handler} may not occur in the"
        ' state {state} when "{condition}" is not true',
        error_code=ErrorCodes.GENERAL_ERROR.value.code,
    )
    UNCALIBRATED_ROBOT = ErrorCreateDef(
        status_code=HTTPStatus.CONFLICT,
        title="No Calibration Data Found",
        format_string="Cannot start {flow} without robot calibration",
        error_code=ErrorCodes.GENERAL_ERROR.value.code,
    )
    ERROR_DURING_TRANSITION = ErrorCreateDef(
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
        title="Error During State Transition",
        format_string="Event {action} failed to transition " "from {state}: {error}",
        error_code=ErrorCodes.GENERAL_ERROR.value.code,
    )
