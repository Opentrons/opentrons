"""Report."""
from dataclasses import fields
from enum import Enum
from typing import Optional, List

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
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


class Measurements(str, Enum):
    """Measurements."""

    INIT = "init"
    ASPIRATE = "aspirate"
    DISPENSE = "dispense"


class EnvironmentReportState(str, Enum):
    """Environment Report State."""

    FIRST = "first"
    LAST = "last"
    MIN = "min"
    MAX = "max"


ENVIRONMENT_INFO = [
    "celsius-pipette",
    "celsius-air",
    "humidity-air",
    "pascals-air",
    "celsius-liquid",
]
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
    return f"{t}-{vol_in_tag}-ul-{trial}"


def create_csv_test_report(
    volumes: List[float], cfg: config.GravimetricConfig, run_id: str
) -> CSVReport:
    """Create CSV test report."""
    def _create_measurement_lines(
        volume: Optional[float], trials: int
    ) -> List[CSVLine]:
        return [
            CSVLine(
                create_measurement_tag(f"measure-{m}", volume, t) + f"-{info}",
                [str, str, str, str],
            )
            for m in Measurements
            for t in range(trials)
            for info in (MEASUREMENT_INFO + ENVIRONMENT_INFO)
        ]

    all_measurement_lines = _create_measurement_lines(None, config.NUM_BLANK_TRIALS)
    for v in volumes:
        for line in _create_measurement_lines(v, cfg.trials):
            all_measurement_lines.append(line)

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
                    CSVLine("liquid-temperature", [str]),
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
                    CSVLine(f"volume-{round(v, 2)}-{t}", [float])
                    for v in volumes
                    for t in ["average", "cv", "d"]
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
                    CSVLine(f"environment-{s}-{i}", [float])
                    for s in EnvironmentReportState
                    for i in ENVIRONMENT_INFO
                ],
            ),
            CSVSection(
                title="MEASUREMENTS",
                lines=all_measurement_lines,  # type: ignore[arg-type]
            ),
        ],
    )
    # might as well set the configuration values now
    for field in fields(config.GravimetricConfig):
        if field.name in config.GRAV_CONFIG_EXCLUDE_FROM_REPORT:
            continue
        report("CONFIG", field.name, [getattr(cfg, field.name)])
    return report


def report_serial_numbers(
    robot: str, pipette: str, scale: str, environment: str, liquid: str
) -> None:
    """Report serial numbers."""
    return


def report_volume(volume: float, average: float, cv: float, d: float) -> None:
    """Report volume."""
    return


def report_trial(trial: int, volume: float) -> None:
    """Report trial."""
    return


def report_average_evaporation(aspirate: float, dispense: float) -> None:
    """Report average evaporation."""
    return


def report_environment(
    state: EnvironmentReportState,
    pipette_celsius: float,
    air_celsius: float,
    air_relative_humidity: float,
    air_pascals: float,
    liquid_celsius: float,
) -> None:
    """Report environment."""
    return
