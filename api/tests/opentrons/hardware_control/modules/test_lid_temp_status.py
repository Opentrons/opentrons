import pytest
from opentrons.drivers.types import Temperature
from opentrons.hardware_control.modules.lid_temp_status import \
    LidTemperatureStatus
from opentrons.hardware_control.modules.types import TemperatureStatus


@pytest.mark.parametrize(
    argnames=["temp", "expected"],
    argvalues=[
        # No target
        [Temperature(current=50, target=None), TemperatureStatus.IDLE],
        # At target
        [Temperature(current=50, target=50), TemperatureStatus.HOLDING],
        # Close enough to target
        [Temperature(current=50 + LidTemperatureStatus.TEMP_THRESHOLD / 2,
                     target=50), TemperatureStatus.HOLDING],
        [Temperature(current=50 - LidTemperatureStatus.TEMP_THRESHOLD / 2,
                     target=50), TemperatureStatus.HOLDING],
        [Temperature(current=50 + LidTemperatureStatus.TEMP_THRESHOLD,
                     target=50), TemperatureStatus.HOLDING],
        [Temperature(current=50 - LidTemperatureStatus.TEMP_THRESHOLD,
                     target=50), TemperatureStatus.HOLDING],
        # Above target
        [Temperature(current=50 + (LidTemperatureStatus.TEMP_THRESHOLD + 1),
                     target=50), TemperatureStatus.IDLE],
        # Below target
        [Temperature(current=50 - (LidTemperatureStatus.TEMP_THRESHOLD + 1),
                     target=50), TemperatureStatus.HEATING]

    ]
)
def test_lid_temp_status(temp: Temperature, expected: TemperatureStatus) -> None:
    """It should set the status correctly based on temperature reading."""
    status = LidTemperatureStatus()
    assert status.update(temp) == expected
    assert status.status == expected


def test_lid_temp_status_error() -> None:
    """It should be error status when uninitialized ."""
    assert LidTemperatureStatus().status == TemperatureStatus.ERROR
