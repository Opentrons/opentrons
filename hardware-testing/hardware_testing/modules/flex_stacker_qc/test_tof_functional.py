"""Test TOF Sensor Functional."""

from typing import List, Union

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.flex_stacker import FlexStacker
from opentrons.drivers.flex_stacker.types import (
    Direction,
    StackerAxis,
    TOFSensor,
)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine(
            f"tof-{TOFSensor.X}-histogram-empty",
            [bool, str, CSVResult, str],
        ),
        CSVLine(
            f"tof-{TOFSensor.Z}-histogram-empty",
            [bool, str, CSVResult, str],
        ),
        CSVLine(
            f"tof-{TOFSensor.X}-histogram-tiprack",
            [bool, str, CSVResult, str],
        ),
        CSVLine(
            f"tof-{TOFSensor.Z}-histogram-tiprack",
            [bool, str, CSVResult, str],
        ),
    ]
    return lines


async def tof_sensors_installed(stacker: FlexStacker) -> bool:
    """Check if the tof sensor are installed."""
    tof_x = await stacker._driver.get_tof_sensor_status(TOFSensor.X)
    tof_z = await stacker._driver.get_tof_sensor_status(TOFSensor.Z)
    return tof_x.ok and tof_z.ok


async def test_tof_sensors_labware_detection(
    stacker: FlexStacker,
    report: CSVReport,
    section: str,
    sensor: TOFSensor,
    labware: str,
    axis: StackerAxis,
    direction: Direction = Direction.EXTEND,
) -> None:
    """Test that we can detect labware with the TOF sensor."""
    open = not await stacker._driver.get_hopper_door_closed()
    if open:
        print("Failed: Make sure to close the stacker door.")
        report(
            section,
            f"tof-{sensor.name}-histogram-{labware}",
            [
                False,
                "HOPPER_OPEN",
                CSVResult.FAIL,
                [],
            ],
        )
        return

    print(f"Getting histogram for {sensor}.")
    histogram = await stacker._driver.get_tof_histogram(sensor)

    print(f"Verifying Labware Presence for {sensor}.")
    labware_expected = labware != "empty"
    lbw_detected = await stacker.labware_detected(axis, direction)
    result = labware_expected == bool(lbw_detected)

    report(
        section,
        f"tof-{sensor.name}-histogram-{labware}",
        [
            result,
            "HISTOGRAM",
            CSVResult.from_bool(result),
            histogram.bins,
        ],
    )


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    if not stacker.is_simulated:
        ui.get_user_ready("Make sure both TOF sensors are installed.")

    print("Homing stacker X and Z axis.")
    await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
    await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)

    print("Test that we have no labware on the X")
    ui.get_user_ready("Make sure there is no labware on the stacker gripper position")
    await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    await test_tof_sensors_labware_detection(
        stacker, report, section, TOFSensor.X, "empty", StackerAxis.X, Direction.RETRACT
    )

    print("Test that we detect tiprack on the X home position")
    await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
    ui.get_user_ready("Add 1 tiprack to the stacker X")
    await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    await test_tof_sensors_labware_detection(
        stacker,
        report,
        section,
        TOFSensor.X,
        "tiprack",
        StackerAxis.X,
        Direction.RETRACT,
    )
    await stacker.home_axis(StackerAxis.X, Direction.EXTEND)

    print("Test that we have no labware on the Z")
    ui.get_user_ready(
        "Make sure there is no labware in the stacker and close the hopper door"
    )
    await stacker.close_latch()
    await test_tof_sensors_labware_detection(
        stacker, report, section, TOFSensor.Z, "empty", StackerAxis.Z
    )

    print("Test that we detect tiprack on the Z")
    ui.get_user_ready("Add 1 tiprack to the stacker Z and close the hopper door")
    await test_tof_sensors_labware_detection(
        stacker, report, section, TOFSensor.Z, "tiprack", StackerAxis.Z
    )
    ui.get_user_ready("Please remove all labware from the stacker.")
