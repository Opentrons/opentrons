"""Test TOF Sensor Functional."""

import statistics

from collections import defaultdict
from typing import Dict, List, Optional, Union

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from .utils import verify_platform_location

from opentrons.hardware_control.modules.flex_stacker import FlexStacker
from opentrons.drivers.flex_stacker.types import (
    Direction,
    StackerAxis,
    TOFSensor,
)

# Number of histogram samples for creating runtime baseline
DEFAULT_SAMPLES = 5
DEFAULT_DEVIATION = 8


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


async def create_runtime_baseline(
    stacker: FlexStacker,
    sensor: TOFSensor,
    samples: int = DEFAULT_SAMPLES,
    deviation: int = DEFAULT_DEVIATION,
) -> Dict[int, List[float]]:
    """Creates the runtime baseline.

    This takes N histogram samples of the sensor and computes the baseline.

    """
    baseline = defaultdict(list)
    aggregate = defaultdict(lambda: defaultdict(list))  # type: ignore
    for _ in range(samples):
        histogram = await stacker._driver.get_tof_histogram(sensor)
        for zone, zone_bins in histogram.bins.items():
            for bin, value in enumerate(zone_bins):
                aggregate[zone][bin].append(value)

    # Iterate through the per-index bin map and calculate the threshold
    # for that specific bin.
    for zone, bins_dict in aggregate.items():
        for bins in bins_dict.values():  # type: ignore
            mean = sum(bins) / len(bins)  # type: ignore
            std = statistics.pstdev(bins)  # type: ignore
            threshold = float("%.2f" % (mean + (std * deviation)))  # type: ignore
            baseline[zone].append(threshold)
    return baseline


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
    runtime_baseline: Optional[Dict[int, List[float]]] = None,
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

    lbw_detected = await stacker.labware_detected(axis, direction, histogram)
    baseline_result = labware_expected == bool(lbw_detected)
    print(f"BASELINE RESULT: {baseline_result}")

    lbw_detected = await stacker.labware_detected(
        axis, direction, histogram, runtime_baseline
    )
    runtime_result = labware_expected == bool(lbw_detected)
    print(f"RUNTIME RESULT: {runtime_result}")

    report(
        section,
        f"tof-{sensor.name}-histogram-{labware}",
        [
            baseline_result,
            "HISTOGRAM",
            CSVResult.from_bool(runtime_result),
            str(histogram.bins),
        ],
    )


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    print("Homing stacker X and Z axis.")
    await verify_platform_location(stacker)
    assert (
        await stacker._driver.get_hopper_door_closed()
    ), "Failed: Make sure to close the stacker door."

    ui.get_user_ready(
        "Make sure there is NO labware in the stacker tower or gripper position"
    )
    print(f"Getting runtime baseline.")
    runtime_baseline_x = await create_runtime_baseline(stacker, TOFSensor.X)
    runtime_baseline_z = await create_runtime_baseline(stacker, TOFSensor.Z)

    print("Test that we have no labware on the X")
    await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    await test_tof_sensors_labware_detection(
        stacker,
        report,
        section,
        TOFSensor.X,
        "empty",
        StackerAxis.X,
        Direction.RETRACT,
        runtime_baseline_x,
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
        runtime_baseline_x,
    )
    await stacker.home_axis(StackerAxis.X, Direction.EXTEND)

    print("Test that we have no labware on the Z")
    ui.get_user_ready(
        "Make sure there is no labware in the stacker and close the hopper door"
    )
    await stacker.close_latch()
    await test_tof_sensors_labware_detection(
        stacker,
        report,
        section,
        TOFSensor.Z,
        "empty",
        StackerAxis.Z,
        Direction.EXTEND,
        runtime_baseline_z,
    )

    print("Test that we detect tiprack on the Z")
    ui.get_user_ready("Add 1 tiprack to the stacker Z and close the hopper door")
    await test_tof_sensors_labware_detection(
        stacker,
        report,
        section,
        TOFSensor.Z,
        "tiprack",
        StackerAxis.Z,
        Direction.EXTEND,
        runtime_baseline_z,
    )
    ui.get_user_ready("Please remove all labware from the stacker.")
