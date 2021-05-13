from typing import List

import pytest
from opentrons.drivers.types import Temperature, PlateTemperature
from opentrons.hardware_control.modules.plate_temp_status import \
    PlateTemperatureStatus
from opentrons.hardware_control.modules.types import TemperatureStatus


@pytest.mark.parametrize(
    argnames=["temps", "expected"],
    argvalues=[
        # No temperature readings
        [[], TemperatureStatus.ERROR],
        # Too few readings
        [[Temperature(current=50, target=None)] * (
                PlateTemperatureStatus.MIN_SAMPLES_UNDER_THRESHOLD - 1),
         TemperatureStatus.IDLE],
        # No target
        [[Temperature(current=50,
                      target=None)] * PlateTemperatureStatus.MIN_SAMPLES_UNDER_THRESHOLD,
         TemperatureStatus.IDLE],
        # All readings at target temperature
        [[
             Temperature(current=50,
                         target=50)] * PlateTemperatureStatus.MIN_SAMPLES_UNDER_THRESHOLD,
         TemperatureStatus.HOLDING
         ],
        # All are close enough. Half the buffer a bit above and half a bit below.
        [[Temperature(current=50 + PlateTemperatureStatus.TEMP_THRESHOLD / 2, target=50),
          Temperature(current=50 - PlateTemperatureStatus.TEMP_THRESHOLD / 2, target=50)] *
         int(PlateTemperatureStatus.MIN_SAMPLES_UNDER_THRESHOLD / 2),
         TemperatureStatus.HOLDING],
        # One reading not holding
        [[Temperature(current=50 + PlateTemperatureStatus.TEMP_THRESHOLD * 2, target=50)], TemperatureStatus.COOLING],
        [[Temperature(current=50 - PlateTemperatureStatus.TEMP_THRESHOLD * 2, target=50)], TemperatureStatus.HEATING],
        # Enough readings not holding
        [[Temperature(current=50, target=50)] * (PlateTemperatureStatus.MIN_SAMPLES_UNDER_THRESHOLD - 1) +
         [Temperature(current=50 + PlateTemperatureStatus.TEMP_THRESHOLD * 2, target=50)],
         TemperatureStatus.COOLING],
        [[Temperature(current=50, target=50)] * (PlateTemperatureStatus.MIN_SAMPLES_UNDER_THRESHOLD - 1) +
         [Temperature(current=50 - PlateTemperatureStatus.TEMP_THRESHOLD *2, target=50)],
         TemperatureStatus.HEATING],
    ]
)
def test_plate_temp_status(temps: List[PlateTemperature], expected: TemperatureStatus) -> None:
    """It should set the status correctly based on temperature readings."""
    status = PlateTemperatureStatus()
    for t in temps:
        status.update(t)
    assert status.status == expected
