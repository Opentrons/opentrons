from typing import List

import pytest
from opentrons.drivers.types import Temperature, PlateTemperature
from opentrons.hardware_control.modules.plate_temp_status import PlateTemperatureStatus
from opentrons.hardware_control.modules.types import TemperatureStatus

TEMP_DIFF_ABOVE_THRESHOLD = PlateTemperatureStatus.TEMP_THRESHOLD * 2

TEMP_DIFF_BELOW_THRESHOLD = PlateTemperatureStatus.TEMP_THRESHOLD / 2

MIN_SAMPLES_FOR_HOLD = PlateTemperatureStatus.MIN_SAMPLES_UNDER_THRESHOLD

ONE_TOO_FEW_SAMPLES = MIN_SAMPLES_FOR_HOLD - 1


@pytest.mark.parametrize(
    argnames=["temps", "expected"],
    argvalues=[
        # No temperature readings
        [[], TemperatureStatus.ERROR],
        # One too few readings
        [
            [Temperature(current=50, target=None)] * ONE_TOO_FEW_SAMPLES,
            TemperatureStatus.IDLE,
        ],
        # No target
        [
            [Temperature(current=50, target=None)] * MIN_SAMPLES_FOR_HOLD,
            TemperatureStatus.IDLE,
        ],
        # All readings at target temperature
        [
            [Temperature(current=50, target=50)] * MIN_SAMPLES_FOR_HOLD,
            TemperatureStatus.HOLDING,
        ],
        # All are close enough. Half the buffer a bit above and half a bit below.
        [
            [
                Temperature(current=50 + TEMP_DIFF_BELOW_THRESHOLD, target=50),
                Temperature(current=50 - TEMP_DIFF_BELOW_THRESHOLD, target=50),
            ]
            * int(MIN_SAMPLES_FOR_HOLD / 2),
            TemperatureStatus.HOLDING,
        ],
        # One reading above target
        [
            [Temperature(current=50 + TEMP_DIFF_ABOVE_THRESHOLD, target=50)],
            TemperatureStatus.COOLING,
        ],
        # One reading below target
        [
            [Temperature(current=50 - TEMP_DIFF_ABOVE_THRESHOLD, target=50)],
            TemperatureStatus.HEATING,
        ],
        # All samples are the same but one that is above threshold
        [
            [Temperature(current=50, target=50)] * ONE_TOO_FEW_SAMPLES
            + [Temperature(current=50 + TEMP_DIFF_ABOVE_THRESHOLD, target=50)],
            TemperatureStatus.COOLING,
        ],
        # All samples are the same but one that is below threshold
        [
            [Temperature(current=50, target=50)] * ONE_TOO_FEW_SAMPLES
            + [Temperature(current=50 - TEMP_DIFF_ABOVE_THRESHOLD, target=50)],
            TemperatureStatus.HEATING,
        ],
    ],
)
def test_plate_temp_status(
    temps: List[PlateTemperature], expected: TemperatureStatus
) -> None:
    """It should set the status correctly based on temperature readings."""
    status = PlateTemperatureStatus()
    for t in temps:
        status.update(t)
    assert status.status == expected
