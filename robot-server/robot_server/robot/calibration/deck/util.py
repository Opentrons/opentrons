from enum import Enum

from http import HTTPStatus
from robot_server.service.errors import BaseRobotServerError
from robot_server.service.json_api.errors import Error


class DeckCalibrationError(Enum):
    NO_PIPETTE = (
        HTTPStatus.FORBIDDEN,
        'No Pipettes Attached',
        'At least one pipette must be attached to the OT-2 to '
        'run deck calibration')


class DeckCalibrationException(BaseRobotServerError):
    def __init__(self, whicherror: DeckCalibrationError, *fmt_args):
        super().__init__(
            whicherror.value[0],
            Error(
                id=str(whicherror),
                status=str(whicherror.value[0]),
                title=whicherror.value[1],
                detail=whicherror.value[2].format(*fmt_args)
            )
        )
