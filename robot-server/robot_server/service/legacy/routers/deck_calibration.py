from fastapi import APIRouter, Depends
from typing_extensions import Protocol

from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.protocols import Calibratable, AsyncioConfigurable
from opentrons.calibration_storage import helpers

from robot_server.service.dependencies import get_hardware
from robot_server.service.legacy.models.deck_calibration import (
    CalibrationStatus,
    DeckCalibrationStatus,
    DeckCalibrationData,
    MatrixType,
    InstrumentCalibrationStatus,
    InstrumentOffset,
)
from robot_server.service.shared_models import calibration as cal_model

router = APIRouter()

DEFAULT_INSTR_OFFSET = InstrumentOffset(single=(0, 0, 0), multi=(0, 0, 0))


class TMCalibratable(AsyncioConfigurable, Calibratable, Protocol):
    ...


@router.get(
    "/calibration/status",
    description="Get the calibration status",
    response_model=CalibrationStatus,
)
async def get_calibration_status(
    hardware: ThreadManager[TMCalibratable] = Depends(get_hardware),
) -> CalibrationStatus:
    # TODO: AA 12-01-2020 Instrument offset has been deprecated. We should
    # exclude instrument calibration in a future refactor
    instr_offset = InstrumentCalibrationStatus(  # always load default values
        right=DEFAULT_INSTR_OFFSET, left=DEFAULT_INSTR_OFFSET
    )

    deck_cal = hardware.robot_calibration.deck_calibration
    status = cal_model.CalibrationStatus(**helpers.convert_to_dict(deck_cal.status))
    deck_cal_data = DeckCalibrationData(
        type=MatrixType.attitude,
        matrix=deck_cal.attitude,
        lastModified=deck_cal.last_modified,
        pipetteCalibratedWith=deck_cal.pipette_calibrated_with,
        tiprack=deck_cal.tiprack,
        source=deck_cal.source,
        status=status,
    )

    return CalibrationStatus(
        deckCalibration=DeckCalibrationStatus(
            status=hardware.validate_calibration(), data=deck_cal_data
        ),
        instrumentCalibration=instr_offset,
    )
