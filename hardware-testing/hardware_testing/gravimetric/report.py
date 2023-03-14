"""Report."""
from dataclasses import fields
from enum import Enum
from typing import List, Tuple

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVSection,
    CSVLine,
)
from hardware_testing.gravimetric.measurement import (
    EnvironmentData,
    MeasurementData,
    MeasurementType,
)
from . import config
from .measurement import create_measurement_tag

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
   - Aspirate Average
   - Aspirate %CV
   - Aspirate %D
   - Dispense Average
   - Dispense %CV
   - Dispense %D
 - Trials (per each):
   - Aspirate micro-liters
   - Dispense micro-liters
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


class EnvironmentReportState(str, Enum):
    """Environment Report State."""

    FIRST = "environment-first"
    LAST = "environment-last"
    MIN = "environment-min"
    MAX = "environment-max"


def create_csv_test_report(
    volumes: List[float], cfg: config.GravimetricConfig, run_id: str
) -> CSVReport:
    """Create CSV test report."""
    env_info = [field.name.replace("_", "-") for field in fields(EnvironmentData)]
    meas_info = [field.name.replace("_", "-") for field in fields(MeasurementData)]
    meas_vols = [
        (
            None,
            t,
        )
        for t in range(config.NUM_BLANK_TRIALS)
    ]
    for v in volumes:
        meas_vols += [
            (
                v,  # type: ignore[misc]
                t,
            )
            for t in range(cfg.trials)
        ]

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
                    CSVLine(f"volume-{m}-{round(v, 2)}-{i}", [float])
                    for v in volumes
                    for m in ["aspirate", "dispense"]
                    for i in ["average", "cv", "d"]
                ],
            ),
            CSVSection(
                title="TRIALS",
                lines=[
                    CSVLine(f"trial-{t + 1}-{m}-{round(v, 2)}-ul", [float])
                    for v in volumes
                    for t in range(cfg.trials)
                    for m in ["aspirate", "dispense"]
                ],
            ),
            CSVSection(
                title="EVAPORATION",
                lines=[
                    CSVLine("aspirate-average-ul", [float]),
                    CSVLine("dispense-average-ul", [float]),
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
                    for v, t in meas_vols
                    for m in MeasurementType
                    for i in meas_info
                    if v is not None or t < config.NUM_BLANK_TRIALS
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
    report: CSVReport, mode: str, volume: float, average: float, cv: float, d: float
) -> None:
    """Report volume."""
    assert mode in ["aspirate", "dispense"]
    vol_in_tag = str(round(volume, 2))
    report("VOLUMES", f"volume-{mode}-{vol_in_tag}-average", [round(average, 2)])
    report("VOLUMES", f"volume-{mode}-{vol_in_tag}-cv", [round(cv * 100.0, 2)])
    report("VOLUMES", f"volume-{mode}-{vol_in_tag}-d", [round(d * 100.0, 2)])


def get_volume_results(
    report: CSVReport, mode: str, volume: float
) -> Tuple[float, float, float]:
    """Get volume results."""
    assert mode in ["aspirate", "dispense"]
    vol_in_tag = str(round(volume, 2))
    average = report["VOLUMES"][f"volume-{mode}-{vol_in_tag}-average"]
    cv = report["VOLUMES"][f"volume-{mode}-{vol_in_tag}-cv"]
    d = report["VOLUMES"][f"volume-{mode}-{vol_in_tag}-d"]
    return average.data[0], cv.data[0], d.data[0]  # type: ignore[union-attr]


def store_trial(
    report: CSVReport, trial: int, volume: float, aspirate: float, dispense: float
) -> None:
    """Report trial."""
    vol_in_tag = str(round(volume, 2))
    report("TRIALS", f"trial-{trial + 1}-aspirate-{vol_in_tag}-ul", [aspirate])
    report("TRIALS", f"trial-{trial + 1}-dispense-{vol_in_tag}-ul", [dispense])


def store_average_evaporation(
    report: CSVReport, aspirate: float, dispense: float
) -> None:
    """Report average evaporation."""
    report("EVAPORATION", "aspirate-average-ul", [aspirate])
    report("EVAPORATION", "dispense-average-ul", [dispense])


def store_environment(
    report: CSVReport,
    state: EnvironmentReportState,
    data: EnvironmentData,
) -> None:
    """Report environment."""
    for field in fields(EnvironmentData):
        f_tag = field.name.replace("_", "-")
        report("ENVIRONMENT", f"{state}-{f_tag}", [getattr(data, field.name)])


def store_measurement(
    report: CSVReport,
    tag: str,
    data: MeasurementData,
) -> None:
    """Report measurement."""
    for field in fields(MeasurementData):
        f_tag = field.name.replace("_", "-")
        report("MEASUREMENTS", f"{tag}-{f_tag}", [getattr(data, field.name)])
