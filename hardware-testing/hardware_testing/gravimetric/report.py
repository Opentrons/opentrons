"""Report."""
from dataclasses import fields
from enum import Enum
from typing import Optional, List

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVSection,
    CSVLine,
)
from . import config

"""
CSV Test Report:
 - Serial numbers:
   - Robot
   - Pipette
   - Scale
   - Environment sensor
   - Liquid temperature sensor
 - Config [excluding `labware_offsets`]:
   - name
   - pipette_volume
   - pipette_mount
   - tip_volume
   - trials
   - slot_vial
   - slot_tiprack
   - increment
   - low_volume
 - Volumes (per each):
   - Average micro-liters
   - %CV
   - %D
 - Trials (per each):
   - Calculated micro-liters
 - Evaporation:
   - Aspirate average (grams)
   - Dispense average (grams)
 - Environment First/Last/Min/Max:
   - Pipette temperature
   - Air temperature
   - Air humidity
   - Air pressure
   - Liquid temperature
 - Measurements (per each):
   - Grams average
   - Grams %cv
   - Grams min
   - Grams max
   - Start time of samples
   - Duration of samples
   - Number of samples
   - Pipette Temperature
   - Air temperature
   - Air humidity
   - Air pressure
   - Liquid temperature
"""


class MeasurementType(str, Enum):
    """Measurements."""

    INIT = "measure-init"
    ASPIRATE = "measure-aspirate"
    DISPENSE = "measure-dispense"


class EnvironmentReportState(str, Enum):
    """Environment Report State."""

    FIRST = "environment-first"
    LAST = "environment-last"
    MIN = "environment-min"
    MAX = "environment-max"


MEASUREMENT_INFO = [
    "grams-average",
    "grams-cv",
    "grams-min",
    "grams-max",
    "samples-start-time",
    "samples-duration",
    "samples-count",
]


def create_measurement_tag(t: str, volume: Optional[float], trial: int) -> str:
    """Create measurement tag."""
    if volume is None:
        vol_in_tag = "blank"
    else:
        vol_in_tag = str(round(volume, 2))
    return f"{t}-{vol_in_tag}-ul-{trial + 1}"


def create_csv_test_report(
    volumes: List[float], cfg: config.GravimetricConfig, run_id: str
) -> CSVReport:
    """Create CSV test report."""
    env_info = [
        field.name.replace("_", "-") for field in fields(config.EnvironmentData)
    ]
    meas_info = [
        field.name.replace("_", "-") for field in fields(config.MeasurementData)
    ]
    meas_vols = ([None] * config.NUM_BLANK_TRIALS) + volumes  # type: ignore[operator]

    report = CSVReport(
        test_name=cfg.name,
        run_id=run_id,
        sections=[
            CSVSection(
                title="SERIAL-NUMBERS",
                lines=[
                    CSVLine("robot", [str]),
                    CSVLine("pipette", [str]),
                    CSVLine("scale", [str]),
                    CSVLine("environment", [str]),
                    CSVLine("liquid", [str]),
                ],
            ),
            CSVSection(
                title="CONFIG",
                lines=[
                    CSVLine(field.name, [field.type])
                    for field in fields(config.GravimetricConfig)
                    if field.name not in config.GRAV_CONFIG_EXCLUDE_FROM_REPORT
                ],
            ),
            CSVSection(
                title="VOLUMES",
                lines=[
                    CSVLine(f"volume-{round(v, 2)}-{i}", [float])
                    for v in volumes
                    for i in ["average", "cv", "d"]
                ],
            ),
            CSVSection(
                title="TRIALS",
                lines=[
                    CSVLine(f"trial-{t + 1}-at-{round(v, 2)}-ul", [float])
                    for v in volumes
                    for t in range(cfg.trials)
                ],
            ),
            CSVSection(
                title="EVAPORATION",
                lines=[
                    CSVLine("aspirate-average-grams", [float]),
                    CSVLine("dispense-average-grams", [float]),
                ],
            ),
            CSVSection(
                title="ENVIRONMENT",
                lines=[
                    CSVLine(f"{s}-{i}", [float])
                    for s in EnvironmentReportState
                    for i in env_info
                ],
            ),
            CSVSection(
                title="MEASUREMENTS",
                lines=[
                    CSVLine(create_measurement_tag(m, v, t) + f"-{i}", [float])
                    for v in meas_vols
                    for t in range(cfg.trials)
                    for m in MeasurementType
                    for i in meas_info
                ],
            ),
        ],
    )
    # might as well set the configuration values now
    for field in fields(config.GravimetricConfig):
        if field.name in config.GRAV_CONFIG_EXCLUDE_FROM_REPORT:
            continue
        report("CONFIG", field.name, [getattr(cfg, field.name)])
    return report


def store_serial_numbers(
    report: CSVReport,
    robot: str,
    pipette: str,
    scale: str,
    environment: str,
    liquid: str,
) -> None:
    """Report serial numbers."""
    report("SERIAL-NUMBERS", "robot", [robot])
    report("SERIAL-NUMBERS", "pipette", [pipette])
    report("SERIAL-NUMBERS", "scale", [scale])
    report("SERIAL-NUMBERS", "environment", [environment])
    report("SERIAL-NUMBERS", "liquid", [liquid])


def store_volume(
    report: CSVReport, volume: float, average: float, cv: float, d: float
) -> None:
    """Report volume."""
    vol_in_tag = str(round(volume, 2))
    report("VOLUMES", f"volume-{vol_in_tag}-average", [average])
    report("VOLUMES", f"volume-{vol_in_tag}-cv", [cv])
    report("VOLUMES", f"volume-{vol_in_tag}-d", [d])


def store_trial(report: CSVReport, trial: int, volume: float) -> None:
    """Report trial."""
    vol_in_tag = str(round(volume, 2))
    report("TRIALS", f"trial-{trial + 1}-at-{vol_in_tag}-ul", [volume])


def store_average_evaporation(
    report: CSVReport, aspirate: float, dispense: float
) -> None:
    """Report average evaporation."""
    report("EVAPORATION", "aspirate-average-grams", [aspirate])
    report("EVAPORATION", "dispense-average-grams", [dispense])


def store_environment(
    report: CSVReport,
    state: EnvironmentReportState,
    data: config.EnvironmentData,
) -> None:
    """Report environment."""
    for field in fields(config.EnvironmentData):
        f_tag = field.name.replace("_", "-")
        report("ENVIRONMENT", f"{state}-{f_tag}", [getattr(data, field.name)])


def store_measurement(
    report: CSVReport,
    measurement_type: MeasurementType,
    volume: Optional[float],
    trial: int,
    data: config.MeasurementData,
) -> None:
    """Report measurement."""
    tag_root = create_measurement_tag(measurement_type, volume, trial)
    for field in fields(config.EnvironmentData):
        f_tag = field.name.replace("_", "-")
        report("MEASUREMENTS", f"{tag_root}-{f_tag}", [getattr(data, field.name)])
