from enum import Enum

from http import HTTPStatus
from robot_server.service.errors import RobotServerError
from robot_server.service.json_api.errors import Error


class TipCalibrationError(Enum):
    NO_PIPETTE = (
        HTTPStatus.FORBIDDEN,
        'No Pipette Attached',
        'No pipette present on {} mount')
    BAD_DEF = (
        HTTPStatus.UNPROCESSABLE_ENTITY,
        'Bad Labware Definition',
        'Bad definition for tip rack under calibration')


class TipCalibrationException(RobotServerError):
    def __init__(self, whicherror: TipCalibrationError, *fmt_args):
        super().__init__(
            whicherror.value[0],
            Error(
                id=str(whicherror),
                status=str(whicherror.value[0]),
                title=whicherror.value[1],
                detail=whicherror.value[2].format(*fmt_args)
            )
        )
